/**
 * Mission Model
 * 
 * Handles mission data operations.
 */

const { query } = require('../config/database');

const Mission = {
    /**
     * Find mission by ID
     * @param {string} id - Mission UUID
     * @returns {Promise<Object|null>} Mission object or null
     */
    async findById(id) {
        const result = await query(
            'SELECT * FROM missions WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Get all missions with optional drone name
     * @param {Object} filters - Optional filters (status, drone_id, site_id)
     * @returns {Promise<Array>} Array of mission objects
     */
    async findAll(filters = {}) {
        let sql = `
            SELECT m.*, d.name as drone_name 
            FROM missions m 
            LEFT JOIN drones d ON m.drone_id = d.id
        `;
        const values = [];
        const whereConditions = [];

        if (filters.status) {
            values.push(filters.status);
            whereConditions.push('m.status = $' + values.length);
        }

        if (filters.drone_id) {
            values.push(filters.drone_id);
            whereConditions.push('m.drone_id = $' + values.length);
        }

        if (filters.site_id) {
            values.push(filters.site_id);
            whereConditions.push('m.site_id = $' + values.length);
        }

        if (whereConditions.length > 0) {
            sql += ' WHERE ' + whereConditions.join(' AND ');
        }

        sql += ' ORDER BY m.created_at DESC';

        const result = await query(sql, values);
        return result.rows;
    },

    /**
     * Create a new mission
     * @param {Object} missionData - Mission data
     * @returns {Promise<Object>} Created mission object
     */
    async create({ name, description, site_id, drone_id, survey_area, area_size, flight_pattern, created_by }) {
        // Convert survey_area to JSON string if it's an object
        const surveyAreaJson = typeof survey_area === 'string' ? survey_area : JSON.stringify(survey_area);
        
        const result = await query(
            `INSERT INTO missions (name, description, site_id, drone_id, survey_area, area_size, flight_pattern, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [name, description, site_id, drone_id, surveyAreaJson, area_size || 0, flight_pattern, created_by]
        );
        return result.rows[0];
    },

    /**
     * Update mission
     * @param {string} id - Mission UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object|null>} Updated mission object or null
     */
    async update(id, updates) {
        const allowedFields = [
            'name', 'description', 'drone_id', 'status', 'progress_percentage',
            'started_at', 'completed_at', 'survey_area', 'area_size', 'flight_pattern'
        ];

        const setClause = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                setClause.push(key + ' = $' + paramIndex);
                values.push(value);
                paramIndex++;
            }
        }

        if (setClause.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        const sql = 'UPDATE missions SET ' + setClause.join(', ') + ' WHERE id = $' + paramIndex + ' RETURNING *';
        const result = await query(sql, values);

        return result.rows[0] || null;
    },

    /**
     * Delete mission
     * @param {string} id - Mission UUID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        const result = await query('DELETE FROM missions WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
};

module.exports = Mission;
