const fs = require('fs');
const path = require('path');
const { pool, initializeSchema } = require('../src/utils/db');

const DEFAULT_CHUNK_SIZE = 500;
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

function parseCsvLine(line) {
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
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const values = parseCsvLine(line);
    if (i === 0 && values[0] === 'question') {
      continue;
    }
    rows.push(values);
  }

  return rows;
}

function normalizeDifficulty(value) {
  const lowered = String(value || '').toLowerCase();
  return VALID_DIFFICULTIES.has(lowered) ? lowered : null;
}

async function insertChunk(client, chunk) {
  const values = [];
  const placeholders = chunk.map((row, index) => {
    const offset = index * 5;
    values.push(row.question, JSON.stringify(row.options), row.correctIndex, row.difficulty, row.createdBy);
    return `($${offset + 1}, $${offset + 2}::jsonb, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
  });

  await client.query(
    `INSERT INTO quiz_questions (question_text, options, correct_index, difficulty, created_by)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/import-quiz-questions.js <csv-path>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  await initializeSchema();

  const content = fs.readFileSync(resolvedPath, 'utf-8');
  const rows = parseCsv(content);

  const prepared = [];
  let skipped = 0;

  for (const row of rows) {
    if (row.length < 7) {
      skipped += 1;
      continue;
    }

    const [question, option1, option2, option3, option4, correctIndexRaw, difficultyRaw] = row;
    const correctIndex = Number(correctIndexRaw);
    const difficulty = normalizeDifficulty(difficultyRaw);

    if (!question || Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3 || !difficulty) {
      skipped += 1;
      continue;
    }

    prepared.push({
      question,
      options: [option1, option2, option3, option4],
      correctIndex,
      difficulty,
      createdBy: 'csv-import'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < prepared.length; i += DEFAULT_CHUNK_SIZE) {
      const chunk = prepared.slice(i, i + DEFAULT_CHUNK_SIZE);
      await insertChunk(client, chunk);
      if ((i + chunk.length) % 5000 === 0) {
        console.log(`Inserted ${i + chunk.length} questions...`);
      }
    }

    await client.query('COMMIT');
    console.log(`Import done. Inserted: ${prepared.length}. Skipped: ${skipped}.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
