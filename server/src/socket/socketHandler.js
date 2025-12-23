/**
 * Socket.IO Handler
 * 
 * Initializes WebSocket connections and event handlers.
 */

const socketAuth = require('./auth.socket');

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
  io.to(`drone:${droneId}`).emit('telemetry:update', {
    droneId,
    ...telemetry,
    timestamp: new Date().toISOString()
  });
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
