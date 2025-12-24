const express = require('express');
const router = express.Router();
const missionService = require('../services/missionService');
const Mission = require('../models/Mission');
const missionControlService = require('../services/missionControlService');

// No authentication required - public access

/**
 * @route GET /api/missions
 * @desc Get all missions
 * @access Private
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      drone_id: req.query.drone_id,
      site_id: req.query.site_id
    };
    const missions = await Mission.findAll(filters);
    res.json(missions);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/missions/:id
 * @desc Get mission details
 * @access Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const mission = await missionService.getMission(req.params.id);
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/missions
 * @desc Create new mission
 * @access Public
 */
router.post('/', async (req, res, next) => {
  try {
    const missionData = {
      ...req.body,
      created_by: 'public-user'
    };
    const mission = await missionService.createMission(missionData);
    res.status(201).json(mission);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/missions/:id
 * @desc Update mission configuration
 * @access Public
 */
router.put('/:id', async (req, res, next) => {
  try {
    const mission = await missionService.updateMission(req.params.id, req.body);
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/missions/:id/assign
 * @desc Assign drone to mission
 * @access Public
 */
router.post('/:id/assign', async (req, res, next) => {
  try {
    const { drone_id } = req.body;
    if (!drone_id) {
      const error = new Error('Drone ID is required');
      error.statusCode = 400;
      throw error;
    }

    await missionService.assignDrone(req.params.id, drone_id);
    const updatedMission = await missionService.getMission(req.params.id);
    res.json(updatedMission);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/missions/:id
 * @desc Delete mission
 * @access Public
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await Mission.delete(req.params.id);
    if (!success) {
      const error = new Error('Mission not found');
      error.statusCode = 404;
      throw error;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/missions/:id/start
 * @desc Start mission
 * @access Public
 */
router.post('/:id/start', async (req, res, next) => {
  try {
    const mission = await missionControlService.startMission(req.params.id, 'public-user');
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/missions/:id/pause
 * @desc Pause mission
 * @access Public
 */
router.post('/:id/pause', async (req, res, next) => {
  try {
    const mission = await missionControlService.pauseMission(req.params.id, 'public-user');
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/missions/:id/resume
 * @desc Resume mission
 * @access Public
 */
router.post('/:id/resume', async (req, res, next) => {
  try {
    const mission = await missionControlService.resumeMission(req.params.id, 'public-user');
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/missions/:id/abort
 * @desc Abort mission
 * @access Public
 */
router.post('/:id/abort', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const mission = await missionControlService.abortMission(req.params.id, 'public-user', reason);
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
