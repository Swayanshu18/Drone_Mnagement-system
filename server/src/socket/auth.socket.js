/**
 * Socket Authentication Middleware
 * 
 * Verifies JWT token for WebSocket connections.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const socketAuth = async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            const user = await User.findById(decoded.id);
            if (!user) {
                return next(new Error('Authentication error'));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    } else {
        next(new Error('Authentication error'));
    }
};

module.exports = socketAuth;
