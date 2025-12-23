const express = require('express');
const router = express.Router();
const missionService = require('../services/missionService');
const Mission = require('../models/Mission');
const missionControlService = require('../services/missionControlService');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// Protect all routes
router.use(authenticate);

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
 * @access Private/Admin/Operator
 */
router.post('/', requireRole(['admin', 'operator']), async (req, res, next) => {
  try {
    const missionData = {
      ...req.body,
      created_by: req.user.id
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
 * @access Private/Admin/Operator
 */
router.put('/:id', requireRole(['admin', 'operator']), async (req, res, next) => {
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
 * @access Private/Admin/Operator
 */
router.post('/:id/assign', requireRole(['admin', 'operator']), async (req, res, next) => {
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
 * @access Private/Admin
 */
router.delete('/:id', requireRole(['admin']), async (req, res, next) => {
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
 * @access Private/Admin/Operator
 */
router.post('/:id/start', requireRole(['admin', 'operator']), async (req, res, next) => {
  try {
    const mission = await missionControlService.startMission(req.params.id, req.user.id);
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/missions/:id/pause
 * @desc Pause mission
 * @access Private/Admin/Operator
 */
router.post('/:id/pause', requireRole(['admin', 'operator']), async (req, res, next) => {
  try {
    const mission = await missionControlService.pauseMission(req.params.id, req.user.id);
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/missions/:id/resume
 * @desc Resume mission
 * @access Private/Admin/Operator
 */
router.post('/:id/resume', requireRole(['admin', 'operator']), async (req, res, next) => {
  try {
    const mission = await missionControlService.resumeMission(req.params.id, req.user.id);
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/missions/:id/abort
 * @desc Abort mission
 * @access Private/Admin/Operator
 */
router.post('/:id/abort', requireRole(['admin', 'operator']), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const mission = await missionControlService.abortMission(req.params.id, req.user.id, reason);
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
