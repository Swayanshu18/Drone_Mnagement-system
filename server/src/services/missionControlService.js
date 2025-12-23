/**
 * Mission Control Service
 * 
 * Manages mission state transitions and execution.
 */

const Mission = require('../models/Mission');
const MissionLog = require('../models/MissionLog');
const Drone = require('../models/Drone');

// Valid state transitions
const VALID_TRANSITIONS = {
    'planned': ['starting', 'aborted'],
    'starting': ['in-progress', 'aborted', 'failed'],
    'in-progress': ['paused', 'completed', 'aborted', 'failed'],
    'paused': ['in-progress', 'aborted'],
    'aborted': [], // Terminal
    'completed': [], // Terminal
    'failed': [] // Terminal
};

const missionControlService = {
    /**
     * Validate state transition
     * @param {string} currentState 
     * @param {string} targetState 
     * @returns {boolean}
     */
    isValidTransition(currentState, targetState) {
        const allowed = VALID_TRANSITIONS[currentState] || [];
        return allowed.includes(targetState);
    },

    /**
     * Change mission status
     * @param {string} missionId - Mission ID
     * @param {string} newState - Target state
     * @param {string} userId - User initiating action
     * @param {string} reason - Optional reason
     */
    async _changeStatus(missionId, newState, userId, reason = null) {
        const mission = await Mission.findById(missionId);
        if (!mission) {
            throw new Error('Mission not found');
        }

        if (!this.isValidTransition(mission.status, newState)) {
            const error = new Error(`Invalid transition from ${mission.status} to ${newState}`);
            error.statusCode = 400;
            throw error;
        }

        const updates = { status: newState };

        // Status-specific updates
        if (newState === 'starting') {
            updates.started_at = new Date();
        } else if (['completed', 'aborted', 'failed'].includes(newState)) {
            updates.completed_at = new Date();
        }

        // Update mission
        await Mission.update(missionId, updates);

        // Update drone status if assigned
        if (mission.drone_id) {
            let droneStatus = 'available';
            if (['starting', 'in-progress'].includes(newState)) droneStatus = 'in-mission';
            // On pause, drone might hover (still in mission or specific status)
            // On terminal states, drone becomes available ( or maybe manual check needed)
            if (['completed', 'aborted', 'failed'].includes(newState)) droneStatus = 'available';

            await Drone.update(mission.drone_id, { status: droneStatus });
        }

        // Log action
        await MissionLog.create({
            mission_id: missionId,
            user_id: userId,
            action: `STATUS_CHANGE_${newState.toUpperCase()}`,
            details: { from: mission.status, to: newState, reason }
        });

        return await Mission.findById(missionId);
    },

    /**
     * Start mission
     * @param {string} missionId 
     * @param {string} userId 
     */
    async startMission(missionId, userId) {
        // Check if mission has a drone assigned
        const mission = await Mission.findById(missionId);
        if (!mission) {
            const error = new Error('Mission not found');
            error.statusCode = 404;
            throw error;
        }
        
        if (!mission.drone_id) {
            const error = new Error('Cannot start mission: No drone assigned');
            error.statusCode = 400;
            throw error;
        }
        
        // Check if drone is available
        const drone = await Drone.findById(mission.drone_id);
        if (!drone) {
            const error = new Error('Assigned drone not found');
            error.statusCode = 400;
            throw error;
        }
        
        if (drone.status !== 'available') {
            const error = new Error(`Cannot start mission: Drone is ${drone.status}`);
            error.statusCode = 400;
            throw error;
        }
        
        return this._changeStatus(missionId, 'starting', userId);
    },

    /**
     * Confirm mission active (from drone feedback)
     * @param {string} missionId 
     */
    async confirmMissionStarted(missionId) {
        // System action, maybe no user ID or specific system user
        const mission = await Mission.findById(missionId);
        if (mission.status === 'starting') {
            await Mission.update(missionId, { status: 'in-progress' });
            // Drone status already updated in startMission
        }
    },

    /**
     * Pause mission
     * @param {string} missionId 
     * @param {string} userId 
     */
    async pauseMission(missionId, userId) {
        return this._changeStatus(missionId, 'paused', userId);
    },

    /**
     * Resume mission
     * @param {string} missionId 
     * @param {string} userId 
     */
    async resumeMission(missionId, userId) {
        return this._changeStatus(missionId, 'in-progress', userId);
    },

    /**
     * Abort mission
     * @param {string} missionId 
     * @param {string} userId 
     * @param {string} reason 
     */
    async abortMission(missionId, userId, reason) {
        return this._changeStatus(missionId, 'aborted', userId, reason);
    }
};

module.exports = missionControlService;
