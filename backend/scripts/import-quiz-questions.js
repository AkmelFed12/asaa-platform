const fs = require('fs');
const path = require('path');
const { pool, initializeSchema } = require('../src/utils/db');

const DEFAULT_CHUNK_SIZE = 500;
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const VALID_STATUSES = new Set(['draft', 'review', 'validated', 'archived']);

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

function normalizeStatus(value) {
  const lowered = String(value || '').toLowerCase().trim();
  if (!lowered) return null;
  return VALID_STATUSES.has(lowered) ? lowered : null;
}

function normalizeSource(value) {
  const text = String(value || '').trim();
  return text.length ? text : null;
}

function normalizeQuestionText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function parseTagsInput(value) {
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
}

function normalizeTags(value) {
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
}

async function insertChunk(client, chunk, changedBy, note) {
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
      changedBy,
      note
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

async function run() {
  const args = process.argv.slice(2);
  let filePath = null;
  let replaceAll = false;
  let dedupe = true;
  let chunkSize = DEFAULT_CHUNK_SIZE;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--replace') {
      replaceAll = true;
      continue;
    }
    if (arg === '--no-dedupe') {
      dedupe = false;
      continue;
    }
    if (arg === '--chunk') {
      const next = Number(args[i + 1]);
      if (!Number.isNaN(next) && next > 0) {
        chunkSize = next;
      }
      i += 1;
      continue;
    }
    if (!arg.startsWith('--') && !filePath) {
      filePath = arg;
    }
  }

  if (!filePath) {
    console.error('Usage: node scripts/import-quiz-questions.js <csv-path> [--replace] [--chunk N] [--no-dedupe]');
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
  const seen = new Set();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (replaceAll) {
      await client.query('TRUNCATE quiz_questions RESTART IDENTITY CASCADE');
    }

    const existingNormalized = new Set();
    if (!replaceAll && dedupe) {
      const { rows: existingRows } = await client.query('SELECT question_text FROM quiz_questions');
      existingRows.forEach((row) => {
        const normalized = normalizeQuestionText(row.question_text);
        if (normalized) {
          existingNormalized.add(normalized);
        }
      });
    }

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
      const difficulty = normalizeDifficulty(difficultyRaw) || 'hard';
      const source = normalizeSource(sourceRaw);
      const tags = normalizeTags(tagsRaw);
      const status = normalizeStatus(statusRaw) || 'validated';
      const normalizedQuestion = normalizeQuestionText(question);

      if (!normalizedQuestion) {
        skipped += 1;
        continue;
      }
      if (seen.has(normalizedQuestion) || existingNormalized.has(normalizedQuestion)) {
        skipped += 1;
        continue;
      }
      if (!option1 || !option2 || !option3 || !option4) {
        skipped += 1;
        continue;
      }
      if (Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3 || !difficulty) {
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

    const changedBy = 'csv-import';
    const note = replaceAll ? 'replace-all' : null;
    for (let i = 0; i < prepared.length; i += chunkSize) {
      const chunk = prepared.slice(i, i + chunkSize);
      await insertChunk(client, chunk, changedBy, note);
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
