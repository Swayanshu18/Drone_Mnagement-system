/**
 * Site Service
 * 
 * API interactions for site management.
 */

import api from './api';

export const siteService = {
    /**
     * Get all sites
     * @returns {Promise<Array>} List of sites
     */
    async getAllSites() {
        const response = await api.get('/sites');
        return response.data;
    },

    /**
     * Get site by ID
     * @param {string} id 
     * @returns {Promise<Object>} Site details
     */
    async getSite(id) {
        const response = await api.get(`/sites/${id}`);
        return response.data;
    },

    /**
     * Create site
     * @param {Object} siteData 
     * @returns {Promise<Object>} Created site
     */
    async createSite(siteData) {
        const response = await api.post('/sites', siteData);
        return response.data;
    },

    /**
     * Update site
     * @param {string} id 
     * @param {Object} updates 
     * @returns {Promise<Object>} Updated site
     */
    async updateSite(id, updates) {
        const response = await api.put(`/sites/${id}`, updates);
        return response.data;
    },

    /**
     * Delete site
     * @param {string} id 
     */
    async deleteSite(id) {
        await api.delete(`/sites/${id}`);
    }
};
