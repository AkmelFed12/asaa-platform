const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { calculateLevel } = require('../utils/quizEngine');
const { sendQuizNotification } = require('../utils/emailService');
const websocketManager = require('../utils/websocketManager');
const { requireAdmin } = require('../middleware/auth');

const DAILY_QUESTION_COUNT = 20;
const TIME_PER_QUESTION = 10;
const QUIZ_OPEN_HOUR = 20;
const QUIZ_CLOSE_HOUR = 23;
const QUIZ_CLOSE_MINUTE = 59;
const QUIZ_TIMEZONE = 'Africa/Abidjan';

const getToday = () => new Date().toISOString().split('T')[0];
const getTimeInZone = (now, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).formatToParts(now);
  const hour = Number(parts.find(part => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value || 0);
  return { hour, minute };
};

const isQuizOpen = (now = new Date()) => {
  const { hour, minute } = getTimeInZone(now, QUIZ_TIMEZONE);

  if (hour < QUIZ_OPEN_HOUR) return false;
  if (hour > QUIZ_CLOSE_HOUR) return false;
  if (hour === QUIZ_CLOSE_HOUR && minute > QUIZ_CLOSE_MINUTE) return false;

  return true;
};

const ensureQuizOpen = (res) => {
  if (isQuizOpen()) {
    return true;
  }

  res.status(403).json({
    error: 'Quiz closed',
    openFrom: '20:00',
    openUntil: '23:59'
  });
  return false;
};

