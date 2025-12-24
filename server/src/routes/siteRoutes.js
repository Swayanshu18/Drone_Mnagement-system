const express = require('express');
const router = express.Router();
const Site = require('../models/Site');

// No authentication required - public access

/**
 * @route GET /api/sites
 * @desc Get all sites
 * @access Private
 */
router.get('/', async (req, res, next) => {
  try {
    const sites = await Site.findAll();
    res.json(sites);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sites/:id
 * @desc Get site by ID
 * @access Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      const error = new Error('Site not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(site);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sites
 * @desc Create new site
 * @access Public
 */
router.post('/', async (req, res, next) => {
  try {
    const site = await Site.create(req.body);
    res.status(201).json(site);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/sites/:id
 * @desc Update site
 * @access Public
 */
router.put('/:id', async (req, res, next) => {
  try {
    const site = await Site.update(req.params.id, req.body);
    if (!site) {
      const error = new Error('Site not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(site);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/sites/:id
 * @desc Delete site
 * @access Public
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await Site.delete(req.params.id);
    if (!success) {
      const error = new Error('Site not found');
      error.statusCode = 404;
      throw error;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
