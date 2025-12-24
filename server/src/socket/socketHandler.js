/**
 * Socket.IO Handler
 * 
 * Initializes WebSocket connections and event handlers.
 */

const socketAuth = require('./auth.socket');
const simulationService = require('../services/simulationService');

/**
 * Initialize Socket.IO event handlers
 * @param {Object} io - Socket.IO server instance
 */
const initializeSocket = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id} (User: ${socket.user.id})`);

    // Handle mission subscription
    socket.on('mission:subscribe', (missionId) => {
      socket.join(`mission:${missionId}`);
      console.log(`Client ${socket.id} subscribed to mission ${missionId}`);
    });

    // Simulation events
    socket.on('simulation:start', async (data) => {
      try {
        // Support both old format (just missionId) and new format (object with missionId and flightPattern)
        const missionId = typeof data === 'string' ? data : data.missionId;
        const flightPattern = typeof data === 'object' ? data.flightPattern : null;
        
        console.log(`🚀 Starting simulation for mission ${missionId} from client ${socket.id}`);
        if (flightPattern) {
          console.log(`🗺️ Using override flight pattern: ${flightPattern}`);
        }
        
        await simulationService.startSimulation(missionId, io, flightPattern);
        console.log(`✅ Simulation started successfully for mission ${missionId}`);
      } catch (err) {
        console.error(`❌ Simulation start error:`, err.message);
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('simulation:stop', (missionId) => {
      simulationService.stopSimulation(missionId);
    });

    socket.on('simulation:pause', (missionId) => {
      simulationService.pauseSimulation(missionId);
    });

    socket.on('simulation:resume', (missionId) => {
      simulationService.resumeSimulation(missionId, io);
    });

    socket.on('simulation:setSpeed', ({ missionId, speed }) => {
      simulationService.setSpeed(missionId, speed);
    });

    socket.on('simulation:rth', (missionId) => {
      simulationService.triggerRTH(missionId);
    });

    // Handle mission unsubscription
    socket.on('mission:unsubscribe', (missionId) => {
      socket.leave(`mission:${missionId}`);
      console.log(`Client ${socket.id} unsubscribed from mission ${missionId}`);
    });

    // Handle drone subscription
    socket.on('drone:subscribe', (droneId) => {
      socket.join(`drone:${droneId}`);
      console.log(`Client ${socket.id} subscribed to drone ${droneId}`);
    });

    // Handle drone unsubscription
    socket.on('drone:unsubscribe', (droneId) => {
      socket.leave(`drone:${droneId}`);
      console.log(`Client ${socket.id} unsubscribed from drone ${droneId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log('Socket.IO handlers initialized');
};

/**
 * Emit telemetry update to subscribed clients
 * @param {Object} io - Socket.IO server instance
 * @param {string} droneId - Drone ID
 * @param {Object} telemetry - Telemetry data
 */
const emitTelemetryUpdate = (io, droneId, telemetry) => {
  const room = `drone:${droneId}`;
  const clientCount = io.sockets.adapter.rooms.get(room)?.size || 0;
  
  io.to(room).emit('telemetry:update', {
    droneId,
    ...telemetry,
    timestamp: new Date().toISOString()
  });
  
  // Log occasionally to verify emission
  if (Math.random() < 0.01) { // 1% of the time
    console.log(`📡 Emitting telemetry to ${clientCount} clients in room ${room}`);
  }
};

/**
 * Emit mission status update to subscribed clients
 * @param {Object} io - Socket.IO server instance
 * @param {string} missionId - Mission ID
 * @param {Object} status - Status data
 */
const emitMissionStatus = (io, missionId, status) => {
  io.to(`mission:${missionId}`).emit('mission:status', {
    missionId,
    ...status,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit mission progress update to subscribed clients
 * @param {Object} io - Socket.IO server instance
 * @param {string} missionId - Mission ID
 * @param {Object} progress - Progress data
 */
const emitMissionProgress = (io, missionId, progress) => {
  io.to(`mission:${missionId}`).emit('mission:progress', {
    missionId,
    ...progress,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit drone status change to all clients
 * @param {Object} io - Socket.IO server instance
 * @param {string} droneId - Drone ID
 * @param {Object} status - Status data
 */
const emitDroneStatus = (io, droneId, status) => {
  io.emit('drone:status', {
    droneId,
    ...status,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit low battery alert
 * @param {Object} io - Socket.IO server instance
 * @param {string} droneId - Drone ID
 * @param {number} batteryLevel - Current battery level
 */
const emitBatteryAlert = (io, droneId, batteryLevel) => {
  io.emit('alert:battery', {
    droneId,
    batteryLevel,
    message: `Low battery warning: Drone battery at ${batteryLevel}%`,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  initializeSocket,
  emitTelemetryUpdate,
  emitMissionStatus,
  emitMissionProgress,
  emitDroneStatus,
  emitBatteryAlert
};
