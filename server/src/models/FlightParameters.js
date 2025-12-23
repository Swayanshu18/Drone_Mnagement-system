/**
 * FlightParameters Model
 * 
 * Handles flight configuration data.
 */

const { query } = require('../config/database');

const FlightParameters = {
    /**
     * Find parameters by mission ID
     * @param {string} missionId - Mission UUID
     * @returns {Promise<Object|null>} Parameters object or null
     */
    async findByMissionId(missionId) {
        const result = await query(
            'SELECT * FROM flight_parameters WHERE mission_id = $1',
            [missionId]
        );
        return result.rows[0] || null;
    },

    /**
     * Create or update parameters for a mission
     * @param {string} missionId - Mission UUID
     * @param {Object} params - Flight parameters
     * @returns {Promise<Object>} Created/Updated parameters
     */
    async upset(missionId, params) {
        const {
            altitude, speed, overlap_percentage, sensor_type,
            collection_frequency, gimbal_angle
        } = params;

        // Upsert query
        const result = await query(
            `INSERT INTO flight_parameters (
         mission_id, altitude, speed, overlap_percentage, 
         sensor_type, collection_frequency, gimbal_angle
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (mission_id) DO UPDATE SET
         altitude = EXCLUDED.altitude,
         speed = EXCLUDED.speed,
         overlap_percentage = EXCLUDED.overlap_percentage,
         sensor_type = EXCLUDED.sensor_type,
         collection_frequency = EXCLUDED.collection_frequency,
         gimbal_angle = EXCLUDED.gimbal_angle,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
            [
                missionId, altitude, speed, overlap_percentage,
                sensor_type, collection_frequency, gimbal_angle
            ]
        );

        return result.rows[0];
    }
};

module.exports = FlightParameters;
