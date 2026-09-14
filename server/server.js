const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

const app = express();

// Trust reverse proxy (Render, AWS, Cloudflare, etc.) for rate limiting and IP headers
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'NBKRIST TeamFinder API is active and operational',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const http = require('http');
const { initSocket } = require('./socket');

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 NBKRIST TeamFinder Backend running on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
      console.log(`⚡ WebSocket Server initialized on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};


startServer();
