const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const defaultExtras = {
  bio: null,
  address: null,
  emergency_name: null,
  emergency_phone: null,
  social_facebook: null,
  social_instagram: null,
  social_twitter: null,
  social_linkedin: null,
  notify_email: true,
  notify_whatsapp: true,
  visibility_directory: true
};

const normalizeText = (value, fallback) => {
  if (value === undefined) return fallback;
  if (value === null) return null;
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const normalizeBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const buildExtras = (current, input = {}) => ({
  bio: normalizeText(input.bio, current.bio),
  address: normalizeText(input.address, current.address),
  emergency_name: normalizeText(input.emergency_name, current.emergency_name),
  emergency_phone: normalizeText(input.emergency_phone, current.emergency_phone),
  social_facebook: normalizeText(input.social_facebook, current.social_facebook),
  social_instagram: normalizeText(input.social_instagram, current.social_instagram),
  social_twitter: normalizeText(input.social_twitter, current.social_twitter),
  social_linkedin: normalizeText(input.social_linkedin, current.social_linkedin),
  notify_email: normalizeBoolean(input.notify_email, current.notify_email),
  notify_whatsapp: normalizeBoolean(input.notify_whatsapp, current.notify_whatsapp),
  visibility_directory: normalizeBoolean(input.visibility_directory, current.visibility_directory)
});

router.get('/extras/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;
  if (req.user.role !== 'admin' && String(req.user.id) !== String(userId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT user_id, bio, address, emergency_name, emergency_phone,
              social_facebook, social_instagram, social_twitter, social_linkedin,
              notify_email, notify_whatsapp, visibility_directory, updated_at
       FROM member_profile_extras
       WHERE user_id = $1`,
      [userId]
    );
    res.json({ data: rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/extras', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows: existingRows } = await pool.query(
      `SELECT user_id, bio, address, emergency_name, emergency_phone,
              social_facebook, social_instagram, social_twitter, social_linkedin,
              notify_email, notify_whatsapp, visibility_directory, updated_at
       FROM member_profile_extras
       WHERE user_id = $1`,
      [userId]
    );
    const base = existingRows[0] ? { ...defaultExtras, ...existingRows[0] } : { ...defaultExtras };
    const next = buildExtras(base, req.body || {});

    const { rows } = await pool.query(
      `INSERT INTO member_profile_extras (
         user_id, bio, address, emergency_name, emergency_phone,
         social_facebook, social_instagram, social_twitter, social_linkedin,
         notify_email, notify_whatsapp, visibility_directory, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
       )
       ON CONFLICT (user_id) DO UPDATE SET
         bio = EXCLUDED.bio,
         address = EXCLUDED.address,
         emergency_name = EXCLUDED.emergency_name,
         emergency_phone = EXCLUDED.emergency_phone,
         social_facebook = EXCLUDED.social_facebook,
         social_instagram = EXCLUDED.social_instagram,
         social_twitter = EXCLUDED.social_twitter,
         social_linkedin = EXCLUDED.social_linkedin,
         notify_email = EXCLUDED.notify_email,
         notify_whatsapp = EXCLUDED.notify_whatsapp,
         visibility_directory = EXCLUDED.visibility_directory,
         updated_at = NOW()
       RETURNING user_id, bio, address, emergency_name, emergency_phone,
                 social_facebook, social_instagram, social_twitter, social_linkedin,
                 notify_email, notify_whatsapp, visibility_directory, updated_at`,
      [
        userId,
        next.bio,
        next.address,
        next.emergency_name,
        next.emergency_phone,
        next.social_facebook,
        next.social_instagram,
        next.social_twitter,
        next.social_linkedin,
        next.notify_email,
        next.notify_whatsapp,
        next.visibility_directory
      ]
    );
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
