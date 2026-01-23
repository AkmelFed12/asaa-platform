const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { pool } = require('../utils/db');
const { requireAdmin, JWT_SECRET } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/register', requireAdmin, async (req, res) => {
  const { email, password, first_name, last_name, role } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role`,
      [email, passwordHash, first_name, last_name, role || 'member']
    );

    const user = rows[0];
    if (user.role === 'member') {
      const memberNumber = `M-${user.id}`;
      await pool.query(
        `INSERT INTO members (user_id, member_number)
         VALUES ($1, $2)`,
        [user.id, memberNumber]
      );
    }

    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

router.post('/refresh', (req, res) => {
  res.json({ message: 'Token refreshed', token: 'new-jwt-token' });
});

router.get('/status', (req, res) => {
  res.json({ authenticated: false });
});

module.exports = router;
