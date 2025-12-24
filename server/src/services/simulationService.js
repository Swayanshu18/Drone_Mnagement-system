const missionService = require('./missionService');
const FlightDynamics = require('./simulation/FlightDynamics');
const PathStrategies = require('./simulation/PathStrategies');

// Store active simulations: Map<missionId, { dynamics: FlightDynamics, interval: NodeJS.Timer, path: [], waypoints: [] }>
const simulations = new Map();

const simulationService = {
    /**
     * Start mission simulation
     * @param {string} missionId - Mission ID
     * @param {Object} io - Socket.IO instance
     * @param {string} flightPatternOverride - Optional flight pattern override
     */
    async startSimulation(missionId, io, flightPatternOverride = null) {
        console.log(`📋 Checking if simulation already exists for mission ${missionId}`);
        if (simulations.has(missionId)) {
            console.log(`⚠️ Simulation already running for mission ${missionId}`);
            return;
        }

        console.log(`📡 Fetching mission data for ${missionId}`);
        const mission = await missionService.getMission(missionId);
        if (!mission) {
            console.error(`❌ Mission ${missionId} not found`);
            throw new Error('Mission not found');
        }

        // Use override pattern if provided, otherwise use mission's pattern
        const flightPattern = flightPatternOverride || mission.flight_pattern || 'grid';

        console.log(`✅ Mission found:`, {
            id: mission.id,
            name: mission.name,
            drone_id: mission.drone_id,
            flight_pattern: mission.flight_pattern,
            using_pattern: flightPattern
        });

        // Generate flight path based on mission type
        const surveyArea = typeof mission.survey_area === 'string' ? JSON.parse(mission.survey_area) : mission.survey_area;
        console.log(`🗺️ Generating flight path for pattern: ${flightPattern}`);
        const flightPath = PathStrategies.generate(flightPattern, surveyArea);

        if (!flightPath || flightPath.length === 0) {
            console.error(`❌ Could not generate flight path for mission ${missionId}`);
            throw new Error('Could not generate flight path');
        }

        console.log(`✈️ Flight path generated: ${flightPath.length} waypoints`);

        // Initialize Physics Engine
        const dynamics = new FlightDynamics({
            position: flightPath[0], // Start at first waypoint
            altitude: 0,
            battery: 100
        });
        dynamics.state = 'TAKEOFF';
        dynamics.setTargetSpeed(mission.parameters?.speed || 10);

        console.log(`🚁 Drone initialized at position:`, flightPath[0]);

        // Emit initial state and path to client (convert to [lat, lng] format for Leaflet)
        const formattedPath = flightPath.map(p => [p.lat, p.lng]);
        io.to(`mission:${missionId}`).emit('mission:status', {
            missionId,
            status: 'started',
            flightPath: formattedPath,
            waypoints: formattedPath,
            timestamp: new Date().toISOString()
        });

        console.log(`📤 Emitted initial mission status with ${formattedPath.length} waypoints`);

        // Simulation Loop (20Hz for smooth physics)
        const dt = 0.05;
        let currentWaypointIdx = 0;
        let frameCount = 0;

        const intervalId = setInterval(() => {
            frameCount++;

            // 1. Determine Target
            let target = null;

            if (dynamics.state === 'TAKEOFF') {
                if (dynamics.altitude < 50) dynamics.altitude += 5 * dt;
                else dynamics.state = 'FLYING';
                target = flightPath[0];
            } else if (dynamics.state === 'FLYING') {
                target = flightPath[currentWaypointIdx];

                // Check if reached waypoint (within 5 meters)
                const dist = this._getDistance(dynamics.position, target);
                if (dist < 5) {
                    currentWaypointIdx++;
                    if (currentWaypointIdx >= flightPath.length) {
                        dynamics.state = 'RTH';
                    }
                }
            } else if (dynamics.state === 'RTH') {
                // Return to first point (Home) at safe altitude
                target = flightPath[0];
                const dist = this._getDistance(dynamics.position, target);
                if (dist < 5) dynamics.state = 'LANDING';
            } else if (dynamics.state === 'LANDING') {
                if (dynamics.altitude > 0) dynamics.altitude -= 2 * dt;
                else {
                    dynamics.state = 'CHARGING';
                    this.stopSimulation(missionId);
                    io.to(`mission:${missionId}`).emit('mission:status', {
                        missionId,
                        status: 'completed',
                        timestamp: new Date().toISOString()
                    });
                    console.log(`🏁 Mission ${missionId} completed`);
                }
                target = flightPath[0];
            }

            // 2. Update Physics
            dynamics.update(dt, target);

            // 3. Emit Telemetry at 20Hz for smooth animation
            const telemetry = {
                droneId: mission.drone_id,
                latitude: dynamics.position.lat,
                longitude: dynamics.position.lng,
                altitude: dynamics.altitude,
                speed: dynamics.speed,
                battery: dynamics.battery,
                heading: dynamics.heading,
                state: dynamics.state,
                timestamp: new Date().toISOString()
            };
            io.to(`drone:${mission.drone_id}`).emit('telemetry:update', telemetry);

            // Log every 20 frames (once per second)
            if (frameCount % 20 === 0) {
                console.log(`📡 [${missionId}] Frame ${frameCount}: State=${dynamics.state}, Waypoint=${currentWaypointIdx}/${flightPath.length}, Battery=${dynamics.battery.toFixed(1)}%`);
            }

            // Progress (every update for smooth progress bar)
            const progress = Math.min(100, (currentWaypointIdx / flightPath.length) * 100);
            io.to(`mission:${missionId}`).emit('mission:progress', {
                missionId,
                percentage: progress,
                eta: this._calculateETA(flightPath, currentWaypointIdx, dynamics.speed),
                timestamp: new Date().toISOString()
            });

            // 4. Check Battery RTH
            if (dynamics.battery < 20 && dynamics.state === 'FLYING') {
                dynamics.state = 'RTH';
                console.log(`🔋 Low battery RTH triggered for mission ${missionId}`);
            }

        }, dt * 1000);

        simulations.set(missionId, { intervalId, dynamics, path: flightPath });
        console.log(`✅ Simulation loop started for mission ${missionId}`);
    },

    stopSimulation(missionId) {
        const sim = simulations.get(missionId);
        if (sim) {
            clearInterval(sim.intervalId);
            simulations.delete(missionId);
        }
    },

    setSpeed(missionId, speed) {
        const sim = simulations.get(missionId);
        if (sim) {
            sim.dynamics.setTargetSpeed(speed);
        }
    },

    triggerRTH(missionId) {
        const sim = simulations.get(missionId);
        if (sim) {
            sim.dynamics.state = 'RTH';
        }
    },

    pauseSimulation(missionId) {
        // Clear interval but keep state in map
        const sim = simulations.get(missionId);
        if (sim) clearInterval(sim.intervalId);
    },

    resumeSimulation(missionId, io) {
        // Re-create interval with existing dynamics... (simplified for now)
        // ideally we separate "loop" from "start" logic
    },

    _getDistance(p1, p2) {
        if (!p1 || !p2) return 99999;
        const R = 6371e3;
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLon = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    _calculateETA(path, currentIdx, speed) {
        if (speed <= 0.1) return 'Inf';
        // Calculate remaining distance
        // Simplified: straight line from current -> end
        // Better: sum segments
        return ((path.length - currentIdx) * 10 / speed).toFixed(0) + 's'; // Mock distance
    }
};

module.exports = simulationService;
