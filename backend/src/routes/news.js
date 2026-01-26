const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, content, pinned, created_at
       FROM news_announcements
       ORDER BY pinned DESC, created_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO news_announcements (title, content)
       VALUES ($1, $2)
       RETURNING id, title, content, pinned, created_at`,
      [title, content]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE news_announcements
       SET title = $1, content = $2
       WHERE id = $3
       RETURNING id, title, content, pinned, created_at`,
      [title, content, id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'News not found' });
    }
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
       SET pinned = $1
       WHERE id = $2
       RETURNING id, title, content, pinned, created_at`,
      [Boolean(pinned), id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM news_announcements WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
