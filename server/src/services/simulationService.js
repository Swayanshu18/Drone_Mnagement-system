/**
 * Simulation Service
 * 
 * Simulates drone movement and telemetry for testing and demos.
 */

const missionService = require('./missionService');
const fleetService = require('./fleetService');
const socketHandler = require('../socket/socketHandler');

// Store active simulations
const simulations = new Map();

const simulationService = {
    /**
     * Start mission simulation
     * @param {string} missionId 
     * @param {Object} io - Socket.io instance
     */
    async startSimulation(missionId, io) {
        if (simulations.has(missionId)) return;

        const mission = await missionService.getMission(missionId);
        if (!mission || !mission.waypoints || mission.waypoints.length === 0) {
            throw new Error('Invalid mission for simulation');
        }

        const state = {
            missionId,
            droneId: mission.drone_id,
            currentWaypointIndex: 0,
            currentLat: mission.waypoints[0].latitude,
            currentLng: mission.waypoints[0].longitude,
            speed: mission.parameters?.speed || 10,
            battery: 100,
            altitude: mission.parameters?.altitude || 50
        };

        const intervalId = setInterval(async () => {
            await this._updateSimulation(state, mission.waypoints, io);
        }, 1000); // 1Hz update

        simulations.set(missionId, { intervalId, state });
    },

    /**
     * Stop simulation
     * @param {string} missionId 
     */
    stopSimulation(missionId) {
        const sim = simulations.get(missionId);
        if (sim) {
            clearInterval(sim.intervalId);
            simulations.delete(missionId);
        }
    },

    /**
     * Simulation loop step
     */
    async _updateSimulation(state, waypoints, io) {
        const target = waypoints[state.currentWaypointIndex];

        // Simulate movement (simplified: jump to target or interpolate)
        // For demo, we'll just snap to waypoints or interpolate slowly
        // ... logic to move state.currentLat/Lng towards target ...

        // Check if reached target
        const distance = Math.sqrt(
            Math.pow(state.currentLat - target.latitude, 2) +
            Math.pow(state.currentLng - target.longitude, 2)
        ); // Very rough Euclidean in degrees

        if (distance < 0.0001) {
            state.currentWaypointIndex++;
            if (state.currentWaypointIndex >= waypoints.length) {
                // Mission complete
                this.stopSimulation(state.missionId);
                socketHandler.emitMissionStatus(io, state.missionId, { status: 'completed' });
                // Ideally call missionControlService.completeMission here
                return;
            }
        } else {
            // Move towards target
            const step = 0.0001; // Approx speed
            const angle = Math.atan2(target.longitude - state.currentLng, target.latitude - state.currentLat);
            state.currentLat += Math.cos(angle) * step;
            state.currentLng += Math.sin(angle) * step;
        }

        // Drain battery
        state.battery -= 0.1;

        // Send telemetry
        const telemetry = {
            latitude: state.currentLat,
            longitude: state.currentLng,
            altitude: state.altitude,
            speed: state.speed,
            battery: state.battery,
            heading: 0 // Mock
        };

        socketHandler.emitTelemetryUpdate(io, state.droneId, telemetry);

        // Mock progress
        const progress = Math.round((state.currentWaypointIndex / waypoints.length) * 100);
        socketHandler.emitMissionProgress(io, state.missionId, { percentage: progress });

        // Update DB telemetry (async, fire and forget)
        // fleetService.updateTelemetry(state.droneId, telemetry);
    }
};

module.exports = simulationService;
