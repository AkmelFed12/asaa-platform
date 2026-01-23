const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { seedQuestions } = require('./quizSeed');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

async function initializeSchema() {
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Quiz database not initialized.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id BIGSERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_index INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by TEXT NOT NULL DEFAULT 'seed',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_question_usage (
        question_id BIGINT PRIMARY KEY REFERENCES quiz_questions(id) ON DELETE CASCADE,
        quiz_date DATE NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_quizzes (
        id BIGSERIAL PRIMARY KEY,
        quiz_date DATE NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_quiz_questions (
        quiz_id BIGINT NOT NULL REFERENCES daily_quizzes(id) ON DELETE CASCADE,
        question_id BIGINT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        PRIMARY KEY (quiz_id, question_id),
        UNIQUE (quiz_id, position)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_quiz_attempts (
        id BIGSERIAL PRIMARY KEY,
        quiz_id BIGINT NOT NULL REFERENCES daily_quizzes(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        user_name TEXT,
        email TEXT,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        score INTEGER DEFAULT 0,
        percentage INTEGER DEFAULT 0,
        level TEXT,
        time_spent_seconds INTEGER DEFAULT 0
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS daily_quiz_attempts_completed_idx
        ON daily_quiz_attempts (completed_at)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_quiz_answers (
        id BIGSERIAL PRIMARY KEY,
        attempt_id BIGINT NOT NULL REFERENCES daily_quiz_attempts(id) ON DELETE CASCADE,
        question_id BIGINT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
        selected_index INTEGER,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        time_spent_seconds INTEGER NOT NULL DEFAULT 0,
        UNIQUE (attempt_id, question_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS member_photos (
        id BIGSERIAL PRIMARY KEY,
        member_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS member_photos_member_id_idx
        ON member_photos (member_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS event_photos (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS event_photos_event_id_idx
        ON event_photos (event_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        member_number TEXT NOT NULL UNIQUE,
        date_of_birth DATE,
        city TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        location TEXT NOT NULL,
        image TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows: countRows } = await client.query(
      'SELECT COUNT(*)::int AS count FROM quiz_questions'
    );

    if (countRows[0].count === 0) {
      const seed = seedQuestions();
      for (const question of seed) {
        await client.query(
          `INSERT INTO quiz_questions (question_text, options, correct_index, difficulty, created_by)
           VALUES ($1, $2::jsonb, $3, $4, $5)`,
          [
            question.question,
            JSON.stringify(question.options),
            question.correct,
            question.difficulty,
            'seed'
          ]
        );
      }
      console.log(`Seeded ${seed.length} quiz questions.`);
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@asaa.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const { rows: adminRows } = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (adminRows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, 'admin')`,
        [adminEmail, passwordHash, 'Admin', 'ASAA']
      );
      console.log(`Seeded admin user: ${adminEmail}`);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database initialization failed:', error.message);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initializeSchema
};
