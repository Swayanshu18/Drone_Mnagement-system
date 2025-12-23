/**
 * Fleet Service
 * 
 * Manages drone fleet operations and availability.
 */

const Drone = require('../models/Drone');

const fleetService = {
    /**
     * Register a new drone
     * @param {Object} data - Drone data
     * @returns {Promise<Object>} Created drone
     */
    async registerDrone(data) {
        const existing = await Drone.findBySerialNumber(data.serial_number);
        if (existing) {
            const error = new Error('Drone with this serial number already exists');
            error.statusCode = 409;
            throw error;
        }
        return Drone.create(data);
    },

    /**
     * Get all drones with optional filtering
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} List of drones
     */
    async getAllDrones(filters) {
        return Drone.findAll(filters);
    },

    /**
     * Get drone details
     * @param {string} id - Drone ID
     * @returns {Promise<Object>} Drone details
     */
    async getDrone(id) {
        const drone = await Drone.findById(id);
        if (!drone) {
            const error = new Error('Drone not found');
            error.statusCode = 404;
            throw error;
        }
        return drone;
    },

    /**
     * Update drone details
     * @param {string} id - Drone ID
     * @param {Object} updates - Update data
     * @returns {Promise<Object>} Updated drone
     */
    async updateDrone(id, updates) {
        // Check if drone exists
        await this.getDrone(id);

        // If updating serial number, check for uniqueness
        if (updates.serial_number) {
            const existing = await Drone.findBySerialNumber(updates.serial_number);
            if (existing && existing.id !== id) {
                const error = new Error('Serial number already in use');
                error.statusCode = 409;
                throw error;
            }
        }

        return Drone.update(id, updates);
    },

    /**
     * Remove drone from fleet
     * @param {string} id - Drone ID
     * @returns {Promise<void>}
     */
    async removeDrone(id) {
        const success = await Drone.delete(id);
        if (!success) {
            const error = new Error('Drone not found');
            error.statusCode = 404;
            throw error;
        }
    },

    /**
     * update telemetry
     * @param {string} id - Drone ID
     * @param {Object} telemetry - Telemetry data (lat, long, battery, etc)
     * @returns {Promise<Object>} Updated drone
     */
    async updateTelemetry(id, telemetry) {
        const updates = {};
        if (telemetry.latitude !== undefined) updates.current_latitude = telemetry.latitude;
        if (telemetry.longitude !== undefined) updates.current_longitude = telemetry.longitude;
        if (telemetry.battery_level !== undefined) updates.battery_level = telemetry.battery_level;

        // Auto-update status based on battery/connection if needed
        // This logic can be expanded

        return Drone.update(id, updates);
    },

    /**
     * Check if drone is available for mission
     * @param {string} id - Drone ID
     * @returns {Promise<boolean>} True if available
     */
    async isDroneAvailable(id) {
        const drone = await this.getDrone(id);
        return drone.status === 'available' && drone.battery_level > 20;
    }
};

module.exports = fleetService;
