const express = require('express');
const router = express.Router();

// Get all events
router.get('/', (req, res) => {
  res.json({ 
    message: 'Get all events',
    data: [],
    total: 0
  });
});

// Get event by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: `Get event ${id}`,
    data: {}
  });
});

// Create event
router.post('/', (req, res) => {
  const { title, description, date_event, location, delegation_id } = req.body;
  
  if (!title || !date_event) {
    return res.status(400).json({ error: 'Title and date are required' });
  }
  
  res.status(201).json({ 
    message: 'Event created successfully',
    data: req.body
  });
});

// Update event
router.put('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: `Event ${id} updated`,
    data: req.body
  });
});

// Delete event
router.delete('/:id', (req, res) => {
  res.json({ message: `Event ${req.params.id} deleted` });
});

// Join event
router.post('/:id/join', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  res.json({ 
    message: `User joined event ${id}`,
    data: { event_id: id, user_id }
  });
});

module.exports = router;
