/**
 * Survey Report Model
 * 
 * Handles survey report data operations.
 */

const { query } = require('../config/database');

const SurveyReport = {
    /**
     * Find report by mission ID
     * @param {string} missionId - Mission UUID
     * @returns {Promise<Object|null>} Report object or null
     */
    async findByMissionId(missionId) {
        const result = await query(
            'SELECT * FROM survey_reports WHERE mission_id = $1',
            [missionId]
        );
        return result.rows[0] || null;
    },

    /**
     * Create or update report
     * @param {Object} reportData - Report data
     * @returns {Promise<Object>} Created report
     */
    async upset(reportData) {
        const {
            mission_id, duration_seconds, distance_meters, coverage_area_sqm,
            waypoints_completed, total_waypoints, completion_status,
            battery_consumed, max_altitude, avg_speed
        } = reportData;

        const result = await query(
            `INSERT INTO survey_reports (
         mission_id, duration_seconds, distance_meters, coverage_area_sqm,
         waypoints_completed, total_waypoints, completion_status,
         battery_consumed, max_altitude, avg_speed
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (mission_id) DO UPDATE SET
         duration_seconds = EXCLUDED.duration_seconds,
         distance_meters = EXCLUDED.distance_meters,
         coverage_area_sqm = EXCLUDED.coverage_area_sqm,
         waypoints_completed = EXCLUDED.waypoints_completed,
         total_waypoints = EXCLUDED.total_waypoints,
         completion_status = EXCLUDED.completion_status,
         battery_consumed = EXCLUDED.battery_consumed,
         max_altitude = EXCLUDED.max_altitude,
         avg_speed = EXCLUDED.avg_speed,
         created_at = CURRENT_TIMESTAMP
       RETURNING *`,
            [
                mission_id, duration_seconds, distance_meters, coverage_area_sqm,
                waypoints_completed, total_waypoints, completion_status,
                battery_consumed, max_altitude, avg_speed
            ]
        );
        return result.rows[0];
    },

    /**
     * Get all reports with optional filtering
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} List of reports
     */
    async findAll(filters = {}) {
        // Simulating joining with missions/drones in real app if complex filters needed
        let sql = `
       SELECT r.*, m.name as mission_name, m.drone_id, m.site_id, m.completed_at
       FROM survey_reports r
       JOIN missions m ON r.mission_id = m.id
     `;
        const values = [];
        const whereConditions = [];

        if (filters.drone_id) {
            whereConditions.push(`m.drone_id = $${values.length + 1}`);
            values.push(filters.drone_id);
        }

        if (filters.date_from) {
            whereConditions.push(`m.completed_at >= $${values.length + 1}`);
            values.push(filters.date_from);
        }

        if (filters.date_to) {
            whereConditions.push(`m.completed_at <= $${values.length + 1}`);
            values.push(filters.date_to);
        }

        if (whereConditions.length > 0) {
            sql += ' WHERE ' + whereConditions.join(' AND ');
        }

        sql += ' ORDER BY m.completed_at DESC';

        const result = await query(sql, values);
        return result.rows;
    },

    /**
     * Calculate organization statistics
     * @returns {Promise<Object>} Stats object
     */
    async getStatistics() {
        // Get mission counts from missions table
        const missionStats = await query(`
            SELECT 
                COUNT(*) as total_missions,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_missions,
                SUM(CASE WHEN status IN ('in_progress', 'starting') THEN 1 ELSE 0 END) as active_missions,
                SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned_missions,
                SUM(CASE WHEN status IN ('aborted', 'failed') THEN 1 ELSE 0 END) as aborted_missions,
                COALESCE(SUM(area_size), 0) as total_coverage
            FROM missions
        `);

        // Get missions by month for the chart
        const monthlyStats = await query(`
            SELECT 
                TO_CHAR(created_at, 'Mon') as month,
                EXTRACT(MONTH FROM created_at) as month_num,
                COUNT(*) as count
            FROM missions
            WHERE created_at >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
            ORDER BY month_num
        `);

        const stats = missionStats.rows[0];
        const totalMissions = parseInt(stats.total_missions) || 0;
        const completedMissions = parseInt(stats.completed_missions) || 0;
        
        return {
            total_missions: totalMissions,
            completed_missions: completedMissions,
            active_missions: parseInt(stats.active_missions) || 0,
            planned_missions: parseInt(stats.planned_missions) || 0,
            aborted_missions: parseInt(stats.aborted_missions) || 0,
            total_coverage: parseFloat(stats.total_coverage) || 0,
            success_rate: totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0,
            missions_by_month: monthlyStats.rows.map(row => ({
                month: row.month,
                count: parseInt(row.count)
            }))
        };
    }
};

module.exports = SurveyReport;
