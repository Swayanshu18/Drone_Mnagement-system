/**
 * Socket Authentication Middleware
 * 
 * No authentication required - public access
 */

const socketAuth = async (socket, next) => {
    // Allow all connections without authentication
    socket.user = { id: 'public-user', role: 'public' };
    next();
};

module.exports = socketAuth;