async function getOrCreateDailyQuiz() {
  const quizDate = getToday();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertQuiz = await client.query(
      `INSERT INTO daily_quizzes (quiz_date)
       VALUES ($1)
       ON CONFLICT (quiz_date) DO NOTHING
       RETURNING id`,
      [quizDate]
    );

    let quizId = insertQuiz.rows[0]?.id;
    if (!quizId) {
      const existing = await client.query(
        'SELECT id FROM daily_quizzes WHERE quiz_date = $1',
        [quizDate]
      );
      quizId = existing.rows[0]?.id;
    }

    const { rows: existingQuestions } = await client.query(
      'SELECT COUNT(*)::int AS count FROM daily_quiz_questions WHERE quiz_id = $1',
      [quizId]
    );

    if (existingQuestions[0].count === 0) {
      const { rows: questions } = await client.query(
        `SELECT id, question_text, options, correct_index, difficulty
         FROM quiz_questions
         WHERE is_active = TRUE
           AND id NOT IN (SELECT question_id FROM quiz_question_usage)
         ORDER BY RANDOM()
         LIMIT $1`,
        [DAILY_QUESTION_COUNT]
      );

      if (questions.length < DAILY_QUESTION_COUNT) {
        throw new Error('Not enough unused questions to generate daily quiz');
      }

      for (let i = 0; i < questions.length; i += 1) {
        await client.query(
          `INSERT INTO daily_quiz_questions (quiz_id, question_id, position)
           VALUES ($1, $2, $3)`,
          [quizId, questions[i].id, i]
        );
        await client.query(
          `INSERT INTO quiz_question_usage (question_id, quiz_date)
           VALUES ($1, $2)
           ON CONFLICT (question_id) DO NOTHING`,
          [questions[i].id, quizDate]
        );
      }
    }

    await client.query('COMMIT');
    return { quizId, quizDate };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getDailyQuestions(quizId) {
  const { rows } = await pool.query(
    `SELECT dq.position, q.id, q.question_text, q.options, q.difficulty
     FROM daily_quiz_questions dq
     JOIN quiz_questions q ON q.id = dq.question_id
     WHERE dq.quiz_id = $1
     ORDER BY dq.position`,
    [quizId]
  );

  return rows.map((row) => ({
    index: row.position,
    question: row.question_text,
    options: row.options,
    difficulty: row.difficulty
  }));
}

async function getWeeklyLeaderboard(limit = 100) {
  const { rows } = await pool.query(
    `WITH weekly AS (
       SELECT DISTINCT ON (user_id)
         user_id,
         COALESCE(user_name, 'Participant') AS user_name,
         score,
         percentage,
         level,
         time_spent_seconds
       FROM daily_quiz_attempts
       WHERE completed_at >= date_trunc('week', NOW())
         AND completed_at < date_trunc('week', NOW()) + INTERVAL '1 week'
       ORDER BY user_id, score DESC, time_spent_seconds ASC
     ),
     ranked AS (
       SELECT
         ROW_NUMBER() OVER (ORDER BY score DESC, time_spent_seconds ASC) AS rank,
         user_id,
         user_name,
         score,
         percentage,
         level
       FROM weekly
     )
     SELECT * FROM ranked ORDER BY rank LIMIT $1`,
    [limit]
  );

  return rows;
}

async function getWeeklyRank(userId) {
  const { rows } = await pool.query(
    `WITH weekly AS (
       SELECT DISTINCT ON (user_id)
         user_id,
         score,
         time_spent_seconds
       FROM daily_quiz_attempts
       WHERE completed_at >= date_trunc('week', NOW())
         AND completed_at < date_trunc('week', NOW()) + INTERVAL '1 week'
       ORDER BY user_id, score DESC, time_spent_seconds ASC
     ),
     ranked AS (
       SELECT
         ROW_NUMBER() OVER (ORDER BY score DESC, time_spent_seconds ASC) AS rank,
         user_id
       FROM weekly
     )
     SELECT rank FROM ranked WHERE user_id = $1`,
    [userId]
  );

  return rows[0]?.rank || null;
}

router.get('/daily/quiz', async (req, res, next) => {
  if (!ensureQuizOpen(res)) {
    return;
  }

  try {
    const { quizId, quizDate } = await getOrCreateDailyQuiz();
    const questions = await getDailyQuestions(quizId);

    res.json({
      success: true,
      date: quizDate,
      totalQuestions: DAILY_QUESTION_COUNT,
      timePerQuestion: TIME_PER_QUESTION,
      questions
    });
  } catch (error) {
    next(error);
  }
});

router.post('/daily/start', async (req, res, next) => {
  if (!ensureQuizOpen(res)) {
    return;
  }

  const { userId, email, name } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const { quizId } = await getOrCreateDailyQuiz();
    const existing = await pool.query(
      `SELECT id FROM daily_quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2 AND completed_at IS NULL`,
      [quizId, userId]
    );

    if (existing.rows[0]) {
      return res.json({
        success: true,
        attemptId: existing.rows[0].id,
        message: 'Quiz already started'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO daily_quiz_attempts (quiz_id, user_id, user_name, email)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [quizId, userId, name, email]
    );

    res.json({
      success: true,
      attemptId: rows[0].id,
      message: 'Quiz started'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/daily/answer', async (req, res, next) => {
  if (!ensureQuizOpen(res)) {
    return;
  }

  const { userId, questionIndex, selectedIndex, timeSpent } = req.body;

  if (userId === undefined || questionIndex === undefined) {
    return res.status(400).json({ error: 'User ID and question index required' });
  }

  try {
    const { quizId } = await getOrCreateDailyQuiz();
    const { rows: attempts } = await pool.query(
      `SELECT id FROM daily_quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2 AND completed_at IS NULL`,
      [quizId, userId]
    );

    const attemptId = attempts[0]?.id;
    if (!attemptId) {
      return res.status(400).json({ error: 'Quiz not started' });
    }

    const { rows: questionRows } = await pool.query(
      `SELECT q.id, q.correct_index
       FROM daily_quiz_questions dq
       JOIN quiz_questions q ON q.id = dq.question_id
       WHERE dq.quiz_id = $1 AND dq.position = $2`,
      [quizId, questionIndex]
    );

    const question = questionRows[0];
    if (!question) {
      return res.status(400).json({ error: 'Invalid question' });
    }

    const { rows: existingAnswer } = await pool.query(
      `SELECT id FROM daily_quiz_answers
       WHERE attempt_id = $1 AND question_id = $2`,
      [attemptId, question.id]
    );

    if (existingAnswer[0]) {
      return res.status(409).json({ error: 'Question already answered' });
    }

    const isCorrect = selectedIndex === question.correct_index;
    await pool.query(
      `INSERT INTO daily_quiz_answers
       (attempt_id, question_id, selected_index, is_correct, time_spent_seconds)
       VALUES ($1, $2, $3, $4, $5)`,
      [attemptId, question.id, selectedIndex, isCorrect, timeSpent || 0]
    );

    const { rows: scoreRows } = await pool.query(
      `SELECT COUNT(*)::int AS score
       FROM daily_quiz_answers
       WHERE attempt_id = $1 AND is_correct = TRUE`,
      [attemptId]
    );

    const currentScore = scoreRows[0].score;
    await pool.query(
      'UPDATE daily_quiz_attempts SET score = $1 WHERE id = $2',
      [currentScore, attemptId]
    );

    res.json({
      success: true,
      isCorrect,
      correctIndex: question.correct_index,
      currentScore,
      totalQuestions: DAILY_QUESTION_COUNT
    });
  } catch (error) {
    next(error);
  }
});

router.post('/daily/complete', async (req, res, next) => {
  if (!ensureQuizOpen(res)) {
    return;
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const { quizId } = await getOrCreateDailyQuiz();
    const { rows: attempts } = await pool.query(
      `SELECT id, started_at, user_name, email
       FROM daily_quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2 AND completed_at IS NULL`,
      [quizId, userId]
    );

    const attempt = attempts[0];
    if (!attempt) {
      return res.status(400).json({ error: 'Quiz not started' });
    }

    const { rows: scoreRows } = await pool.query(
      `SELECT COUNT(*)::int AS score
       FROM daily_quiz_answers
       WHERE attempt_id = $1 AND is_correct = TRUE`,
      [attempt.id]
    );

    const score = scoreRows[0].score;
    const percentage = Math.round((score / DAILY_QUESTION_COUNT) * 100);
    const level = calculateLevel(score);
    const timeSpent = Math.max(
      0,
      Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000)
    );

    await pool.query(
      `UPDATE daily_quiz_attempts
       SET completed_at = NOW(),
           score = $1,
           percentage = $2,
           level = $3,
           time_spent_seconds = $4
       WHERE id = $5`,
      [score, percentage, level, timeSpent, attempt.id]
    );

    const rank = await getWeeklyRank(userId);

    try {
      if (attempt.email && attempt.user_name) {
        sendQuizNotification(attempt.email, attempt.user_name, {
          score,
          total: DAILY_QUESTION_COUNT,
          percentage,
          level,
          rank
        })
          .then(() => console.log(`Quiz result email sent to ${attempt.email}`))
          .catch(err => console.error('Email error:', err.message));
      }
    } catch (error) {
      console.error('Email service error:', error.message);
    }

    try {
      websocketManager.broadcastToRoom('leaderboard-weekly', 'LEADERBOARD_UPDATE', {
        rank,
        name: attempt.user_name,
        score,
        percentage,
        level
      });
    } catch (error) {
      console.error('WebSocket broadcast error:', error.message);
    }

    res.json({
      success: true,
      message: 'Quiz completed successfully',
      score,
      totalQuestions: DAILY_QUESTION_COUNT,
      percentage,
      level,
      rank
    });
  } catch (error) {
    next(error);
  }
});

router.get('/daily/leaderboard', async (req, res, next) => {
  try {
    const leaderboard = await getWeeklyLeaderboard(100);
    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(DISTINCT user_id)::int AS total
       FROM daily_quiz_attempts
       WHERE completed_at >= date_trunc('week', NOW())
         AND completed_at < date_trunc('week', NOW()) + INTERVAL '1 week'`
    );

    res.json({
      success: true,
      scope: 'week',
      leaderboard: leaderboard.map(entry => ({
        rank: entry.rank,
        name: entry.user_name,
        score: entry.score,
        percentage: entry.percentage,
        level: entry.level
      })),
      totalParticipants: totalRows[0].total
    });
  } catch (error) {
    next(error);
  }
});

router.get('/daily/history/:userId', async (req, res, next) => {
  const { userId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT quiz_id, score, percentage, level, time_spent_seconds, completed_at
       FROM daily_quiz_attempts
       WHERE user_id = $1 AND completed_at IS NOT NULL
       ORDER BY completed_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      history: rows
    });
  } catch (error) {
    next(error);
  }
});

router.post('/questions', requireAdmin, async (req, res, next) => {
  const { question, options, correctIndex, difficulty } = req.body;
  if (!question || !options || correctIndex === undefined || !difficulty) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Options must be an array' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO quiz_questions (question_text, options, correct_index, difficulty, created_by)
       VALUES ($1, $2::jsonb, $3, $4, $5)
       RETURNING id, question_text, options, correct_index, difficulty`,
      [question, JSON.stringify(options), correctIndex, difficulty, 'admin']
    );

    res.status(201).json({
      success: true,
      question: rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
