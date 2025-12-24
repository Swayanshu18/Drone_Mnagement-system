/**
 * Drone Survey Management System - Main Server Entry Point
 * 
 * This file initializes the Express server with all middleware,
 * routes, and Socket.IO for real-time communication.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');

const errorHandler = require('./middleware/errorHandler');
const { initializeSocket } = require('./socket/socketHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const droneRoutes = require('./routes/droneRoutes');
const missionRoutes = require('./routes/missionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const siteRoutes = require('./routes/siteRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow all Vercel preview URLs and localhost
      if (!origin || 
          origin.includes('localhost') || 
          origin.includes('vercel.app') ||
          origin.includes('drone-mnagement-system')) {
        callback(null, origin || true);
      } else {
        callback(null, origin);
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS origin validation function
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow requests with no origin (Postman, curl)
  
  const allowedPatterns = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL
  ].filter(Boolean);
  
  // Check exact matches
  if (allowedPatterns.includes(origin)) return true;
  
  // Check if it's a Vercel preview URL for this project
  if (origin.includes('swayanshu-routs-projects.vercel.app')) return true;
  if (origin.includes('drone-mnagement-system')) return true;
  
  return false;
};

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, origin || true);
    } else {
      callback(null, origin); // Allow anyway for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Handle preflight requests
app.options('*', cors(corsOptions));

// Apply CORS
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drones', droneRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sites', siteRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use(errorHandler);

// Initialize Socket.IO handlers
initializeSocket(io);

// Start server logic
const PORT = process.env.PORT || 5000;

// Only listen if not in Vercel environment
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export app for Vercel
module.exports = app;
