const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { pool } = require('../utils/db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, position_type, position_name, description, holder_name, holder_contact, holder_email
       FROM governance_positions
       ORDER BY id`
    );
    res.json({
      message: 'Get all governance positions',
      data: rows,
      total: rows.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, position_type, position_name, description, holder_name, holder_contact, holder_email
       FROM governance_positions
       WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Position not found' });
    }
    res.json({
      message: `Get governance position ${req.params.id}`,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { holder_name, holder_email, holder_contact, description } = req.body;
  try {
    const updates = [];
    const values = [];
    let index = 1;

    if (holder_name !== undefined) {
      updates.push(`holder_name = $${index++}`);
      values.push(holder_name);
    }
    if (holder_email !== undefined) {
      updates.push(`holder_email = $${index++}`);
      values.push(holder_email || null);
    }
    if (holder_contact !== undefined) {
      updates.push(`holder_contact = $${index++}`);
      values.push(holder_contact || null);
    }
    if (description !== undefined) {
      updates.push(`description = $${index++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE governance_positions
       SET ${updates.join(', ')}
       WHERE id = $${index}
       RETURNING id, position_type, position_name, description, holder_name, holder_contact, holder_email`,
      values
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Position not found' });
    }

    res.json({
      message: `Governance position ${req.params.id} updated successfully`,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { position_name, position_type, description, holder_name, holder_email, holder_contact } = req.body;

  if (!position_name || !position_type) {
    return res.status(400).json({ error: 'position_name and position_type are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO governance_positions
       (position_type, position_name, description, holder_name, holder_email, holder_contact)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, position_type, position_name, description, holder_name, holder_contact, holder_email`,
      [
        String(position_type).toLowerCase().replace(/\s+/g, '_'),
        position_name,
        description || '',
        holder_name || 'A pourvoir',
        holder_email || null,
        holder_contact || null
      ]
    );
    res.status(201).json({
      message: 'New governance position created successfully',
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id <= 3) {
    return res.status(403).json({ error: 'Cannot delete core governance positions' });
  }

  try {
    const { rows } = await pool.query(
      'DELETE FROM governance_positions WHERE id = $1 RETURNING id, position_type, position_name',
      [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Position not found' });
    }
    res.json({
      message: 'Governance position deleted successfully',
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
