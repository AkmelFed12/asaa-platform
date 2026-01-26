const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
require('dotenv').config();
const { initializeSchema } = require('./src/utils/db');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

// Create HTTP server for WebSocket
const server = http.createServer(app);

// WebSocket Manager
const websocketManager = require('./src/utils/websocketManager');
websocketManager.initialize(server);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    service: 'ASAA API',
    websocket: 'enabled',
    uploads: 'enabled'
  });
});

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/members', require('./src/routes/members'));
app.use('/api/events', require('./src/routes/events'));
app.use('/api/delegations', require('./src/routes/delegations'));
app.use('/api/roles', require('./src/routes/roles'));
app.use('/api/governance', require('./src/routes/governance'));
app.use('/api/quiz', require('./src/routes/quiz'));
app.use('/api/photos', require('./src/routes/photos'));
app.use('/api/news', require('./src/routes/news'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 ASAA Server running on port ${PORT}`);
  console.log(`📧 Email notifications: enabled`);
  console.log(`🔄 WebSocket: enabled`);
  console.log(`📸 Photo uploads: enabled`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

initializeSchema().catch((error) => {
  console.error('Database initialization error:', error.message);
});

module.exports = app;
