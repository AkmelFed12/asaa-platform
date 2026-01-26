const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.member_number, m.date_of_birth, m.city, m.phone, m.created_at,
              u.id AS user_id, u.email, u.first_name, u.last_name, u.role
       FROM members m
       JOIN users u ON u.id = m.user_id
       ORDER BY m.created_at DESC`
    );
    res.json({ data: rows, total: rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/export/csv', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.member_number, m.date_of_birth, m.city, m.phone, m.created_at,
              u.email, u.first_name, u.last_name, u.role
       FROM members m
       JOIN users u ON u.id = m.user_id
       ORDER BY m.created_at DESC`
    );
    const header = 'id,member_number,date_of_birth,city,phone,created_at,email,first_name,last_name,role\n';
    const lines = rows.map((row) => (
      `${row.id},${row.member_number},${row.date_of_birth || ''},${row.city || ''},${row.phone || ''},${row.created_at.toISOString()},${row.email},${row.first_name},${row.last_name},${row.role}`
    ));
    res.setHeader('Content-Type', 'text/csv');
    res.send(header + lines.join('\n'));
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.member_number, m.date_of_birth, m.city, m.phone, m.created_at,
              u.id AS user_id, u.email, u.first_name, u.last_name, u.role
       FROM members m
       JOIN users u ON u.id = m.user_id
       WHERE u.id = $1`,
      [req.params.userId]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.member_number, m.date_of_birth, m.city, m.phone, m.created_at,
              u.id AS user_id, u.email, u.first_name, u.last_name, u.role
       FROM members m
       JOIN users u ON u.id = m.user_id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { user_id, member_number, date_of_birth, city, phone } = req.body;
  if (!user_id || !member_number) {
    return res.status(400).json({ error: 'User ID and member number required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO members (user_id, member_number, date_of_birth, city, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, member_number, date_of_birth, city, phone, created_at`,
      [user_id, member_number, date_of_birth || null, city || null, phone || null]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { member_number, date_of_birth, city, phone } = req.body;
  try {
    const updates = [];
    const values = [];
    let index = 1;

    if (member_number) {
      updates.push(`member_number = $${index++}`);
      values.push(member_number);
    }
    if (date_of_birth) {
      updates.push(`date_of_birth = $${index++}`);
      values.push(date_of_birth);
    }
    if (city) {
      updates.push(`city = $${index++}`);
      values.push(city);
    }
    if (phone) {
      updates.push(`phone = $${index++}`);
      values.push(phone);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE members SET ${updates.join(', ')}
       WHERE id = $${index}
       RETURNING id, user_id, member_number, date_of_birth, city, phone, created_at`,
      values
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM members WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
