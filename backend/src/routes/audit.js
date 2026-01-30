const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const entityType = req.query.entity ? String(req.query.entity).trim() : '';
  const action = req.query.action ? String(req.query.action).trim() : '';

  try {
    const params = [];
    const conditions = [];
    if (entityType) {
      params.push(entityType);
      conditions.push(`entity_type = $${params.length}`);
    }
    if (action) {
      params.push(action);
      conditions.push(`action = $${params.length}`);
    }

    let query = `
      SELECT id, actor_id, actor_email, action, entity_type, entity_id, meta, created_at
      FROM audit_logs
    `;
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
    res.json({ data: rows, limit, offset, hasMore: rows.length === limit });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
