/**
 * Drone Survey Management System - Main Server Entry Point
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
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

// Initialize Socket.IO with proper CORS
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow all origins for WebSocket (can be restricted later)
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Make io accessible to routes
app.set('io', io);

// CORS configuration for production deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://drone-mnagement-system-tlfg-9wav36zls-swayanshu-routs-projects.vercel.app',
      'https://drone-mnagement-system-tlfg-md9a1gzze-swayanshu-routs-projects.vercel.app',
      /^https:\/\/drone-mnagement-system-tlfg-.*\.vercel\.app$/,  // All Vercel preview deployments
      'https://drone-mnagement-system.vercel.app'  // Production Vercel domain
    ];
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow anyway for now, can be strict later
    }
  },
  credentials: false, // We use JWT in headers, not cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

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

// Start server
const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
