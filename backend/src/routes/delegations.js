const express = require('express');
const router = express.Router();

// Get all delegations
router.get('/', (req, res) => {
  const delegations = [
    { id: 1, name: 'Mobilisation', type: 'mobilisation', description: 'Délégation chargée de la mobilisation' },
    { id: 2, name: 'Social', type: 'social', description: 'Actions sociales et aide aux membres' },
    { id: 3, name: 'Culturel', type: 'culturel', description: 'Activités culturelles et artistiques' },
    { id: 4, name: 'Événements', type: 'evenements', description: 'Organisation des événements' },
    { id: 5, name: 'Communication', type: 'communication', description: 'Communication interne et externe' },
    { id: 6, name: 'Finance', type: 'finance', description: 'Gestion des finances et budget' }
  ];
  
  res.json({ 
    message: 'Get all delegations',
    data: delegations,
    total: delegations.length
  });
});

// Get delegation by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: `Get delegation ${id}`,
    data: {}
  });
});

// Create delegation
router.post('/', (req, res) => {
  const { name, type, description } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type required' });
  }
  
  res.status(201).json({ 
    message: 'Delegation created',
    data: req.body
  });
});

// Update delegation
router.put('/:id', (req, res) => {
  res.json({ 
    message: `Delegation ${req.params.id} updated`,
    data: req.body
  });
});

module.exports = router;
