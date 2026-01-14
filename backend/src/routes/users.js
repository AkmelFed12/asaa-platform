const express = require('express');
const router = express.Router();

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
  
  res.status(201).json({ 
    message: 'User created successfully',
    data: { username, email, first_name, last_name, role: role || 'membre' }
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
