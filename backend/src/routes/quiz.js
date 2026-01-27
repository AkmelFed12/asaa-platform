const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { calculateLevel } = require('../utils/quizEngine');
const { sendQuizNotification } = require('../utils/emailService');
const websocketManager = require('../utils/websocketManager');
const { requireAdmin } = require('../middleware/auth');
const multer = require('multer');

const DAILY_QUESTION_COUNT = 20;
const TIME_PER_QUESTION = 10;
const QUIZ_OPEN_HOUR = 20;
const QUIZ_CLOSE_HOUR = 23;
const QUIZ_CLOSE_MINUTE = 59;
const QUIZ_TIMEZONE = 'Africa/Abidjan';
const CSV_IMPORT_LIMIT = 500;
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const VALID_STATUSES = new Set(['draft', 'review', 'validated', 'archived']);
const VALID_DAILY_LEVELS = new Set(['easy', 'medium', 'hard', 'random']);
const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    const isCsv = file.mimetype === 'text/csv' || name.endsWith('.csv');
    if (!isCsv) {
      return cb(new Error('CSV file required'));
    }
    cb(null, true);
  }
});

const parseCsvLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((value) => value.trim());
};

const parseCsv = (content) => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows = [];

  for (let i = 0; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    if (i === 0 && String(values[0] || '').toLowerCase() === 'question') {
      continue;
    }
    rows.push(values);
  }

  return rows;
};

const normalizeDifficulty = (value) => {
  const lowered = String(value || '').toLowerCase();
  return VALID_DIFFICULTIES.has(lowered) ? lowered : null;
};

const normalizeDailyLevel = (value) => {
  const lowered = String(value || '').toLowerCase().trim();
  if (['moyen', 'medium'].includes(lowered)) return 'medium';
  if (['difficile', 'hard'].includes(lowered)) return 'hard';
  if (['aleatoire', 'random'].includes(lowered)) return 'random';
  if (['facile', 'easy'].includes(lowered)) return 'easy';
  if (VALID_DAILY_LEVELS.has(lowered)) return lowered;
  return 'random';
};

const normalizeStatus = (value) => {
  const lowered = String(value || '').toLowerCase().trim();
  if (!lowered) return null;
  return VALID_STATUSES.has(lowered) ? lowered : null;
};

const normalizeSource = (value) => {
  const text = String(value || '').trim();
  return text.length ? text : null;
};

const parseTagsInput = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  const text = String(value).trim();
  if (!text) {
    return [];
  }
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Fall back to comma split.
    }
  }
  return text.split(',');
};

const normalizeTags = (value) => {
  const raw = parseTagsInput(value);
  const tags = [];
  const seen = new Set();
  raw.forEach((item) => {
    const trimmed = String(item || '').trim().toLowerCase();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    tags.push(trimmed);
  });
  return tags.length ? tags : null;
};

const normalizeQuestionText = (value) => (
  String(value || '').toLowerCase().replace(/\s+/g, ' ').trim()
);

const parseStatusFilter = (value) => {
  const result = { statuses: [], includeLegacy: false };
  if (!value) return result;
  const parts = String(value)
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  parts.forEach((part) => {
    if (['legacy', 'none', 'null'].includes(part)) {
      result.includeLegacy = true;
      return;
    }
    if (VALID_STATUSES.has(part)) {
      result.statuses.push(part);
    }
  });
  return result;
};

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

