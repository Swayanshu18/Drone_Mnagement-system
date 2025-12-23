/**
 * Drone Service
 * 
 * API interactions for drone fleet management.
 */

import api from './api';

export const droneService = {
    /**
     * Get all drones
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} List of drones
     */
    async getAllDrones(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.site_id) params.append('site_id', filters.site_id);

        const response = await api.get(`/drones?${params.toString()}`);
        return response.data;
    },

    /**
     * Get drone by ID
     * @param {string} id - Drone ID
     * @returns {Promise<Object>} Drone details
     */
    async getDrone(id) {
        const response = await api.get(`/drones/${id}`);
        return response.data;
    },

    /**
     * Register new drone
     * @param {Object} droneData 
     * @returns {Promise<Object>} Created drone
     */
    async createDrone(droneData) {
        const response = await api.post('/drones', droneData);
        return response.data;
    },

    /**
     * Update drone details
     * @param {string} id - Drone ID
     * @param {Object} updates 
     * @returns {Promise<Object>} Updated drone
     */
    async updateDrone(id, updates) {
        const response = await api.put(`/drones/${id}`, updates);
        return response.data;
    },

    /**
     * Decommission drone
     * @param {string} id - Drone ID
     */
    async deleteDrone(id) {
        await api.delete(`/drones/${id}`);
    },

    /**
     * Get drone telemetry
     * @param {string} id - Drone ID
     * @returns {Promise<Object>} Telemetry data
     */
    async getTelemetry(id) {
        const response = await api.get(`/drones/${id}/telemetry`);
        return response.data;
    }
};
