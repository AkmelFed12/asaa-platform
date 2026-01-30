const { pool } = require('./db');
const { sendQuizReminderEmail, sendDailyQuizSummaryEmail } = require('./emailService');
const { sendWhatsAppMessage } = require('./whatsappService');
const { beginJob, finishJob, normalizeJobDate } = require('./jobTracker');

const getToday = () => new Date().toISOString().split('T')[0];

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `225${digits.slice(1)}`;
  }
  return digits;
};

const buildDailySummary = async (quizDate = getToday()) => {
  const { rows: summaryRows } = await pool.query(
    `SELECT
       COUNT(*)::int AS attempts,
       COUNT(DISTINCT a.user_id)::int AS participants,
       ROUND(AVG(a.score)::numeric, 2) AS avg_score,
       ROUND(AVG(a.percentage)::numeric, 2) AS avg_percentage,
       COALESCE(MAX(a.score), 0)::int AS best_score
     FROM daily_quiz_attempts a
     JOIN daily_quizzes dq ON dq.id = a.quiz_id
     WHERE dq.quiz_date = $1
       AND a.completed_at IS NOT NULL`,
    [quizDate]
  );

  const { rows: levels } = await pool.query(
    `SELECT dq.quiz_level,
            COUNT(*)::int AS attempts,
            COUNT(DISTINCT a.user_id)::int AS participants
     FROM daily_quiz_attempts a
     JOIN daily_quizzes dq ON dq.id = a.quiz_id
     WHERE dq.quiz_date = $1
       AND a.completed_at IS NOT NULL
     GROUP BY dq.quiz_level
     ORDER BY dq.quiz_level`,
    [quizDate]
  );

  const { rows: leaderboard } = await pool.query(
    `SELECT
       ROW_NUMBER() OVER (ORDER BY a.score DESC, a.time_spent_seconds ASC, a.completed_at ASC) AS rank,
       COALESCE(a.user_name, 'Participant') AS user_name,
       a.score,
       a.percentage,
       a.level,
       a.time_spent_seconds
     FROM daily_quiz_attempts a
     JOIN daily_quizzes dq ON dq.id = a.quiz_id
     WHERE dq.quiz_date = $1
       AND a.completed_at IS NOT NULL
     ORDER BY a.score DESC, a.time_spent_seconds ASC, a.completed_at ASC
     LIMIT 5`,
    [quizDate]
  );

  return {
    date: quizDate,
    summary: summaryRows[0] || {
      attempts: 0,
      participants: 0,
      avg_score: 0,
      avg_percentage: 0,
      best_score: 0
    },
    levels: levels.map((row) => ({
      level: row.quiz_level,
      attempts: row.attempts,
      participants: row.participants
    })),
    top: leaderboard.map((row) => ({
      rank: row.rank,
      name: row.user_name,
      score: row.score,
      percentage: row.percentage,
      level: row.level,
      timeSpentSeconds: row.time_spent_seconds
    }))
  };
};

const runQuizReminder = async ({ quizDate = getToday(), force = false } = {}) => {
  const job = await beginJob('quiz_reminder', quizDate, force);
  if (!job.shouldRun) {
    return { skipped: true, jobDate: job.jobDate };
  }

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name,
              m.phone,
              COALESCE(mpe.notify_email, TRUE) AS notify_email,
              COALESCE(mpe.notify_whatsapp, TRUE) AS notify_whatsapp
       FROM users u
       JOIN members m ON m.user_id = u.id
       LEFT JOIN member_profile_extras mpe ON mpe.user_id = u.id
       WHERE m.status = 'active'
         AND NOT EXISTS (
           SELECT 1
           FROM daily_quiz_attempts a
           JOIN daily_quizzes dq ON dq.id = a.quiz_id
           WHERE dq.quiz_date = $1
             AND a.user_id = u.id::text
             AND a.completed_at IS NOT NULL
         )`,
      [quizDate]
    );

    let emailed = 0;
    let whatsapp = 0;
    for (const user of rows) {
      const fullName = `${user.first_name} ${user.last_name}`.trim() || 'Participant';
      if (user.notify_email && user.email) {
        // eslint-disable-next-line no-await-in-loop
        const sent = await sendQuizReminderEmail(user.email, fullName, quizDate);
        if (sent) emailed += 1;
      }
      if (user.notify_whatsapp && user.phone) {
        const phone = normalizePhone(user.phone);
        if (phone) {
          // eslint-disable-next-line no-await-in-loop
          const waResult = await sendWhatsAppMessage(phone, `Rappel: le quiz du ${quizDate} est ouvert a 20h00. Bonne chance!`);
          if (waResult?.ok) whatsapp += 1;
        }
      }
    }

    const details = { totalTargets: rows.length, emailed, whatsapp };
    await finishJob('quiz_reminder', quizDate, 'completed', details);
    return { success: true, ...details };
  } catch (error) {
    await finishJob('quiz_reminder', quizDate, 'failed', { error: error.message });
    throw error;
  }
};

const getAdminRecipients = async () => {
  const envRecipients = String(process.env.QUIZ_ADMIN_RECIPIENTS || '').trim();
  if (envRecipients) {
    return envRecipients.split(',').map((item) => item.trim()).filter(Boolean);
  }

  const { rows } = await pool.query(
    `SELECT email
     FROM users
     WHERE role IN ('admin', 'quiz_moderator')`
  );
  const emails = rows.map((row) => row.email).filter(Boolean);
  if (emails.length > 0) return emails;
  const fallback = process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : [];
  return fallback;
};

const runQuizSummary = async ({ quizDate = getToday(), force = false } = {}) => {
  const job = await beginJob('quiz_summary', quizDate, force);
  if (!job.shouldRun) {
    return { skipped: true, jobDate: job.jobDate };
  }

  try {
    const summary = await buildDailySummary(quizDate);
    const recipients = await getAdminRecipients();
    let sent = 0;
    for (const email of recipients) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await sendDailyQuizSummaryEmail(email, summary);
      if (ok) sent += 1;
    }

    const details = {
      recipients: recipients.length,
      sent,
      summary: summary.summary
    };
    await finishJob('quiz_summary', quizDate, 'completed', details);
    return { success: true, ...details };
  } catch (error) {
    await finishJob('quiz_summary', quizDate, 'failed', { error: error.message });
    throw error;
  }
};

module.exports = {
  buildDailySummary,
  runQuizReminder,
  runQuizSummary,
  normalizeJobDate
};
