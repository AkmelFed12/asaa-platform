const express = require('express');
const router = express.Router();
const { uploadSingle, uploadMultiple, getImageUrl, deleteImage } = require('../utils/photoUploadService');
const { pool } = require('../utils/db');
const { requireAdmin, requireAuth } = require('../middleware/auth');

// In-memory storage for event photos (legacy)
let eventPhotos = {};

/**
 * Upload a generic photo
 */
router.post('/upload', uploadSingle, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const photoUrl = getImageUrl(req.file.filename);
    const photoData = {
      id: Date.now(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: photoUrl,
      size: req.file.size,
      uploadedAt: new Date()
    };

    res.json({
      message: 'Photo uploadee avec succes',
      photo: photoData
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload multiple photos
 */
router.post('/upload-multiple', uploadMultiple, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const photos = req.files.map(file => ({
      id: Date.now() + Math.random(),
      filename: file.filename,
      originalName: file.originalname,
      url: getImageUrl(file.filename),
      size: file.size,
      uploadedAt: new Date()
    }));

    res.json({
      message: 'Photos uploadees avec succes',
      count: photos.length,
      photos: photos
    });
  } catch (error) {
    console.error('Erreur upload multiple:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Attach a photo to an event (in-memory)
 */
router.post('/event/:eventId/photo', requireAdmin, uploadSingle, async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const photoData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: getImageUrl(req.file.filename),
      size: req.file.size
    };

    const { rows } = await pool.query(
      `INSERT INTO event_photos (event_id, filename, original_name, url, size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, event_id, filename, original_name, url, size, uploaded_at`,
      [eventId, photoData.filename, photoData.originalName, photoData.url, photoData.size]
    );

    res.json({
      message: "Photo associee a l'evenement",
      eventId: eventId,
      photo: rows[0]
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Attach a photo to a member (persistent)
 */
router.post('/member/:memberId/photo', requireAuth, uploadSingle, async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const memberCheck = await pool.query(
      'SELECT user_id FROM members WHERE id = $1',
      [memberId]
    );
    const member = memberCheck.rows[0];
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (req.user.role !== 'admin' && String(member.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const photoData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: getImageUrl(req.file.filename),
      size: req.file.size
    };

    const { rows: primaryRows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM member_photos WHERE member_id = $1 AND is_primary = TRUE',
      [memberId]
    );
    const shouldBePrimary = primaryRows[0].count === 0;

    const { rows } = await pool.query(
      `INSERT INTO member_photos (member_id, filename, original_name, url, size, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, member_id, filename, original_name, url, size, is_primary, uploaded_at`,
      [memberId, photoData.filename, photoData.originalName, photoData.url, photoData.size, shouldBePrimary]
    );

    res.json({
      message: 'Photo associee au membre',
      memberId: memberId,
      photo: rows[0]
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get event photos
 */
router.get('/event/:eventId/photos', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rows } = await pool.query(
      `SELECT id, event_id, filename, original_name, url, size, uploaded_at
       FROM event_photos
       WHERE event_id = $1
       ORDER BY uploaded_at DESC`,
      [eventId]
    );

    res.json({
      eventId: eventId,
      photos: rows,
      count: rows.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get member photos
 */
router.get('/member/:memberId/photos', requireAuth, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { rows } = await pool.query(
      `SELECT id, member_id, filename, original_name, url, size, is_primary, uploaded_at
       FROM member_photos
       WHERE member_id = $1
       ORDER BY uploaded_at DESC`,
      [memberId]
    );

    res.json({
      memberId: memberId,
      photos: rows,
      count: rows.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/member/:memberId/primary/:photoId', requireAuth, async (req, res) => {
  const { memberId, photoId } = req.params;
  try {
    const memberCheck = await pool.query(
      'SELECT user_id FROM members WHERE id = $1',
      [memberId]
    );
    const member = memberCheck.rows[0];
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (req.user.role !== 'admin' && String(member.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query(
      'UPDATE member_photos SET is_primary = FALSE WHERE member_id = $1',
      [memberId]
    );
    const { rows } = await pool.query(
      `UPDATE member_photos
       SET is_primary = TRUE
       WHERE id = $1 AND member_id = $2
       RETURNING id, member_id, filename, original_name, url, size, is_primary, uploaded_at`,
      [photoId, memberId]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json({ photo: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Delete a photo (event or member)
 */
router.delete('/photo/:photoId', requireAdmin, async (req, res) => {
  try {
    const { photoId } = req.params;

    let deleted = false;
    for (const eventId in eventPhotos) {
      eventPhotos[eventId] = eventPhotos[eventId].filter(photo => {
        if (photo.id === parseInt(photoId, 10)) {
          deleteImage(photo.filename);
          deleted = true;
          return false;
        }
        return true;
      });
    }

    const { rows: eventRows } = await pool.query(
      'SELECT id, filename FROM event_photos WHERE id = $1',
      [photoId]
    );
    if (eventRows[0]) {
      await pool.query('DELETE FROM event_photos WHERE id = $1', [photoId]);
      deleteImage(eventRows[0].filename);
      deleted = true;
    }

    const { rows: memberRows } = await pool.query(
      'SELECT id, filename FROM member_photos WHERE id = $1',
      [photoId]
    );
    if (memberRows[0]) {
      await pool.query('DELETE FROM member_photos WHERE id = $1', [photoId]);
      deleteImage(memberRows[0].filename);
      deleted = true;
    }

    if (deleted) {
      res.json({ message: 'Photo supprimee avec succes' });
    } else {
      res.status(404).json({ error: 'Photo non trouvee' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload stats
 */
router.get('/stats', async (req, res) => {
  try {
    let totalPhotos = 0;
    let totalSize = 0;

    for (const eventId in eventPhotos) {
      eventPhotos[eventId].forEach(photo => {
        totalPhotos += 1;
        totalSize += photo.size || 0;
      });
    }

    const { rows: memberStats } = await pool.query(
      'SELECT COUNT(*)::int AS count, COALESCE(SUM(size), 0)::int AS total_size FROM member_photos'
    );
    const { rows: eventStats } = await pool.query(
      'SELECT COUNT(*)::int AS count, COALESCE(SUM(size), 0)::int AS total_size FROM event_photos'
    );
    totalPhotos += memberStats[0].count + eventStats[0].count;
    totalSize += memberStats[0].total_size + eventStats[0].total_size;

    res.json({
      totalPhotos: totalPhotos,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      eventCount: eventStats[0].count,
      memberCount: memberStats[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search member photos
 */
router.get('/search', requireAdmin, async (req, res) => {
  const query = (req.query.query || '').trim();
  if (!query) {
    return res.json({ data: [], total: 0 });
  }

  try {
    const like = `%${query.toLowerCase()}%`;
    const { rows } = await pool.query(
      `SELECT id, member_id, filename, original_name, url, size, is_primary, uploaded_at
       FROM member_photos
       WHERE LOWER(filename) LIKE $1
          OR LOWER(original_name) LIKE $1
          OR CAST(member_id AS TEXT) LIKE $1
       ORDER BY uploaded_at DESC
       LIMIT 200`,
      [like]
    );
    res.json({ data: rows, total: rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
