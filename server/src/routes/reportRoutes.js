const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const authenticate = require('../middleware/auth.middleware');

// Protect all routes
router.use(authenticate);

/**
 * @route GET /api/reports/stats
 * @desc Get aggregated statistics
 * @access Private
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await reportService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reports
 * @desc Get filtered reports
 * @access Private
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      drone_id: req.query.drone_id,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    const reports = await reportService.getReports(filters);
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reports/:missionId
 * @desc Get specific report
 * @access Private
 */
router.get('/:missionId', async (req, res, next) => {
  try {
    const report = await reportService.getReport(req.params.missionId);
    if (!report) {
      const error = new Error('Report not found');
      error.statusCode = 404;
      throw error;
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
