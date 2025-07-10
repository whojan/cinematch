const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection, query } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const { standardLimiter } = require('./middleware/rateLimiter');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    let dbStatus = 'disconnected';
    try {
      await query('SELECT 1');
      dbStatus = 'connected';
    } catch (dbError) {
      console.error('Database health check failed:', dbError.message);
    }
    
    res.json({
      success: true,
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      services: {
        database: dbStatus,
        authentication: 'active'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    console.log('🔗 Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 CineMatch Test Server listening on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();