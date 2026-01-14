const express = require('express');
const router = express.Router();

// Temporary in-memory users (en production, utiliser une BD réelle)
const users = {
  'admin@asaa.com': {
    id: 1,
    email: 'admin@asaa.com',
    password: 'admin123', // En production: hasher le mot de passe
    first_name: 'Admin',
    last_name: 'ASAA',
    role: 'admin'
  }
};

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  const user = users[email];
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // En production: générer un JWT token
  res.json({ 
    message: 'Login successful',
    token: 'jwt-token-' + user.id,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    }
  });
});

// Register endpoint (pour les nouveaux membres)
router.post('/register', (req, res) => {
  const { email, password, first_name, last_name } = req.body;
  
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  if (users[email]) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  
  // Créer un nouvel utilisateur
  const newUser = {
    id: Math.max(...Object.values(users).map(u => u.id)) + 1,
    email,
    password, // En production: hasher
    first_name,
    last_name,
    role: 'membre'
  };
  
  users[email] = newUser;
  
  res.status(201).json({ 
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      role: newUser.role
    }
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Refresh token endpoint
router.post('/refresh', (req, res) => {
  res.json({ message: 'Token refreshed', token: 'new-jwt-token' });
});

// Check auth status
router.get('/status', (req, res) => {
  // En production: vérifier le token
  res.json({ authenticated: false });
});

module.exports = router;
