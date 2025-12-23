const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const protect = require('../middleware/auth.middleware');

/**
 * Authentication Routes
 * 
 * Handles user login, logout, token refresh, and current user retrieval.
 */

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const result = await authService.login(email, password);

    // Standardize response format to match frontend expectation
    res.json({
      access_token: result.token,
      refresh_token: result.refreshToken,
      user: result.user
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user / Clear cookie
 * @access  Private
 */
router.post('/logout', (req, res) => {
  // Since we are using stateless JWTs on client side, 
  // the client just needs to discard the token.
  // If we had a blacklist, we would add the token here.
  res.status(200).json({ message: 'Logged out successfully' });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const result = await authService.refreshToken(refreshToken);

    res.json({
      access_token: result.token,
      refresh_token: result.refreshToken
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  // req.user is set by protect middleware
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});

module.exports = router;
