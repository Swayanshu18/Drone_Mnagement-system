/**
 * Mission Service
 * 
 * Handles all mission-related API calls.
 */

import api from './api';

export const missionService = {
    /**
     * Get all missions
     * @returns {Promise<Array>} List of missions
     */
    async getAllMissions() {
        const response = await api.get('/missions');
        return response.data;
    },

    /**
     * Get single mission by ID
     * @param {string} id 
     * @returns {Promise<Object>} Mission details
     */
    async getMission(id) {
        const response = await api.get(`/missions/${id}`);
        return response.data;
    },

    /**
     * Create a new mission
     * @param {Object} missionData 
     * @returns {Promise<Object>} Created mission
     */
    async createMission(missionData) {
        const response = await api.post('/missions', missionData);
        return response.data;
    },

    /**
     * Control mission execution
     * @param {string} id - Mission ID
     * @param {string} action - 'start', 'pause', 'resume', 'abort'
     * @returns {Promise<Object>} Updated mission status
     */
    async controlMission(id, action) {
        const response = await api.post(`/missions/${id}/${action}`);
        return response.data;
    },

    /**
     * Delete a mission
     * @param {string} id 
     */
    async deleteMission(id) {
        await api.delete(`/missions/${id}`);
    }
};
