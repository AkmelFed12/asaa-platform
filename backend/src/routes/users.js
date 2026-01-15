const express = require('express');
const router = express.Router();
const { sendWelcomeEmail } = require('../utils/emailService');

// Get all users
router.get('/', (req, res) => {
  res.json({ 
    message: 'Get all users', 
    data: [],
    total: 0
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: `Get user ${id}`, 
    data: { id, username: 'user', email: 'user@asaa.com' }
  });
});

// Create user
router.post('/', (req, res) => {
  const { username, email, first_name, last_name, role } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email required' });
  }
  
  const tempPassword = Math.random().toString(36).slice(-8);
  
  // Send welcome email
  try {
    sendWelcomeEmail(email, first_name || username, tempPassword)
      .then(() => console.log(`✉️  Welcome email sent to ${email}`))
      .catch(err => console.error('Email error:', err.message));
  } catch (error) {
    console.error('Email service error:', error.message);
  }
  
  res.status(201).json({ 
    message: 'User created successfully',
    data: { username, email, first_name, last_name, role: role || 'membre', tempPassword }
  });
});

// Update user
router.put('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: `User ${id} updated`,
    data: req.body
  });
});

// Delete user
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: `User ${id} deleted successfully`
  });
});

module.exports = router;
