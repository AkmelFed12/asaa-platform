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
      DELETE FROM quiz_question_usage
      WHERE ctid IN (
        SELECT ctid
        FROM (
          SELECT ctid,
                 ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY quiz_date ASC) AS rn
          FROM quiz_question_usage
        ) dedup
        WHERE dedup.rn > 1
      )
    `);
    await client.query(`
      ALTER TABLE quiz_question_usage
      DROP CONSTRAINT IF EXISTS quiz_question_usage_pkey
    `);
    await client.query(`
      ALTER TABLE quiz_question_usage
      ADD PRIMARY KEY (question_id)
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
        data_url TEXT,
        size INTEGER NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      ALTER TABLE member_photos
      ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE
    `);
    await client.query(`
      ALTER TABLE member_photos
      ADD COLUMN IF NOT EXISTS data_url TEXT
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
        data_url TEXT,
        size INTEGER NOT NULL,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS event_photos_event_id_idx
        ON event_photos (event_id)
    `);
    await client.query(`
      ALTER TABLE event_photos
      ADD COLUMN IF NOT EXISTS data_url TEXT
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS governance_positions (
        id BIGSERIAL PRIMARY KEY,
        position_type TEXT NOT NULL UNIQUE,
        position_name TEXT NOT NULL,
        description TEXT,
        holder_name TEXT NOT NULL DEFAULT 'A pourvoir',
        holder_contact TEXT,
        holder_email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
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
        reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS news_announcements (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        pinned BOOLEAN NOT NULL DEFAULT FALSE,
        is_published BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      ALTER TABLE news_announcements
      ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE
    `);
    await client.query(`
      ALTER TABLE news_announcements
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS news_history (
        id BIGSERIAL PRIMARY KEY,
        news_id BIGINT NOT NULL,
        action TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        pinned BOOLEAN NOT NULL DEFAULT FALSE,
        is_published BOOLEAN NOT NULL DEFAULT TRUE,
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

    const { rows: governanceCount } = await client.query(
      'SELECT COUNT(*)::int AS count FROM governance_positions'
    );
    if (governanceCount[0].count === 0) {
      const seedPositions = [
        ['president', 'PRESIDENT', 'DIARRA SIDI', '0779382233'],
        ['vice_president', 'VICE PRESIDENT', 'BAH ALI MOHAMED', '0151495971'],
        ['secretaire_general', 'SECRETAIRE GENERAL', 'OUATTARA LADJI MOUSSA', '0574724233'],
        ['secretaire_adjointe_1', 'SECRETAIRE ADJOINTE 1', 'DIALLO MARIAMA', '0556570839'],
        ['secretaire_adjointe_2', 'SECRETAIRE ADJOINTE 2', 'FONANA NAWA', '0151473002'],
        ['delegue_culturel', 'DELEGUE CULTUREL', 'ADIANGO OUMAR', '0556742119'],
        ['delegue_culturel_adjoint_1', 'DELEGUE CULTUREL ADJOINT 1', 'OUEDRAOGO ABDOUL RAHIM', '0574044371'],
        ['delegue_culturel_adjointe_2', 'DELEGUE CULTUREL ADJOINTE 2', 'BAH ZAYNAB', '0749527280'],
        ['delegue_culturel_adjointe_3', 'DELEGUE CULTUREL ADJOINTE 3', 'KONATE SARATA', '0501169530'],
        ['delegue_social', 'DELEGUE SOCIAL', 'GBANE KARAMOKO', '0789036052'],
        ['delegue_social_adjoint_1', 'DELEGUE SOCIAL ADJOINT 1', 'ADIANGO OUMAR', '0143577046'],
        ['delegue_social_adjoint_2', 'DELEGUE SOCIAL ADJOINT 2', 'TRAORE TALBI', '0778923992'],
        ['delegue_social_adjointe_3', 'DELEGUE SOCIAL ADJOINTE 3', 'MARIAMA BOUBACAR', '0768604304'],
        ['delegue_social_adjointe_4', 'DELEGUE SOCIAL ADJOINTE 4', 'DIARRA SOUBA BINTA', '0101039771'],
        ['delegue_social_adjointe_5', 'DELEGUE SOCIAL ADJOINTE 5', 'ZEYNABOU SIDIBE', '0584031423'],
        ['delegue_social_adjointe_6', 'DELEGUE SOCIAL ADJOINTE 6', 'OUATTARA NAFISSAT LADY', '0759444639'],
        ['delegue_mobilisation', 'DELEGUE DE MOBILISATION', 'KONATE NOURA', '0574641065'],
        ['delegue_mobilisation_adjointe_1', 'DELEGUE DE MOBILISATION ADJOINTE 1', 'COULIBALY MADOUSSOU', '0171389479'],
        ['delegue_mobilisation_adjoint_2', 'DELEGUE DE MOBILISATION ADJOINT 2', 'SANA ABDOUL JALIL', '0596796476'],
        ['delegue_mobilisation_adjointe_3', 'DELEGUE DE MOBILISATION ADJOINTE 3', 'FATIM DIALLO', '0103699431'],
        ['delegue_mobilisation_adjointe_4', 'DELEGUE DE MOBILISATION ADJOINTE 4', 'KONE ADJARA', '0141671274'],
        ['tresoriere', 'TRESORIERE', 'BELLO AMINATA', '0769834455'],
        ['tresoriere_adjoint_1', 'TRESORIERE ADJOINT 1', 'DIARRA FOUNE', '0797818327'],
        ['tresoriere_adjoint_2', 'TRESORIERE ADJOINT 2', 'QUATTARA ROUKIYA', '05642348165']
      ];

      for (const [positionType, positionName, holderName, holderContact] of seedPositions) {
        await client.query(
          `INSERT INTO governance_positions (position_type, position_name, holder_name, holder_contact)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (position_type) DO NOTHING`,
          [positionType, positionName, holderName, holderContact]
        );
      }
      console.log(`Seeded ${seedPositions.length} governance positions.`);
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
