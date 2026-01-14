const express = require('express');
const router = express.Router();

// Get all roles
router.get('/', (req, res) => {
  const roles = [
    { id: 1, name: 'Admin', description: 'Administrateur système' },
    { id: 2, name: 'Président', description: 'Président de l\'association' },
    { id: 3, name: 'Vice-Président', description: 'Vice-président' },
    { id: 4, name: 'Secrétaire Général', description: 'Secrétaire général' },
    { id: 5, name: 'Délégué', description: 'Délégué de délégation' },
    { id: 6, name: 'Membre', description: 'Membre de l\'association' }
  ];
  
  res.json({ 
    message: 'Get all roles',
    data: roles,
    total: roles.length
  });
});

// Get role by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ 
    message: `Get role ${id}`,
    data: {}
  });
});

module.exports = router;
