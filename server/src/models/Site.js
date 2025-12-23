/**
 * Site Model
 * 
 * Handles site/location data operations.
 */

const { query } = require('../config/database');

const Site = {
    /**
     * Find site by ID
     * @param {string} id - Site UUID
     * @returns {Promise<Object|null>} Site object or null
     */
    async findById(id) {
        const result = await query(
            'SELECT * FROM sites WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Get all sites
     * @returns {Promise<Array>} Array of site objects
     */
    async findAll() {
        const result = await query(
            'SELECT * FROM sites ORDER BY name ASC'
        );
        return result.rows;
    },

    /**
     * Create a new site
     * @param {Object} siteData - Site data
     * @returns {Promise<Object>} Created site object
     */
    async create({ name, description, latitude, longitude, boundary, timezone }) {
        const result = await query(
            `INSERT INTO sites (name, description, latitude, longitude, boundary, timezone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [name, description, latitude, longitude, boundary, timezone || 'UTC']
        );
        return result.rows[0];
    },

    /**
     * Update site
     * @param {string} id - Site UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object|null>} Updated site object or null
     */
    async update(id, updates) {
        const allowedFields = ['name', 'description', 'latitude', 'longitude', 'boundary', 'timezone'];

        const setClause = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                setClause.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (setClause.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        const result = await query(
            `UPDATE sites SET ${setClause.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
            values
        );

        return result.rows[0] || null;
    },

    /**
     * Delete site
     * @param {string} id - Site UUID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        const result = await query('DELETE FROM sites WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
};

module.exports = Site;
