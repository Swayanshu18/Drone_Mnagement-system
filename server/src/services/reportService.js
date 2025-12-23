/**
 * Report Service
 * 
 * Generates and manages survey reports.
 */

const SurveyReport = require('../models/SurveyReport');
const Mission = require('../models/Mission');
const MissionLog = require('../models/MissionLog');

const reportService = {
    /**
     * Generate report for a mission
     * @param {string} missionId - Mission UUID
     * @returns {Promise<Object>} Generated report
     */
    async generateReport(missionId) {
        const mission = await Mission.findById(missionId);
        if (!mission) {
            throw new Error('Mission not found');
        }

        if (!['completed', 'aborted', 'failed'].includes(mission.status)) {
            throw new Error('Mission is not finished');
        }

        // In a real app, we would calculate these from TelemetryHistory
        // Here we'll simulate calculating from logs or mock data
        const logs = await MissionLog.findByMissionId(missionId);

        // Mock calculations
        const duration_seconds = mission.completed_at && mission.started_at
            ? (new Date(mission.completed_at) - new Date(mission.started_at)) / 1000
            : 0;

        const reportData = {
            mission_id: mission.id,
            duration_seconds: Math.floor(duration_seconds),
            distance_meters: Math.floor(duration_seconds * 10), // mock speed 10m/s
            coverage_area_sqm: mission.status === 'completed' ? 5000 : 0, // mock coverage
            waypoints_completed: mission.status === 'completed' ? 10 : 5,
            total_waypoints: 10,
            completion_status: mission.status,
            battery_consumed: 20, // mock
            max_altitude: 50,
            avg_speed: 10
        };

        return SurveyReport.upset(reportData);
    },

    /**
     * Get mission report
     * @param {string} missionId - Mission UUID
     * @returns {Promise<Object>} Report
     */
    async getReport(missionId) {
        let report = await SurveyReport.findByMissionId(missionId);
        if (!report) {
            // Try generating it on the fly if mission is done but no report exists
            try {
                report = await this.generateReport(missionId);
            } catch (e) {
                // Mission probably not done or other error
                return null;
            }
        }
        return report;
    },

    /**
     * Get filtered reports
     * @param {Object} filters 
     */
    async getReports(filters) {
        return SurveyReport.findAll(filters);
    },

    /**
     * Get stats
     */
    async getStats() {
        return SurveyReport.getStatistics();
    }
};

module.exports = reportService;
