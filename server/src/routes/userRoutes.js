/**
 * User Management Routes
 * 
 * Public routes for managing users.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// No authentication required - public access

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Public
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
 * @access Public
 */
router.post('/', async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      const error = new Error('Email, password, name, and role are required');
      error.statusCode = 400;
      throw error;
    }

    // Validate role
    const validRoles = ['admin', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
      const error = new Error('Invalid role. Must be admin, operator, or viewer');
      error.statusCode = 400;
      throw error;
    }

    // Check if email already exists
    const existing = await User.findByEmail(email);
    if (existing) {
      const error = new Error('Email already in use');
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({ email, password, name, role });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Public
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
 * @desc Update user
 * @access Public
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { email, name, role, password } = req.body;

    // Check if user exists
    const existing = await User.findById(req.params.id);
    if (!existing) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'operator', 'viewer'];
      if (!validRoles.includes(role)) {
        const error = new Error('Invalid role. Must be admin, operator, or viewer');
        error.statusCode = 400;
        throw error;
      }
    }

    // Check email uniqueness if changing
    if (email && email.toLowerCase() !== existing.email) {
      const emailExists = await User.findByEmail(email);
      if (emailExists) {
        const error = new Error('Email already in use');
        error.statusCode = 409;
        throw error;
      }
    }

    // Update user fields
    const updates = {};
    if (email) updates.email = email;
    if (name) updates.name = name;
    if (role) updates.role = role;

    const user = await User.update(req.params.id, updates);

    // Update password separately if provided
    if (password) {
      await User.updatePassword(req.params.id, password);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Public
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
