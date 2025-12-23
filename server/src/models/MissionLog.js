/**
 * Mission Log Model
 * 
 * Handles audit logging for mission actions.
 */

const { query } = require('../config/database');

const MissionLog = {
    /**
     * Create a mission log entry
     * @param {Object} logData - Log data
     * @returns {Promise<Object>} Created log entry
     */
    async create({ mission_id, user_id, action, details }) {
        const result = await query(
            `INSERT INTO mission_logs (mission_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [mission_id, user_id, action, details]
        );
        return result.rows[0];
    },

    /**
     * Get logs for a mission
     * @param {string} missionId - Mission UUID
     * @returns {Promise<Array>} Array of log entries
     */
    async findByMissionId(missionId) {
        const result = await query(
            'SELECT * FROM mission_logs WHERE mission_id = $1 ORDER BY created_at DESC',
            [missionId]
        );
        return result.rows;
    }
};

module.exports = MissionLog;
