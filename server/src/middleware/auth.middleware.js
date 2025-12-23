const authService = require('../services/authService');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = authService.verifyToken(token);
      // Attach user info to request
      req.user = decoded;
      next();
    } catch (err) {
      const error = new Error('Invalid or expired token');
      error.statusCode = 401;
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
