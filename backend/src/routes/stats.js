const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');

router.get('/monthly', requireAdmin, async (req, res) => {
  const months = Math.min(Math.max(Number(req.query.months) || 6, 1), 24);
  try {
    const { rows } = await pool.query(
      `WITH month_series AS (
         SELECT date_trunc('month', NOW()) - INTERVAL '1 month' * generate_series(0, $1 - 1) AS month_start
       ),
       member_counts AS (
         SELECT date_trunc('month', created_at) AS month_start, COUNT(*)::int AS count
         FROM users
         GROUP BY 1
       ),
       event_counts AS (
         SELECT date_trunc('month', created_at) AS month_start, COUNT(*)::int AS count
         FROM events
         GROUP BY 1
       ),
       attempt_counts AS (
         SELECT date_trunc('month', completed_at) AS month_start, COUNT(*)::int AS count
         FROM daily_quiz_attempts
         WHERE completed_at IS NOT NULL
         GROUP BY 1
       )
       SELECT
         to_char(series.month_start, 'YYYY-MM') AS month,
         COALESCE(member_counts.count, 0) AS members,
         COALESCE(event_counts.count, 0) AS events,
         COALESCE(attempt_counts.count, 0) AS quiz_attempts
       FROM month_series series
       LEFT JOIN member_counts ON member_counts.month_start = series.month_start
       LEFT JOIN event_counts ON event_counts.month_start = series.month_start
       LEFT JOIN attempt_counts ON attempt_counts.month_start = series.month_start
       ORDER BY series.month_start DESC`,
      [months]
    );

    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
