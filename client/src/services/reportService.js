/**
 * Report Service
 * 
 * Handles API calls for survey reports and statistics.
 */

import api from './api';

export const reportService = {
    /**
     * Get all reports with optional filters
     * @param {Object} filters - { startDate, endDate, droneId, status }
     * @returns {Promise<Array>} List of reports
     */
    async getAllReports(filters = {}) {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.droneId) params.append('droneId', filters.droneId);
        if (filters.status) params.append('status', filters.status);

        const response = await api.get('/reports', { params });
        return response.data;
    },

    /**
     * Get report by mission ID
     * @param {string} missionId 
     * @returns {Promise<Object>} Report details
     */
    async getReportByMission(missionId) {
        const response = await api.get(`/reports/${missionId}`);
        return response.data;
    },

    /**
     * Get organization statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStats() {
        const response = await api.get('/reports/stats');
        return response.data;
    },

    /**
     * Generate/Download PDF report (Mock)
     * @param {string} missionId 
     */
    async downloadReport(missionId) {
        // In a real app, this would download a blob
        const response = await api.get(`/reports/${missionId}/pdf`, { responseType: 'blob' });
        return response.data;
    }
};
