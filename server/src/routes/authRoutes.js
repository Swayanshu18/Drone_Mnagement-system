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

    // Set secure cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true, // Always true for cross-site
      sameSite: 'none', // Required for cross-site
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

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
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
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