async function getOrCreateDailyQuiz(level) {
  const quizDate = getToday();
  const quizLevel = normalizeDailyLevel(level);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertQuiz = await client.query(
      `INSERT INTO daily_quizzes (quiz_date, quiz_level)
       VALUES ($1, $2)
       ON CONFLICT (quiz_date, quiz_level) DO NOTHING
       RETURNING id`,
      [quizDate, quizLevel]
    );

    let quizId = insertQuiz.rows[0]?.id;
    if (!quizId) {
      const existing = await client.query(
        'SELECT id FROM daily_quizzes WHERE quiz_date = $1 AND quiz_level = $2',
        [quizDate, quizLevel]
      );
      quizId = existing.rows[0]?.id;
    }

    const { rows: existingQuestions } = await client.query(
      'SELECT COUNT(*)::int AS count FROM daily_quiz_questions WHERE quiz_id = $1',
      [quizId]
    );

    if (existingQuestions[0].count === 0) {
      const params = [];
      let difficultyFilter = '';
      if (['easy', 'medium', 'hard'].includes(quizLevel)) {
        params.push(quizLevel);
        difficultyFilter = `AND q.difficulty = $${params.length}`;
      }
      params.push(DAILY_QUESTION_COUNT);
      const limitParam = `$${params.length}`;

      const { rows: questions } = await client.query(
        `WITH used_texts AS (
           SELECT LOWER(REGEXP_REPLACE(q.question_text, '[[:space:]]+', ' ', 'g')) AS norm_text
           FROM quiz_question_usage u
           JOIN quiz_questions q ON q.id = u.question_id
         ),
         candidate_questions AS (
           SELECT q.id, q.question_text, q.options, q.correct_index, q.difficulty,
                  LOWER(REGEXP_REPLACE(q.question_text, '[[:space:]]+', ' ', 'g')) AS norm_text
           FROM quiz_questions q
           WHERE q.is_active = TRUE
             AND (q.status IS NULL OR q.status = 'validated')
             ${difficultyFilter}
             AND q.id NOT IN (SELECT question_id FROM quiz_question_usage)
             AND NOT EXISTS (
               SELECT 1 FROM used_texts ut
               WHERE ut.norm_text = LOWER(REGEXP_REPLACE(q.question_text, '[[:space:]]+', ' ', 'g'))
             )
         )
         SELECT DISTINCT ON (norm_text) id, question_text, options, correct_index, difficulty
         FROM candidate_questions
         ORDER BY norm_text, RANDOM()
         LIMIT ${limitParam}`,
        params
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
    return { quizId, quizDate, quizLevel };
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

const recordQuestionVersion = async (client, question, changeType, changedBy, note = null) => {
  if (!question?.id) return;
  await client.query(
    `INSERT INTO quiz_question_versions
     (question_id, question_text, options, correct_index, difficulty, source, tags, status, created_by,
      change_type, changed_by, note)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      question.id,
      question.question_text,
      JSON.stringify(question.options || []),
      question.correct_index,
      question.difficulty,
      question.source || null,
      question.tags || null,
      question.status || null,
      question.created_by || null,
      changeType,
      changedBy || null,
      note
    ]
  );
};

router.get('/daily/quiz', async (req, res, next) => {
  if (!ensureQuizOpen(res)) {
    return;
  }

  try {
    const { quizId, quizDate, quizLevel } = await getOrCreateDailyQuiz(req.query.level);
    const questions = await getDailyQuestions(quizId);

    res.json({
      success: true,
      date: quizDate,
      level: quizLevel,
      totalQuestions: DAILY_QUESTION_COUNT,
      timePerQuestion: TIME_PER_QUESTION,
      questions
    });
  } catch (error) {
    next(error);
  }
});

router.get('/daily/admin/quiz', requireAdmin, async (req, res, next) => {
  try {
    const { quizId, quizDate, quizLevel } = await getOrCreateDailyQuiz(req.query.level);
    const { rows } = await pool.query(
      `SELECT dq.position, q.id, q.question_text, q.options, q.difficulty
       FROM daily_quiz_questions dq
       JOIN quiz_questions q ON q.id = dq.question_id
       WHERE dq.quiz_id = $1
       ORDER BY dq.position`,
      [quizId]
    );

    res.json({
      success: true,
      date: quizDate,
      level: quizLevel,
      questions: rows.map((row) => ({
        id: row.id,
        position: row.position,
        question: row.question_text,
        options: row.options,
        difficulty: row.difficulty
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.post('/daily/admin/reorder', requireAdmin, async (req, res, next) => {
  const { order } = req.body;
  if (!Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ error: 'Order array required' });
  }

  const normalizedOrder = order.map((id) => Number(id));
  if (normalizedOrder.some((id) => Number.isNaN(id))) {
    return res.status(400).json({ error: 'Order must contain valid question ids' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { quizId } = await getOrCreateDailyQuiz(req.body.level || req.query.level);
    const { rows: attemptRows } = await client.query(
      'SELECT COUNT(*)::int AS count FROM daily_quiz_attempts WHERE quiz_id = $1',
      [quizId]
    );

    if (attemptRows[0].count > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Quiz already started' });
    }

    const { rows: existingRows } = await client.query(
      'SELECT question_id FROM daily_quiz_questions WHERE quiz_id = $1',
      [quizId]
    );

    const existingIds = existingRows.map((row) => row.question_id);
    if (existingIds.length !== normalizedOrder.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Order length mismatch' });
    }

    const existingSet = new Set(existingIds);
    for (const id of normalizedOrder) {
      if (!existingSet.has(id)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Order does not match daily quiz' });
      }
    }

    const values = [];
    const placeholders = normalizedOrder.map((id, index) => {
      const offset = index * 2;
      values.push(id, index);
      return `($${offset + 1}, $${offset + 2})`;
    });
    values.push(quizId);

    await client.query(
      `WITH new_positions (question_id, position) AS (
         VALUES ${placeholders.join(', ')}
       )
       UPDATE daily_quiz_questions dq
       SET position = np.position
       FROM new_positions np
       WHERE dq.quiz_id = $${values.length}
         AND dq.question_id = np.question_id`,
      values
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.get('/daily/admin/history', requireAdmin, async (req, res, next) => {
  const days = Math.min(Number(req.query.days) || 7, 30);
  const quizLevel = normalizeDailyLevel(req.query.level);
  try {
    const { rows: quizRows } = await pool.query(
      `SELECT id, quiz_date, quiz_level
       FROM daily_quizzes
       WHERE quiz_level = $1
       ORDER BY quiz_date DESC
       LIMIT $2`,
      [quizLevel, days]
    );

    if (quizRows.length === 0) {
      return res.json({ success: true, history: [] });
    }

    const quizIds = quizRows.map((row) => row.id);
    const { rows: questionRows } = await pool.query(
      `SELECT dq.quiz_id, dq.position, q.id, q.question_text, q.options, q.difficulty
       FROM daily_quiz_questions dq
       JOIN quiz_questions q ON q.id = dq.question_id
       WHERE dq.quiz_id = ANY($1::bigint[])
       ORDER BY dq.quiz_id, dq.position`,
      [quizIds]
    );

    const questionMap = new Map();
    for (const row of questionRows) {
      if (!questionMap.has(row.quiz_id)) {
        questionMap.set(row.quiz_id, []);
      }
      questionMap.get(row.quiz_id).push({
        id: row.id,
        position: row.position,
        question: row.question_text,
        options: row.options,
        difficulty: row.difficulty
      });
    }

    const history = quizRows.map((row) => ({
      quizId: row.id,
      date: row.quiz_date,
      level: row.quiz_level,
      questions: questionMap.get(row.id) || []
    }));

    res.json({ success: true, history });
  } catch (error) {
    next(error);
  }
});

router.post('/daily/admin/cleanup', requireAdmin, async (req, res, next) => {
  const quizDate = getToday();
  const quizLevel = normalizeDailyLevel(req.body.level || req.query.level);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: quizRows } = await client.query(
      'SELECT id FROM daily_quizzes WHERE quiz_date = $1 AND quiz_level = $2',
      [quizDate, quizLevel]
    );
    const quizId = quizRows[0]?.id;

    if (quizId) {
      const { rows: attemptRows } = await client.query(
        'SELECT COUNT(*)::int AS count FROM daily_quiz_attempts WHERE quiz_id = $1',
        [quizId]
      );
      if (attemptRows[0].count > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Quiz already started' });
      }
    }

    if (quizId) {
      await client.query('DELETE FROM daily_quizzes WHERE id = $1', [quizId]);
    }

    await client.query('COMMIT');
    res.json({ success: true, deletedQuestions: 0 });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.post('/daily/admin/generate', requireAdmin, async (req, res, next) => {
  const { difficulty, keyword, level } = req.body;
  const normalizedKeyword = typeof keyword === 'string' ? keyword.trim() : '';
  const quizLevel = normalizeDailyLevel(level);
  const normalizedDifficulty = normalizeDifficulty(difficulty)
    || (['easy', 'medium', 'hard'].includes(quizLevel) ? quizLevel : '');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { quizId } = await getOrCreateDailyQuiz(quizLevel);
    const { rows: attemptRows } = await client.query(
      'SELECT COUNT(*)::int AS count FROM daily_quiz_attempts WHERE quiz_id = $1',
      [quizId]
    );

    if (attemptRows[0].count > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Quiz already started' });
    }

    await client.query('DELETE FROM daily_quiz_questions WHERE quiz_id = $1', [quizId]);

    const params = [];
    let filterQuery = `
      WITH used_texts AS (
        SELECT LOWER(REGEXP_REPLACE(q.question_text, '[[:space:]]+', ' ', 'g')) AS norm_text
        FROM quiz_question_usage u
        JOIN quiz_questions q ON q.id = u.question_id
      ),
      candidate_questions AS (
        SELECT q.id, q.question_text, q.options, q.correct_index, q.difficulty,
               LOWER(REGEXP_REPLACE(q.question_text, '[[:space:]]+', ' ', 'g')) AS norm_text
        FROM quiz_questions q
        WHERE q.is_active = TRUE
          AND (q.status IS NULL OR q.status = 'validated')
          AND q.id NOT IN (SELECT question_id FROM quiz_question_usage)
          AND NOT EXISTS (
            SELECT 1 FROM used_texts ut
            WHERE ut.norm_text = LOWER(REGEXP_REPLACE(q.question_text, '[[:space:]]+', ' ', 'g'))
          )
    `;

    if (normalizedDifficulty) {
      params.push(normalizedDifficulty);
      filterQuery += ` AND q.difficulty = $${params.length}`;
    }
    if (normalizedKeyword) {
      params.push(`%${normalizedKeyword}%`);
      filterQuery += ` AND q.question_text ILIKE $${params.length}`;
    }

    params.push(DAILY_QUESTION_COUNT);
    filterQuery += `
      )
      SELECT DISTINCT ON (norm_text) id, question_text, options, correct_index, difficulty
      FROM candidate_questions
      ORDER BY norm_text, RANDOM()
      LIMIT $${params.length}
    `;

    const { rows: questions } = await client.query(filterQuery, params);
    if (questions.length < DAILY_QUESTION_COUNT) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough questions for this filter' });
    }

    const quizDate = getToday();
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

    await client.query('COMMIT');
    res.json({ success: true, count: questions.length });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.post('/daily/admin/replace', requireAdmin, async (req, res, next) => {
  const { position, newQuestionId } = req.body;
  const numericPosition = Number(position);
  const numericQuestionId = Number(newQuestionId);

  if (Number.isNaN(numericPosition) || Number.isNaN(numericQuestionId)) {
    return res.status(400).json({ error: 'Position and question id required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { quizId } = await getOrCreateDailyQuiz(req.body.level || req.query.level);
    const { rows: attemptRows } = await client.query(
      'SELECT COUNT(*)::int AS count FROM daily_quiz_attempts WHERE quiz_id = $1',
      [quizId]
    );

    if (attemptRows[0].count > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Quiz already started' });
    }

    const { rows: currentRows } = await client.query(
      `SELECT question_id
       FROM daily_quiz_questions
       WHERE quiz_id = $1 AND position = $2`,
      [quizId, numericPosition]
    );
    const currentQuestionId = currentRows[0]?.question_id;
    if (!currentQuestionId) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Position not found' });
    }

    const { rows: questionRows } = await client.query(
      `SELECT id, question_text, options, difficulty
       FROM quiz_questions
       WHERE id = $1
         AND is_active = TRUE
         AND (status IS NULL OR status = 'validated')`,
      [numericQuestionId]
    );
    const newQuestion = questionRows[0];
    if (!newQuestion) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Question not found' });
    }

    const { rows: usedRows } = await client.query(
      `SELECT 1
       FROM quiz_question_usage u
       JOIN quiz_questions q ON q.id = u.question_id
       WHERE LOWER(REGEXP_REPLACE(q.question_text, '[[:space:]]+', ' ', 'g')) =
             LOWER(REGEXP_REPLACE($1, '[[:space:]]+', ' ', 'g'))
       LIMIT 1`,
      [newQuestion.question_text]
    );
    if (usedRows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Question already used' });
    }

    const { rows: duplicateRows } = await client.query(
      'SELECT 1 FROM daily_quiz_questions WHERE quiz_id = $1 AND question_id = $2',
      [quizId, numericQuestionId]
    );
    if (duplicateRows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Question already in daily quiz' });
    }

    await client.query(
      `UPDATE daily_quiz_questions
       SET question_id = $1
       WHERE quiz_id = $2 AND position = $3`,
      [numericQuestionId, quizId, numericPosition]
    );

    await client.query(
      `INSERT INTO quiz_question_usage (question_id, quiz_date)
       VALUES ($1, $2)
       ON CONFLICT (question_id) DO NOTHING`,
      [numericQuestionId, getToday()]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      question: {
        id: newQuestion.id,
        question: newQuestion.question_text,
        options: newQuestion.options,
        difficulty: newQuestion.difficulty,
        position: numericPosition
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.post('/daily/start', async (req, res, next) => {
  if (!ensureQuizOpen(res)) {
    return;
  }

  const { userId, email, name, level } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const { quizId } = await getOrCreateDailyQuiz(level);
    const { rows: completedRows } = await pool.query(
      `SELECT id FROM daily_quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2 AND completed_at IS NOT NULL
       LIMIT 1`,
      [quizId, userId]
    );

    if (completedRows[0]) {
      return res.status(409).json({
        error: 'Quiz already completed today'
      });
    }

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

  const { userId, questionIndex, selectedIndex, timeSpent, level } = req.body;

  if (userId === undefined || questionIndex === undefined) {
    return res.status(400).json({ error: 'User ID and question index required' });
  }

  try {
    const { quizId } = await getOrCreateDailyQuiz(level);
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

  const { userId, level } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const { quizId } = await getOrCreateDailyQuiz(level);
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
  const { question, options, correctIndex, difficulty, source, tags, status } = req.body;
  if (!question || !options || correctIndex === undefined || !difficulty) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Options must be an array' });
  }

  const normalizedSource = normalizeSource(source);
  const normalizedTags = normalizeTags(tags);
  const normalizedStatus = normalizeStatus(status) || 'draft';
  const createdBy = req.user?.email || 'admin';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO quiz_questions
       (question_text, options, correct_index, difficulty, source, tags, status, created_by)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6::text[], $7, $8)
       RETURNING id, question_text, options, correct_index, difficulty, source, tags, status, created_by`,
      [
        question,
        JSON.stringify(options),
        correctIndex,
        difficulty,
        normalizedSource,
        normalizedTags,
        normalizedStatus,
        createdBy
      ]
    );

    await recordQuestionVersion(client, rows[0], 'create', createdBy);
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      question: {
        id: rows[0].id,
        question: rows[0].question_text,
        options: rows[0].options,
        correctIndex: rows[0].correct_index,
        difficulty: rows[0].difficulty,
        source: rows[0].source,
        tags: rows[0].tags,
        status: rows[0].status,
        createdBy: rows[0].created_by
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.get('/questions', requireAdmin, async (req, res, next) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const unusedOnly = req.query.unused === 'true';
  const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty.trim() : '';
  const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const tagsFilter = typeof req.query.tags === 'string' ? req.query.tags.trim() : '';

  try {
    let query = `
      SELECT id, question_text, options, correct_index, difficulty, source, tags, status, created_at, updated_at, created_by
      FROM quiz_questions
    `;
    const params = [];
    const conditions = [];
    if (unusedOnly) {
      conditions.push('id NOT IN (SELECT question_id FROM quiz_question_usage)');
    }
    if (difficulty) {
      params.push(difficulty);
      conditions.push(`difficulty = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`question_text ILIKE $${params.length}`);
    }
    if (statusFilter) {
      const { statuses, includeLegacy } = parseStatusFilter(statusFilter);
      if (includeLegacy && statuses.length > 0) {
        params.push(statuses);
        conditions.push(`(status = ANY($${params.length}::text[]) OR status IS NULL)`);
      } else if (includeLegacy) {
        conditions.push('status IS NULL');
      } else if (statuses.length > 0) {
        params.push(statuses);
        conditions.push(`status = ANY($${params.length}::text[])`);
      }
    }
    if (tagsFilter) {
      const tags = normalizeTags(tagsFilter);
      if (tags?.length) {
        params.push(tags);
        conditions.push(`tags && $${params.length}::text[]`);
      }
    }
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    params.push(limit, offset);
    query += `
      ORDER BY created_at DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `;

    const { rows } = await pool.query(query, params);
    res.json({
      success: true,
      questions: rows.map((row) => ({
        id: row.id,
        question: row.question_text,
        options: row.options,
        correctIndex: row.correct_index,
        difficulty: row.difficulty,
        source: row.source,
        tags: row.tags,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by
      })),
      limit,
      offset,
      hasMore: rows.length === limit
    });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/stats', requireAdmin, async (req, res, next) => {
  try {
    const today = getToday();
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM quiz_questions) AS total_questions,
         (SELECT COUNT(*)::int FROM quiz_questions
          WHERE id NOT IN (SELECT question_id FROM quiz_question_usage)) AS unused_questions,
         (SELECT COUNT(*)::int FROM quiz_question_usage WHERE quiz_date = $1) AS used_today,
         (SELECT COUNT(*)::int FROM daily_quiz_questions dq
          JOIN daily_quizzes dqz ON dqz.id = dq.quiz_id
          WHERE dqz.quiz_date = $1) AS daily_count`,
      [today]
    );
    res.json({ success: true, stats: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/quality', requireAdmin, async (req, res, next) => {
  const minAttempts = Math.max(Number(req.query.minAttempts) || 20, 5);
  try {
    const { rows: overviewRows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'validated')::int AS validated,
         COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
         COUNT(*) FILTER (WHERE status = 'review')::int AS review,
         COUNT(*) FILTER (WHERE status = 'archived')::int AS archived,
         COUNT(*) FILTER (WHERE status IS NULL)::int AS legacy,
         COUNT(*) FILTER (WHERE source IS NULL OR source = '')::int AS missing_source,
         COUNT(*) FILTER (WHERE tags IS NULL OR array_length(tags, 1) = 0)::int AS missing_tags
       FROM quiz_questions`
    );

    const { rows: duplicateRows } = await pool.query(
      `WITH normalized AS (
         SELECT id,
                question_text,
                LOWER(REGEXP_REPLACE(question_text, '[[:space:]]+', ' ', 'g')) AS norm_text
         FROM quiz_questions
       )
       SELECT
         norm_text,
         MIN(question_text) AS question_text,
         ARRAY_AGG(id ORDER BY id) AS ids,
         COUNT(*)::int AS count
       FROM normalized
       GROUP BY norm_text
       HAVING COUNT(*) > 1
       ORDER BY count DESC, MIN(id)
       LIMIT 50`
    );

    const { rows: tooHard } = await pool.query(
      `WITH performance AS (
         SELECT
           q.id,
           q.question_text,
           COUNT(a.id)::int AS attempts,
           SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS correct,
           (SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::float / COUNT(a.id)) AS accuracy
         FROM quiz_questions q
         JOIN daily_quiz_answers a ON a.question_id = q.id
         GROUP BY q.id, q.question_text
         HAVING COUNT(a.id) >= $1
       )
       SELECT id, question_text, attempts, accuracy
       FROM performance
       WHERE accuracy <= 0.3
       ORDER BY accuracy ASC, attempts DESC
       LIMIT 20`,
      [minAttempts]
    );

    const { rows: tooEasy } = await pool.query(
      `WITH performance AS (
         SELECT
           q.id,
           q.question_text,
           COUNT(a.id)::int AS attempts,
           SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS correct,
           (SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::float / COUNT(a.id)) AS accuracy
         FROM quiz_questions q
         JOIN daily_quiz_answers a ON a.question_id = q.id
         GROUP BY q.id, q.question_text
         HAVING COUNT(a.id) >= $1
       )
       SELECT id, question_text, attempts, accuracy
       FROM performance
       WHERE accuracy >= 0.9
       ORDER BY accuracy DESC, attempts DESC
       LIMIT 20`,
      [minAttempts]
    );

    const { rows: recentVersions } = await pool.query(
      `SELECT id, question_id, question_text, change_type, changed_by, changed_at
       FROM quiz_question_versions
       ORDER BY changed_at DESC
       LIMIT 15`
    );

    res.json({
      success: true,
      overview: overviewRows[0],
      duplicates: duplicateRows.map((row) => ({
        normText: row.norm_text,
        question: row.question_text,
        ids: row.ids,
        count: row.count
      })),
      performance: {
        tooHard: tooHard.map((row) => ({
          id: row.id,
          question: row.question_text,
          attempts: row.attempts,
          accuracy: Number(row.accuracy)
        })),
        tooEasy: tooEasy.map((row) => ({
          id: row.id,
          question: row.question_text,
          attempts: row.attempts,
          accuracy: Number(row.accuracy)
        }))
      },
      recentVersions: recentVersions.map((row) => ({
        id: row.id,
        questionId: row.question_id,
        question: row.question_text,
        changeType: row.change_type,
        changedBy: row.changed_by,
        changedAt: row.changed_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.post('/questions/import', requireAdmin, csvUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file required' });
    }

    const content = req.file.buffer.toString('utf-8');
    const rows = parseCsv(content);
    const prepared = [];
    let skipped = 0;
    const seen = new Set();
    const replaceAll = req.query.replace === 'true';

    for (const row of rows) {
      if (row.length < 6) {
        skipped += 1;
        continue;
      }
      const [
        question,
        option1,
        option2,
        option3,
        option4,
        correctIndexRaw,
        difficultyRaw,
        sourceRaw,
        tagsRaw,
        statusRaw
      ] = row;
      const correctIndex = Number(correctIndexRaw);
      const normalizedQuestion = normalizeQuestionText(question);
      const difficulty = normalizeDifficulty(difficultyRaw) || 'hard';
      const source = normalizeSource(sourceRaw);
      const tags = normalizeTags(tagsRaw);
      const status = normalizeStatus(statusRaw) || 'validated';
      if (!normalizedQuestion || seen.has(normalizedQuestion)) {
        skipped += 1;
        continue;
      }
      if (!option1 || !option2 || !option3 || !option4) {
        skipped += 1;
        continue;
      }
      if (Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        skipped += 1;
        continue;
      }
      seen.add(normalizedQuestion);
      prepared.push({
        question,
        options: [option1, option2, option3, option4],
        correctIndex,
        difficulty,
        source,
        tags,
        status,
        createdBy: 'csv-import'
      });
    }

    if (prepared.length === 0) {
      return res.status(400).json({ error: 'No valid rows to import' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (replaceAll) {
        await client.query('TRUNCATE quiz_questions RESTART IDENTITY CASCADE');
      }
      for (let i = 0; i < prepared.length; i += CSV_IMPORT_LIMIT) {
        const chunk = prepared.slice(i, i + CSV_IMPORT_LIMIT);
        const values = [];
        const placeholders = chunk.map((row, index) => {
          const offset = index * 8;
          values.push(
            row.question,
            JSON.stringify(row.options),
            row.correctIndex,
            row.difficulty,
            row.source,
            row.tags,
            row.status,
            row.createdBy
          );
          return `($${offset + 1}, $${offset + 2}::jsonb, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}::text[], $${offset + 7}, $${offset + 8})`;
        });
        const insertResult = await client.query(
          `INSERT INTO quiz_questions
           (question_text, options, correct_index, difficulty, source, tags, status, created_by)
           VALUES ${placeholders.join(', ')}
           RETURNING id, question_text, options, correct_index, difficulty, source, tags, status, created_by`,
          values
        );

        const versionValues = [];
        const versionPlaceholders = insertResult.rows.map((row, index) => {
          const offset = index * 12;
          versionValues.push(
            row.id,
            row.question_text,
            JSON.stringify(row.options || []),
            row.correct_index,
            row.difficulty,
            row.source,
            row.tags,
            row.status,
            row.created_by,
            'import',
            req.user?.email || 'csv-import',
            replaceAll ? 'replace-all' : null
          );
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}::jsonb, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`;
        });

        if (versionPlaceholders.length > 0) {
          await client.query(
            `INSERT INTO quiz_question_versions
             (question_id, question_text, options, correct_index, difficulty, source, tags, status, created_by,
              change_type, changed_by, note)
             VALUES ${versionPlaceholders.join(', ')}`,
            versionValues
          );
        }
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.json({ success: true, inserted: prepared.length, skipped });
  } catch (error) {
    next(error);
  }
});

router.get('/questions/export/csv', requireAdmin, async (req, res, next) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const unusedOnly = req.query.unused === 'true';
  const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty.trim() : '';
  const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const tagsFilter = typeof req.query.tags === 'string' ? req.query.tags.trim() : '';

  try {
    let query = `
      SELECT id, question_text, options, correct_index, difficulty, source, tags, status, created_at, updated_at, created_by
      FROM quiz_questions
    `;
    const params = [];
    const conditions = [];
    if (unusedOnly) {
      conditions.push('id NOT IN (SELECT question_id FROM quiz_question_usage)');
    }
    if (difficulty) {
      params.push(difficulty);
      conditions.push(`difficulty = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`question_text ILIKE $${params.length}`);
    }
    if (statusFilter) {
      const { statuses, includeLegacy } = parseStatusFilter(statusFilter);
      if (includeLegacy && statuses.length > 0) {
        params.push(statuses);
        conditions.push(`(status = ANY($${params.length}::text[]) OR status IS NULL)`);
      } else if (includeLegacy) {
        conditions.push('status IS NULL');
      } else if (statuses.length > 0) {
        params.push(statuses);
        conditions.push(`status = ANY($${params.length}::text[])`);
      }
    }
    if (tagsFilter) {
      const tags = normalizeTags(tagsFilter);
      if (tags?.length) {
        params.push(tags);
        conditions.push(`tags && $${params.length}::text[]`);
      }
    }
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    const header = 'id,question,options,correct_index,difficulty,source,tags,status,created_at,updated_at,created_by\n';
    const escapeCsv = (value) => {
      const text = String(value ?? '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };
    const lines = rows.map((row) => ([
      row.id,
      escapeCsv(row.question_text),
      escapeCsv(JSON.stringify(row.options)),
      row.correct_index,
      row.difficulty,
      escapeCsv(row.source || ''),
      escapeCsv((row.tags || []).join(',')),
      row.status || '',
      row.created_at.toISOString(),
      row.updated_at ? row.updated_at.toISOString() : '',
      row.created_by
    ].join(',')));

    res.setHeader('Content-Type', 'text/csv');
    res.send(header + lines.join('\n'));
  } catch (error) {
    next(error);
  }
});

router.get('/questions/:id/versions', requireAdmin, async (req, res, next) => {
  const questionId = Number(req.params.id);
  if (!questionId || Number.isNaN(questionId)) {
    return res.status(400).json({ error: 'Invalid question id' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, question_id, question_text, options, correct_index, difficulty,
              source, tags, status, change_type, changed_by, note, changed_at
       FROM quiz_question_versions
       WHERE question_id = $1
       ORDER BY changed_at DESC
       LIMIT 50`,
      [questionId]
    );

    res.json({
      success: true,
      versions: rows.map((row) => ({
        id: row.id,
        questionId: row.question_id,
        question: row.question_text,
        options: row.options,
        correctIndex: row.correct_index,
        difficulty: row.difficulty,
        source: row.source,
        tags: row.tags,
        status: row.status,
        changeType: row.change_type,
        changedBy: row.changed_by,
        note: row.note,
        changedAt: row.changed_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.put('/questions/:id', requireAdmin, async (req, res, next) => {
  const questionId = Number(req.params.id);
  const { question, options, correctIndex, difficulty, source, tags, status } = req.body;

  if (!questionId || Number.isNaN(questionId)) {
    return res.status(400).json({ error: 'Invalid question id' });
  }
  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Invalid question data' });
  }
  if (correctIndex === undefined || Number.isNaN(Number(correctIndex))) {
    return res.status(400).json({ error: 'Invalid correct index' });
  }
  if (!difficulty) {
    return res.status(400).json({ error: 'Invalid difficulty' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: existingRows } = await client.query(
      `SELECT id, question_text, options, correct_index, difficulty, source, tags, status, created_by
       FROM quiz_questions
       WHERE id = $1`,
      [questionId]
    );

    if (!existingRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Question not found' });
    }

    const existing = existingRows[0];
    const normalizedSource = source === undefined ? existing.source : normalizeSource(source);
    const normalizedTags = tags === undefined ? existing.tags : normalizeTags(tags);
    const normalizedStatus = status === undefined ? existing.status : normalizeStatus(status);

    const { rows } = await client.query(
      `UPDATE quiz_questions
       SET question_text = $1,
           options = $2::jsonb,
           correct_index = $3,
           difficulty = $4,
           source = $5,
           tags = $6::text[],
           status = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, question_text, options, correct_index, difficulty, source, tags, status, updated_at`,
      [
        question,
        JSON.stringify(options),
        Number(correctIndex),
        difficulty,
        normalizedSource,
        normalizedTags,
        normalizedStatus,
        questionId
      ]
    );

    await recordQuestionVersion(client, existing, 'update', req.user?.email || null);
    await client.query('COMMIT');

    res.json({
      success: true,
      question: {
        id: rows[0].id,
        question: rows[0].question_text,
        options: rows[0].options,
        correctIndex: rows[0].correct_index,
        difficulty: rows[0].difficulty,
        source: rows[0].source,
        tags: rows[0].tags,
        status: rows[0].status,
        updatedAt: rows[0].updated_at
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
