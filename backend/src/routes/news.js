const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, content, pinned, created_at
       FROM news_announcements
       WHERE is_published = TRUE
       ORDER BY pinned DESC, created_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, content, pinned, is_published, created_at, updated_at
       FROM news_announcements
       ORDER BY pinned DESC, created_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/history', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, news_id, action, title, content, pinned, is_published, created_at
       FROM news_history
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { title, content, is_published } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  try {
    const isPublished = is_published === false ? false : true;
    const { rows } = await pool.query(
      `INSERT INTO news_announcements (title, content, is_published)
       VALUES ($1, $2, $3)
       RETURNING id, title, content, pinned, is_published, created_at, updated_at`,
      [title, content, isPublished]
    );
    await pool.query(
      `INSERT INTO news_history (news_id, action, title, content, pinned, is_published)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [rows[0].id, 'created', rows[0].title, rows[0].content, rows[0].pinned, rows[0].is_published]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, content, is_published } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE news_announcements
       SET title = $1,
           content = $2,
           is_published = COALESCE($3, is_published),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, title, content, pinned, is_published, created_at, updated_at`,
      [title, content, is_published === undefined ? null : Boolean(is_published), id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'News not found' });
    }
    await pool.query(
      `INSERT INTO news_history (news_id, action, title, content, pinned, is_published)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [rows[0].id, 'updated', rows[0].title, rows[0].content, rows[0].pinned, rows[0].is_published]
    );
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.patch('/:id/pin', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { pinned } = req.body;
  if (pinned === undefined) {
    return res.status(400).json({ error: 'Pinned flag required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE news_announcements
       SET pinned = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, title, content, pinned, is_published, created_at, updated_at`,
      [Boolean(pinned), id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'News not found' });
    }
    await pool.query(
      `INSERT INTO news_history (news_id, action, title, content, pinned, is_published)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [rows[0].id, 'pinned', rows[0].title, rows[0].content, rows[0].pinned, rows[0].is_published]
    );
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM news_announcements
       WHERE id = $1
       RETURNING id, title, content, pinned, is_published`,
      [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'News not found' });
    }
    await pool.query(
      `INSERT INTO news_history (news_id, action, title, content, pinned, is_published)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [rows[0].id, 'deleted', rows[0].title, rows[0].content, rows[0].pinned, rows[0].is_published]
    );
    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
