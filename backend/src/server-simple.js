const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend fonctionne correctement!' });
});

// Import routes one by one to identify the problem
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.log('❌ Error loading auth routes:', error.message);
}

try {
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  console.log('✅ User routes loaded');
} catch (error) {
  console.log('❌ Error loading user routes:', error.message);
}

try {
  const expertRoutes = require('./routes/experts');
  app.use('/api/experts', expertRoutes);
  console.log('✅ Expert routes loaded');
} catch (error) {
  console.log('❌ Error loading expert routes:', error.message);
}

try {
  const videoSessionRoutes = require('./routes/videoSessions');
  app.use('/api/video', videoSessionRoutes);
  console.log('✅ Video session routes loaded');
} catch (error) {
  console.log('❌ Error loading video session routes:', error.message);
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur de test démarré sur le port ${PORT}`);
});

module.exports = app;

