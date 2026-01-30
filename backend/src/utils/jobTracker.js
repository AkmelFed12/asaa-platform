const { pool } = require('./db');

const normalizeJobDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().split('T')[0];
};

const beginJob = async (jobName, jobDate = new Date(), force = false) => {
  const dateStr = normalizeJobDate(jobDate);
  if (!force) {
    const { rows: existing } = await pool.query(
      'SELECT id, status FROM system_jobs WHERE job_name = $1 AND job_date = $2',
      [jobName, dateStr]
    );
    if (existing[0]?.status === 'completed') {
      return { shouldRun: false, jobId: existing[0].id, status: existing[0].status, jobDate: dateStr };
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO system_jobs (job_name, job_date, status, started_at, updated_at)
     VALUES ($1, $2, 'running', NOW(), NOW())
     ON CONFLICT (job_name, job_date)
     DO UPDATE SET status = 'running', started_at = NOW(), updated_at = NOW()
     RETURNING id, status`,
    [jobName, dateStr]
  );

  return { shouldRun: true, jobId: rows[0].id, status: rows[0].status, jobDate: dateStr };
};

const finishJob = async (jobName, jobDate, status, details = null) => {
  const dateStr = normalizeJobDate(jobDate);
  await pool.query(
    `UPDATE system_jobs
     SET status = $1,
         details = $2,
         finished_at = NOW(),
         updated_at = NOW()
     WHERE job_name = $3 AND job_date = $4`,
    [status, details ? JSON.stringify(details) : null, jobName, dateStr]
  );
};

module.exports = {
  beginJob,
  finishJob,
  normalizeJobDate
};
