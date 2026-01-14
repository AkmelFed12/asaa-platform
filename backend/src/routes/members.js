const express = require('express');
const router = express.Router();

// Get all members
router.get('/', (req, res) => {
  res.json({ 
    message: 'Get all members',
    data: [],
    total: 0
  });
});

// Get member by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: `Get member ${id}`,
    data: {}
  });
});

// Add new member
router.post('/', (req, res) => {
  const { user_id, member_number, date_of_birth, city } = req.body;
  
  if (!user_id || !member_number) {
    return res.status(400).json({ error: 'User ID and member number required' });
  }
  
  res.status(201).json({ 
    message: 'Member added successfully',
    data: req.body
  });
});

// Update member
router.put('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: `Member ${id} updated`,
    data: req.body
  });
});

// Delete member
router.delete('/:id', (req, res) => {
  res.json({ message: `Member ${req.params.id} deleted` });
});

module.exports = router;
