/**
 * Mission Service
 * 
 * Manages mission planning, validation, and lifecycle.
 */

const Mission = require('../models/Mission');
const Waypoint = require('../models/Waypoint');
const FlightParameters = require('../models/FlightParameters');
const Drone = require('../models/Drone');
const fleetService = require('./fleetService');
const flightPatternService = require('./flightPatternService');

const missionService = {
    /**
     * Create a new mission
     * @param {Object} data - Mission data
     * @returns {Promise<Object>} Created mission
     */
    async createMission(data) {
        // Validate survey area
        if (!data.survey_area || data.survey_area.type !== 'Polygon') {
            const error = new Error('Invalid survey area');
            error.statusCode = 400;
            throw error;
        }

        // Validate drone availability if drone_id provided
        if (data.drone_id) {
            const isAvailable = await fleetService.isDroneAvailable(data.drone_id);
            if (!isAvailable) {
                const error = new Error('Selected drone is not available');
                error.statusCode = 409;
                throw error;
            }
        }

        const mission = await Mission.create(data);

        // Create flight parameters from provided data or defaults
        const params = data.parameters || {};
        await FlightParameters.upset(mission.id, {
            altitude: params.altitude || 50,
            speed: params.speed || 10,
            overlap_percentage: params.overlap_percentage || 70,
            sensor_type: params.sensor_type || 'RGB',
            collection_frequency: params.collection_frequency || 1,
            gimbal_angle: params.gimbal_angle || -90
        });

        return mission;
    },

    /**
     * Get mission details
     * @param {string} id - Mission ID
     * @returns {Promise<Object>} Mission with waypoints and params
     */
    async getMission(id) {
        const mission = await Mission.findById(id);
        if (!mission) {
            const error = new Error('Mission not found');
            error.statusCode = 404;
            throw error;
        }

        const waypoints = await Waypoint.findByMissionId(id);
        const parameters = await FlightParameters.findByMissionId(id);

        return { ...mission, waypoints, parameters };
    },

    /**
     * Update mission configuration
     * @param {string} id - Mission ID
     * @param {Object} updates - Updates for mission and parameters
     * @returns {Promise<Object>} Updated mission
     */
    async updateMission(id, updates) {
        const { parameters, ...missionUpdates } = updates;

        let mission = await Mission.findById(id);
        if (!mission) {
            const error = new Error('Mission not found');
            error.statusCode = 404;
            throw error;
        }

        if (mission.status !== 'planned') {
            const error = new Error('Cannot modify mission after it has started');
            error.statusCode = 400;
            throw error;
        }

        if (Object.keys(missionUpdates).length > 0) {
            mission = await Mission.update(id, missionUpdates);
        }

        if (parameters) {
            await FlightParameters.upset(id, parameters);
        }

        // Regenerate waypoints if area or pattern changed
        // In a real app we'd have a specific trigger for this, ensuring params are ready
        if (missionUpdates.survey_area || missionUpdates.flight_pattern || parameters) {
            await this.generateMissionWaypoints(id);
        }

        return this.getMission(id);
    },

    /**
     * Generate and save waypoints
     * @param {string} missionId - Mission ID
     */
    async generateMissionWaypoints(missionId) {
        const mission = await Mission.findById(missionId);
        const params = await FlightParameters.findByMissionId(missionId);

        if (!params) return; // Can't generate without params

        const waypoints = flightPatternService.generateWaypoints(
            mission.survey_area,
            mission.flight_pattern,
            params.altitude,
            params.overlap_percentage
        );

        // Replace existing waypoints
        await Waypoint.deleteByMissionId(missionId);
        await Waypoint.createBulk(missionId, waypoints);
    },

    /**
     * Assign drone to mission
     * @param {string} missionId - Mission ID
     * @param {string} droneId - Drone ID
     */
    async assignDrone(missionId, droneId) {
        const isAvailable = await fleetService.isDroneAvailable(droneId);
        if (!isAvailable) {
            const error = new Error('Drone is not available');
            error.statusCode = 409;
            throw error;
        }

        await Mission.update(missionId, { drone_id: droneId });
        // In a real app, update drone status to 'assigned' or similar
        // But schema only has 'in-mission', 'available' etc. 
        // We'll leave it as available until mission starts.
    }
};

module.exports = missionService;
