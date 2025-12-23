const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const authenticate = require('../middleware/auth.middleware');

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get tokens
 * @access Public
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            const error = new Error('Email and password are required');
            error.statusCode = 400;
            throw error;
        }

        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', (req, res) => {
    // Since we're using stateless JWTs, the client simply discards the token.
    // In a more complex implementation, we might blacklist the token here.
    res.json({ message: 'Logged out successfully' });
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            const error = new Error('Refresh token is required');
            error.statusCode = 400;
            throw error;
        }

        const result = await authService.refreshToken(refreshToken);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticate, async (req, res, next) => {
    try {
        // req.user is set by authenticate middleware, but we fetch fresh data
        // The token is guaranteed to be present and verifyToken passed by middleware
        const token = req.headers.authorization.split(' ')[1];
        const user = await authService.getCurrentUser(token);
        res.json(user);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
