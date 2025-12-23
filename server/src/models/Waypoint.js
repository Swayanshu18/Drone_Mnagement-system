/**
 * Waypoint Model
 * 
 * Handles waypoint data operations.
 */

const { query } = require('../config/database');

const Waypoint = {
    /**
     * Find waypoints by mission ID
     * @param {string} missionId - Mission UUID
     * @returns {Promise<Array>} Array of waypoint objects ordered by sequence
     */
    async findByMissionId(missionId) {
        const result = await query(
            'SELECT * FROM waypoints WHERE mission_id = $1 ORDER BY sequence ASC',
            [missionId]
        );
        return result.rows;
    },

    /**
     * Create new waypoints in bulk
     * @param {string} missionId - Mission UUID
     * @param {Array} waypoints - Array of waypoint objects
     * @returns {Promise<Array>} Created waypoints
     */
    async createBulk(missionId, waypoints) {
        if (!waypoints || waypoints.length === 0) return [];

        // Construct bulk insert query
        // VALUES ($1,$2,$3,$4,$5,$6), ($7,$8,$9,$10,$11,$12), ...
        const values = [];
        const placeholders = [];
        let paramIndex = 1;

        waypoints.forEach((wp, index) => {
            placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
            values.push(missionId);
            values.push(index + 1); // sequence (1-based)
            values.push(wp.latitude);
            values.push(wp.longitude);
            values.push(wp.altitude);
            values.push(wp.action || 'flythrough');
            paramIndex += 6;
        });

        const result = await query(
            `INSERT INTO waypoints (mission_id, sequence, latitude, longitude, altitude, action)
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
            values
        );

        return result.rows;
    },

    /**
     * Delete waypoints by mission ID
     * @param {string} missionId - Mission UUID
     * @returns {Promise<boolean>} Success status
     */
    async deleteByMissionId(missionId) {
        const result = await query('DELETE FROM waypoints WHERE mission_id = $1', [missionId]);
        return result.rowCount > 0;
    }
};

module.exports = Waypoint;
