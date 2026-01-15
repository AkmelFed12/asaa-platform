const express = require('express');
const router = express.Router();

// In-memory storage
let events = [];
let eventIdCounter = 1;

const ADMIN_PASSWORD = 'admin123';

// Middleware to verify admin
const verifyAdmin = (req, res, next) => {
  const { adminPassword } = req.body || req.query;
  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Admin access denied' });
  }
  next();
};

// Créer un événement (admin only)
router.post('/', verifyAdmin, (req, res) => {
  const { title, description, date, location, image } = req.body;

  if (!title || !description || !date || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newEvent = {
    id: eventIdCounter++,
    title,
    description,
    date: new Date(date),
    location,
    image: image || '',
    createdAt: new Date()
  };

  events.push(newEvent);
  res.json(newEvent);
});

// Obtenir tous les événements à venir
router.get('/', (req, res) => {
  const now = new Date();
  const future = events
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(future);
});

// Obtenir tous les événements passés
router.get('/past', (req, res) => {
  const now = new Date();
  const past = events
    .filter(e => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(past);
});

// Obtenir un événement par ID
router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === parseInt(req.params.id));
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

// Mettre à jour un événement (admin only)
router.put('/:id', verifyAdmin, (req, res) => {
  const event = events.find(e => e.id === parseInt(req.params.id));
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { title, description, date, location, image } = req.body;
  if (title) event.title = title;
  if (description) event.description = description;
  if (date) event.date = new Date(date);
  if (location) event.location = location;
  if (image !== undefined) event.image = image;

  res.json(event);
});

// Supprimer un événement (admin only)
router.delete('/:id', verifyAdmin, (req, res) => {
  const index = events.findIndex(e => e.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const deleted = events.splice(index, 1);
  res.json(deleted[0]);
});

module.exports = router;
