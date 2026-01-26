const express = require('express');
const router = express.Router();
const { pool } = require('../utils/db');
const { sendEventNotification, sendEventReminder } = require('../utils/emailService');
const websocketManager = require('../utils/websocketManager');
const { requireAdmin } = require('../middleware/auth');

router.post('/', requireAdmin, async (req, res) => {
  const { title, description, date, location, image } = req.body;

  if (!title || !description || !date || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO events (title, description, date, location, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, date, location, image, created_at`,
      [title, description, date, location, image || null]
    );

    const newEvent = rows[0];

    try {
      websocketManager.broadcastToAll('EVENT_CREATED', {
        id: newEvent.id,
        title: newEvent.title,
        date: newEvent.date,
        location: newEvent.location
      });
    } catch (error) {
      console.error('WebSocket broadcast error:', error.message);
    }

    try {
      sendEventNotification('notifications@asaa.com', 'ASAA Members', {
        title: newEvent.title,
        description: newEvent.description,
        date: new Date(newEvent.date).toLocaleString('fr-FR'),
        location: newEvent.location,
        image: newEvent.image
      })
        .then(() => console.log(`Event notification sent for: ${newEvent.title}`))
        .catch(err => console.error('Email error:', err.message));
    } catch (error) {
      console.error('Email service error:', error.message);
    }

    res.json(newEvent);
  } catch (error) {
    console.error('Event create error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, date, location, image, created_at
       FROM events
       WHERE date >= NOW()
       ORDER BY date ASC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/past', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, date, location, image, created_at
       FROM events
       WHERE date < NOW()
       ORDER BY date DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/all', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, date, location, image, created_at
       FROM events
       ORDER BY date DESC`
    );
    res.json({ data: rows, total: rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/reminders/run', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, date, location, image
       FROM events
       WHERE reminder_sent = FALSE
         AND date >= NOW()
         AND date <= NOW() + INTERVAL '24 hours'
       ORDER BY date ASC`
    );

    if (rows.length === 0) {
      return res.json({ sent: 0, updated: 0 });
    }

    let sent = 0;
    let updated = 0;
    for (const eventItem of rows) {
      const success = await sendEventReminder('ouattaral2@student.iugb.edu.ci', 'ASAA Members', {
        title: eventItem.title,
        description: eventItem.description,
        date: eventItem.date,
        location: eventItem.location,
        image: eventItem.image
      });

      if (success) {
        sent += 1;
        await pool.query(
          'UPDATE events SET reminder_sent = TRUE WHERE id = $1',
          [eventItem.id]
        );
        updated += 1;
      }
    }

    res.json({ sent, updated });
  } catch (error) {
    console.error('Event reminders error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, date, location, image, created_at
       FROM events
       WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { title, description, date, location, image } = req.body;
  try {
    const updates = [];
    const values = [];
    let index = 1;

    if (title) {
      updates.push(`title = $${index++}`);
      values.push(title);
    }
    if (description) {
      updates.push(`description = $${index++}`);
      values.push(description);
    }
    if (date) {
      updates.push(`date = $${index++}`);
      values.push(date);
    }
    if (location) {
      updates.push(`location = $${index++}`);
      values.push(location);
    }
    if (image !== undefined) {
      updates.push(`image = $${index++}`);
      values.push(image);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE events SET ${updates.join(', ')}
       WHERE id = $${index}
       RETURNING id, title, description, date, location, image, created_at`,
      values
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM events WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
