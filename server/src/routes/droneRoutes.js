const express = require('express');
const router = express.Router();
const fleetService = require('../services/fleetService');
const authenticate = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// Protect all routes
router.use(authenticate);

/**
 * @route GET /api/drones
 * @desc Get all drones
 * @access Private
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      site_id: req.query.site_id,
      status: req.query.status
    };
    const drones = await fleetService.getAllDrones(filters);
    res.json(drones);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/drones/:id
 * @desc Get drone by ID
 * @access Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const drone = await fleetService.getDrone(req.params.id);
    res.json(drone);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/drones
 * @desc Register new drone
 * @access Private/Admin/Operator
 */
router.post('/', requireRole(['admin', 'operator']), async (req, res, next) => {
  try {
    const drone = await fleetService.registerDrone(req.body);
    res.status(201).json(drone);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/drones/:id
 * @desc Update drone details
 * @access Private/Admin/Operator
 */
router.put('/:id', requireRole(['admin', 'operator']), async (req, res, next) => {
  try {
    const drone = await fleetService.updateDrone(req.params.id, req.body);
    res.json(drone);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/drones/:id
 * @desc Decommission drone
 * @access Private/Admin
 */
router.delete('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    await fleetService.removeDrone(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/drones/:id/telemetry
 * @desc Get latest drone telemetry
 * @access Private
 */
router.get('/:id/telemetry', async (req, res, next) => {
  try {
    const drone = await fleetService.getDrone(req.params.id);
    // In a real system, we might query a separate telemetry table for history,
    // but here we just return current state
    res.json({
      latitude: drone.current_latitude,
      longitude: drone.current_longitude,
      battery_level: drone.battery_level,
      status: drone.status,
      timestamp: drone.updated_at
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
