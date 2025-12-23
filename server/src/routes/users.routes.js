const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole(['admin']));

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Private/Admin
 */
router.get('/', async (req, res, next) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/users
 * @desc Create a new user
 * @access Private/Admin
 */
router.post('/', async (req, res, next) => {
    try {
        const { email, password, name, role } = req.body;

        // Basic validation
        if (!email || !password || !name || !role) {
            const error = new Error('All fields are required');
            error.statusCode = 400;
            throw error;
        }

        if (!['admin', 'operator', 'viewer'].includes(role)) {
            const error = new Error('Invalid role');
            error.statusCode = 400;
            throw error;
        }

        // Check if email exists
        const existing = await User.findByEmail(email);
        if (existing) {
            const error = new Error('Email already in use');
            error.statusCode = 409;
            throw error;
        }

        const newUser = await User.create({ email, password, name, role });
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private/Admin
 */
router.get('/:id', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/users/:id
 * @desc Update user details
 * @access Private/Admin
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { email, name, role } = req.body;

        // Validate role if provided
        if (role && !['admin', 'operator', 'viewer'].includes(role)) {
            const error = new Error('Invalid role');
            error.statusCode = 400;
            throw error;
        }

        const updatedUser = await User.update(req.params.id, { email, name, role });

        if (!updatedUser) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
});

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Private/Admin
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const success = await User.delete(req.params.id);

        if (!success) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
