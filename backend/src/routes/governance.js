const express = require('express');
const router = express.Router();

// Données en mémoire pour les postes (en production: utiliser la BD)
let governancePositions = [
  {
    id: 1,
    position_type: 'president',
    position_name: 'Président',
    description: 'Responsable de la direction générale de l\'association',
    holder_name: 'À pourvoir',
    holder_email: null
  },
  {
    id: 2,
    position_type: 'vice_president',
    position_name: 'Vice-Président',
    description: 'Assiste le président et le remplace en cas d\'absence',
    holder_name: 'À pourvoir',
    holder_email: null
  },
  {
    id: 3,
    position_type: 'secretaire_general',
    position_name: 'Secrétaire Général',
    description: 'Responsable de l\'administration et de la correspondance',
    holder_name: 'À pourvoir',
    holder_email: null
  },
  {
    id: 4,
    position_type: 'delegue_mobilisation',
    position_name: 'Délégué à la Mobilisation',
    description: 'Chargé de mobiliser les membres',
    holder_name: 'À pourvoir',
    holder_email: null
  },
  {
    id: 5,
    position_type: 'delegue_social',
    position_name: 'Délégué Social',
    description: 'Responsable des actions sociales',
    holder_name: 'À pourvoir',
    holder_email: null
  },
  {
    id: 6,
    position_type: 'delegue_culturel',
    position_name: 'Délégué Culturel',
    description: 'Organise les activités culturelles',
    holder_name: 'À pourvoir',
    holder_email: null
  },
  {
    id: 7,
    position_type: 'delegue_evenements',
    position_name: 'Délégué aux Événements',
    description: 'Organise les événements et manifestations',
    holder_name: 'À pourvoir',
    holder_email: null
  },
  {
    id: 8,
    position_type: 'delegue_communication',
    position_name: 'Délégué Communication',
    description: 'Gère la communication et les médias',
    holder_name: 'À pourvoir',
    holder_email: null
  },
  {
    id: 9,
    position_type: 'delegue_finance',
    position_name: 'Délégué Finance',
    description: 'Gère les finances et le budget',
    holder_name: 'À pourvoir',
    holder_email: null
  }
];

// Get all governance positions
router.get('/', (req, res) => {
  res.json({
    message: 'Get all governance positions',
    data: governancePositions,
    total: governancePositions.length
  });
});

// Get governance position by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const position = governancePositions.find(p => p.id === parseInt(id));
  
  if (!position) {
    return res.status(404).json({ error: 'Position not found' });
  }
  
  res.json({
    message: `Get governance position ${id}`,
    data: position
  });
});

// Update governance position (admin only)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { holder_name, holder_email, description } = req.body;
  
  // En production: vérifier que l'utilisateur est admin
  
  const position = governancePositions.find(p => p.id === parseInt(id));
  
  if (!position) {
    return res.status(404).json({ error: 'Position not found' });
  }
  
  if (holder_name !== undefined) position.holder_name = holder_name;
  if (holder_email !== undefined) position.holder_email = holder_email;
  if (description !== undefined) position.description = description;
  
  res.json({
    message: `Governance position ${id} updated successfully`,
    data: position
  });
});

// Create new governance position (admin only)
router.post('/', (req, res) => {
  const { position_name, position_type, description, holder_name, holder_email } = req.body;
  
  // En production: vérifier que l'utilisateur est admin
  
  if (!position_name || !position_type) {
    return res.status(400).json({ error: 'position_name and position_type are required' });
  }
  
  const newPosition = {
    id: Math.max(...governancePositions.map(p => p.id), 0) + 1,
    position_type: position_type.toLowerCase().replace(/\s+/g, '_'),
    position_name: position_name,
    description: description || '',
    holder_name: holder_name || 'À pourvoir',
    holder_email: holder_email || null
  };
  
  governancePositions.push(newPosition);
  
  res.status(201).json({
    message: 'New governance position created successfully',
    data: newPosition
  });
});

// Delete governance position (admin only)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const positionIndex = governancePositions.findIndex(p => p.id === parseInt(id));
  
  if (positionIndex === -1) {
    return res.status(404).json({ error: 'Position not found' });
  }
  
  // Prevent deletion of core positions (first 3)
  if (parseInt(id) <= 3) {
    return res.status(403).json({ error: 'Cannot delete core governance positions' });
  }
  
  const deletedPosition = governancePositions.splice(positionIndex, 1);
  
  res.json({
    message: 'Governance position deleted successfully',
    data: deletedPosition[0]
  });
});

module.exports = router;
