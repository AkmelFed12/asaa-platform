const { pool } = require('./db');

const logAudit = async (entry = {}) => {
  const {
    actorId = null,
    actorEmail = null,
    action,
    entityType,
    entityId = null,
    meta = null
  } = entry;

  if (!action || !entityType) {
    return;
  }

  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, meta)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        actorId,
        actorEmail,
        action,
        entityType,
        entityId !== null && entityId !== undefined ? String(entityId) : null,
        meta ? JSON.stringify(meta) : null
      ]
    );
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = {
  logAudit
};
