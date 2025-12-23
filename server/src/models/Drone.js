/**
 * Drone Model
 * 
 * Handles drone data operations.
 */

const { query } = require('../config/database');

const Drone = {
    /**
     * Find drone by ID
     * @param {string} id - Drone UUID
     * @returns {Promise<Object|null>} Drone object or null
     */
    async findById(id) {
        const result = await query(
            'SELECT * FROM drones WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Find drone by serial number
     * @param {string} serialNumber - Drone serial number
     * @returns {Promise<Object|null>} Drone object or null
     */
    async findBySerialNumber(serialNumber) {
        const result = await query(
            'SELECT * FROM drones WHERE serial_number = $1',
            [serialNumber]
        );
        return result.rows[0] || null;
    },

    /**
     * Get all drones
     * @param {Object} filters - Optional filters (site_id, status)
     * @returns {Promise<Array>} Array of drone objects
     */
    async findAll(filters = {}) {
        let sql = 'SELECT * FROM drones';
        const values = [];
        const whereConditions = [];

        if (filters.site_id) {
            values.push(filters.site_id);
            whereConditions.push('site_id = $' + values.length);
        }

        if (filters.status) {
            values.push(filters.status);
            whereConditions.push('status = $' + values.length);
        }

        if (whereConditions.length > 0) {
            sql += ' WHERE ' + whereConditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';

        const result = await query(sql, values);
        return result.rows;
    },

    /**
     * Create a new drone
     * @param {Object} droneData - Drone data
     * @returns {Promise<Object>} Created drone object
     */
    async create({ name, model, serial_number, site_id, home_latitude, home_longitude }) {
        const result = await query(
            `INSERT INTO drones (name, model, serial_number, site_id, home_latitude, home_longitude)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [name, model, serial_number, site_id, home_latitude, home_longitude]
        );
        return result.rows[0];
    },

    /**
     * Update drone
     * @param {string} id - Drone UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object|null>} Updated drone object or null
     */
    async update(id, updates) {
        const allowedFields = [
            'name', 'model', 'serial_number', 'status', 'battery_level',
            'current_latitude', 'current_longitude', 'home_latitude', 'home_longitude',
            'site_id', 'last_maintenance'
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
        const sql = 'UPDATE drones SET ' + setClause.join(', ') + ' WHERE id = $' + paramIndex + ' RETURNING *';
        const result = await query(sql, values);

        return result.rows[0] || null;
    },

    /**
     * Delete drone
     * @param {string} id - Drone UUID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        const result = await query('DELETE FROM drones WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
};

module.exports = Drone;
