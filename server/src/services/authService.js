/**
 * Authentication Service
 * 
 * Handles JWT token generation, validation, and user authentication.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const authService = {
  /**
   * Generate JWT access token
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  },

  /**
   * Generate refresh token
   * @param {Object} user - User object
   * @returns {string} Refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
  },

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  },

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and tokens
   * @throws {Error} If credentials are invalid
   */
  async login(email, password) {
    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Verify password
    const isValid = await User.verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Return user data (without password) and tokens
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token,
      refreshToken
    };
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   * @throws {Error} If refresh token is invalid
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await User.findById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        token: this.generateToken(user),
        refreshToken: this.generateRefreshToken(user)
      };
    } catch (error) {
      const err = new Error('Invalid refresh token');
      err.statusCode = 401;
      throw err;
    }
  },

  /**
   * Get current user from token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} User data
   * @throws {Error} If token is invalid or user not found
   */
  async getCurrentUser(token) {
    const decoded = this.verifyToken(token);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }
};

module.exports = authService;
