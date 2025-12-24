/**
 * Flight Simulation Engine
 * 
 * Core simulation engine for drone flight behavior.
 * Handles physics, battery, speed control, and state management.
 */

// Drone states
export const DroneState = {
  IDLE: 'idle',
  FLYING: 'flying',
  HOVERING: 'hovering',
  RETURNING: 'returning',
  CHARGING: 'charging',
  READY: 'ready'
};

// Mission states
export const MissionState = {
  PLANNED: 'planned',
  STARTING: 'starting',
  IN_PROGRESS: 'in-progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ABORTED: 'aborted',
  RTH_ACTIVE: 'rth-active'
};

// Default configuration
const DEFAULT_CONFIG = {
  // Speed settings (m/s)
  minSpeed: 2,
  maxSpeed: 20,
  defaultSpeed: 10,
  turnSpeedReduction: 0.6, // Speed multiplier during turns
  
  // Acceleration (m/s²)
  acceleration: 2,
  deceleration: 3,
  
  // Battery settings
  batteryCapacity: 100,
  baseDrainRate: 0.05, // % per second at hover
  speedDrainMultiplier: 0.01, // Additional drain per m/s
  maneuverDrainMultiplier: 1.5, // Multiplier for complex maneuvers
  chargingRate: 0.5, // % per second
  minChargeToFly: 20, // Minimum battery to start flying
  lowBatteryWarning: 20,
  criticalBatteryLevel: 10,
  rthBatteryThreshold: 15,
  
  // Flight dynamics
  hoverPauseDuration: 1000, // ms at waypoints
  turningRadius: 5, // meters
  altitudeChangeRate: 2, // m/s
  
  // Simulation
  updateInterval: 50, // ms (20 Hz)
  positionSmoothing: 0.15
};

class FlightSimulationEngine {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.reset();
  }

  reset() {
    this.state = {
      droneState: DroneState.IDLE,
      missionState: MissionState.PLANNED,
      position: null,
      homePosition: null,
      targetPosition: null,
      currentSpeed: 0,
      targetSpeed: this.config.defaultSpeed,
      battery: 100,
      altitude: 0,
      targetAltitude: 50,
      heading: 0,
      distanceTraveled: 0,
      missionProgress: 0,
      currentWaypointIndex: 0,
      isHovering: false,
      hoverStartTime: null,
      rthTriggered: false,
      rthReason: null,
      warnings: [],
      lastUpdateTime: Date.now()
    };
    
    this.flightPath = [];
    this.completedPath = [];
    this.rthPath = [];
    this.listeners = new Map();
    this.simulationInterval = null;
  }

  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  // Initialize with mission data
  initialize(missionData, flightPath) {
    this.reset();
    this.flightPath = flightPath;
    
    if (flightPath.length > 0) {
      this.state.position = [...flightPath[0]];
      this.state.homePosition = [...flightPath[0]];
      this.state.targetAltitude = missionData.altitude || 50;
      this.state.altitude = 0;
    }
    
    this.missionData = missionData;
    this.emit('initialized', this.getState());
  }

  // Set target speed (m/s)
  setSpeed(speed) {
    this.state.targetSpeed = Math.max(
      this.config.minSpeed,
      Math.min(this.config.maxSpeed, speed)
    );
    this.emit('speedChanged', this.state.targetSpeed);
  }

  // Get current state
  getState() {
    return { ...this.state };
  }


  // Start mission simulation
  start() {
    if (this.state.battery < this.config.minChargeToFly) {
      this.emit('error', { message: 'Battery too low to start mission' });
      return false;
    }

    if (this.flightPath.length === 0) {
      this.emit('error', { message: 'No flight path defined' });
      return false;
    }

    this.state.droneState = DroneState.FLYING;
    this.state.missionState = MissionState.IN_PROGRESS;
    this.state.lastUpdateTime = Date.now();
    
    this.simulationInterval = setInterval(() => {
      this.update();
    }, this.config.updateInterval);

    this.emit('started', this.getState());
    return true;
  }

  // Pause simulation
  pause() {
    if (this.state.missionState !== MissionState.IN_PROGRESS) return false;
    
    clearInterval(this.simulationInterval);
    this.simulationInterval = null;
    
    this.state.droneState = DroneState.HOVERING;
    this.state.missionState = MissionState.PAUSED;
    this.state.currentSpeed = 0;
    
    this.emit('paused', this.getState());
    return true;
  }

  // Resume simulation
  resume() {
    if (this.state.missionState !== MissionState.PAUSED) return false;
    
    this.state.droneState = DroneState.FLYING;
    this.state.missionState = MissionState.IN_PROGRESS;
    this.state.lastUpdateTime = Date.now();
    
    this.simulationInterval = setInterval(() => {
      this.update();
    }, this.config.updateInterval);

    this.emit('resumed', this.getState());
    return true;
  }

  // Stop/abort simulation
  stop() {
    clearInterval(this.simulationInterval);
    this.simulationInterval = null;
    
    this.state.droneState = DroneState.IDLE;
    this.state.missionState = MissionState.ABORTED;
    this.state.currentSpeed = 0;
    
    this.emit('stopped', this.getState());
    return true;
  }

  // Trigger Return-to-Home
  triggerRTH(reason = 'manual') {
    if (this.state.rthTriggered) return;
    
    this.state.rthTriggered = true;
    this.state.rthReason = reason;
    this.state.missionState = MissionState.RTH_ACTIVE;
    this.state.droneState = DroneState.RETURNING;
    
    // Calculate RTH path (direct line to home)
    this.rthPath = this.calculateRTHPath();
    this.state.currentWaypointIndex = 0;
    
    this.emit('rthTriggered', { reason, path: this.rthPath });
  }

  // Calculate shortest path back to home
  calculateRTHPath() {
    if (!this.state.position || !this.state.homePosition) return [];
    
    const path = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      path.push([
        this.state.position[0] + (this.state.homePosition[0] - this.state.position[0]) * t,
        this.state.position[1] + (this.state.homePosition[1] - this.state.position[1]) * t
      ]);
    }
    
    return path;
  }

  // Main update loop
  update() {
    const now = Date.now();
    const deltaTime = (now - this.state.lastUpdateTime) / 1000; // seconds
    this.state.lastUpdateTime = now;

    // Check battery warnings
    this.checkBatteryStatus();

    // Update based on current state
    if (this.state.rthTriggered) {
      this.updateRTH(deltaTime);
    } else if (this.state.droneState === DroneState.FLYING) {
      this.updateFlight(deltaTime);
    } else if (this.state.droneState === DroneState.HOVERING) {
      this.updateHover(deltaTime);
    }

    // Drain battery
    this.updateBattery(deltaTime);

    // Emit state update
    this.emit('update', this.getState());
  }

  // Update flight movement
  updateFlight(deltaTime) {
    if (this.state.currentWaypointIndex >= this.flightPath.length) {
      this.completeMission();
      return;
    }

    const targetWaypoint = this.flightPath[this.state.currentWaypointIndex];
    const distance = this.calculateDistance(this.state.position, targetWaypoint);
    
    // Check if we need to turn (angle change > 30 degrees)
    const isTurning = this.isApproachingTurn();
    const speedMultiplier = isTurning ? this.config.turnSpeedReduction : 1;
    
    // Smooth speed changes (acceleration/deceleration)
    const targetSpeed = this.state.targetSpeed * speedMultiplier;
    if (this.state.currentSpeed < targetSpeed) {
      this.state.currentSpeed = Math.min(
        targetSpeed,
        this.state.currentSpeed + this.config.acceleration * deltaTime
      );
    } else if (this.state.currentSpeed > targetSpeed) {
      this.state.currentSpeed = Math.max(
        targetSpeed,
        this.state.currentSpeed - this.config.deceleration * deltaTime
      );
    }

    // Move towards waypoint
    const moveDistance = this.state.currentSpeed * deltaTime * 0.00001; // Convert to degrees
    
    if (distance <= moveDistance) {
      // Reached waypoint
      this.state.position = [...targetWaypoint];
      this.completedPath.push([...targetWaypoint]);
      this.state.currentWaypointIndex++;
      
      // Check for hover pause at waypoints
      if (this.shouldHoverAtWaypoint()) {
        this.startHover();
      }
    } else {
      // Move towards waypoint
      const ratio = moveDistance / distance;
      this.state.position = [
        this.state.position[0] + (targetWaypoint[0] - this.state.position[0]) * ratio,
        this.state.position[1] + (targetWaypoint[1] - this.state.position[1]) * ratio
      ];
      this.completedPath.push([...this.state.position]);
    }

    // Update heading
    this.state.heading = this.calculateHeading(this.state.position, targetWaypoint);
    
    // Update distance traveled
    this.state.distanceTraveled += this.state.currentSpeed * deltaTime;
    
    // Update progress
    this.state.missionProgress = Math.min(100, 
      (this.state.currentWaypointIndex / this.flightPath.length) * 100
    );

    // Smooth altitude changes
    this.updateAltitude(deltaTime);
  }


  // Update RTH movement
  updateRTH(deltaTime) {
    if (this.state.currentWaypointIndex >= this.rthPath.length) {
      this.completeRTH();
      return;
    }

    const targetWaypoint = this.rthPath[this.state.currentWaypointIndex];
    const distance = this.calculateDistance(this.state.position, targetWaypoint);
    
    // RTH uses max safe speed
    const rthSpeed = this.config.maxSpeed * 0.8;
    this.state.currentSpeed = Math.min(
      rthSpeed,
      this.state.currentSpeed + this.config.acceleration * deltaTime
    );

    const moveDistance = this.state.currentSpeed * deltaTime * 0.00001;
    
    if (distance <= moveDistance) {
      this.state.position = [...targetWaypoint];
      this.state.currentWaypointIndex++;
    } else {
      const ratio = moveDistance / distance;
      this.state.position = [
        this.state.position[0] + (targetWaypoint[0] - this.state.position[0]) * ratio,
        this.state.position[1] + (targetWaypoint[1] - this.state.position[1]) * ratio
      ];
    }

    this.state.heading = this.calculateHeading(this.state.position, targetWaypoint);
    this.state.distanceTraveled += this.state.currentSpeed * deltaTime;
  }

  // Update hover state
  updateHover(deltaTime) {
    if (!this.state.hoverStartTime) return;
    
    const hoverDuration = Date.now() - this.state.hoverStartTime;
    if (hoverDuration >= this.config.hoverPauseDuration) {
      this.endHover();
    }
  }

  // Start hovering at waypoint
  startHover() {
    this.state.droneState = DroneState.HOVERING;
    this.state.isHovering = true;
    this.state.hoverStartTime = Date.now();
    this.state.currentSpeed = 0;
    this.emit('hoverStarted', { waypointIndex: this.state.currentWaypointIndex });
  }

  // End hover and resume flight
  endHover() {
    this.state.droneState = DroneState.FLYING;
    this.state.isHovering = false;
    this.state.hoverStartTime = null;
    this.emit('hoverEnded', { waypointIndex: this.state.currentWaypointIndex });
  }

  // Check if should hover at current waypoint
  shouldHoverAtWaypoint() {
    // Hover at every 10th waypoint or at significant turns
    return this.state.currentWaypointIndex % 10 === 0 || this.isSignificantTurn();
  }

  // Check if approaching a turn
  isApproachingTurn() {
    const lookAhead = 3;
    if (this.state.currentWaypointIndex + lookAhead >= this.flightPath.length) return false;
    
    const current = this.state.position;
    const next = this.flightPath[this.state.currentWaypointIndex];
    const future = this.flightPath[this.state.currentWaypointIndex + lookAhead];
    
    const angle1 = this.calculateHeading(current, next);
    const angle2 = this.calculateHeading(next, future);
    const angleDiff = Math.abs(angle1 - angle2);
    
    return angleDiff > 30 && angleDiff < 330;
  }

  // Check if at a significant turn
  isSignificantTurn() {
    if (this.state.currentWaypointIndex < 1 || 
        this.state.currentWaypointIndex >= this.flightPath.length - 1) return false;
    
    const prev = this.flightPath[this.state.currentWaypointIndex - 1];
    const current = this.flightPath[this.state.currentWaypointIndex];
    const next = this.flightPath[this.state.currentWaypointIndex + 1];
    
    const angle1 = this.calculateHeading(prev, current);
    const angle2 = this.calculateHeading(current, next);
    const angleDiff = Math.abs(angle1 - angle2);
    
    return angleDiff > 60 && angleDiff < 300;
  }

  // Update altitude smoothly
  updateAltitude(deltaTime) {
    const altDiff = this.state.targetAltitude - this.state.altitude;
    if (Math.abs(altDiff) > 0.1) {
      const change = Math.sign(altDiff) * this.config.altitudeChangeRate * deltaTime;
      this.state.altitude += Math.abs(change) > Math.abs(altDiff) ? altDiff : change;
    }
  }

  // Update battery consumption
  updateBattery(deltaTime) {
    if (this.state.droneState === DroneState.CHARGING) {
      // Charging
      this.state.battery = Math.min(100, 
        this.state.battery + this.config.chargingRate * deltaTime
      );
      
      if (this.state.battery >= 100) {
        this.state.droneState = DroneState.READY;
        this.emit('chargingComplete', this.getState());
      }
      return;
    }

    if (this.state.droneState === DroneState.IDLE || 
        this.state.droneState === DroneState.READY) return;

    // Calculate drain based on activity
    let drainRate = this.config.baseDrainRate;
    
    // Speed-based drain
    drainRate += this.state.currentSpeed * this.config.speedDrainMultiplier;
    
    // Maneuver complexity (turns drain more)
    if (this.isApproachingTurn()) {
      drainRate *= this.config.maneuverDrainMultiplier;
    }
    
    // Altitude affects drain (higher = more drain)
    drainRate *= 1 + (this.state.altitude / 200);

    this.state.battery = Math.max(0, this.state.battery - drainRate * deltaTime);
  }

  // Check battery status and trigger warnings/RTH
  checkBatteryStatus() {
    const battery = this.state.battery;
    const warnings = [];

    if (battery <= this.config.criticalBatteryLevel && !this.state.rthTriggered) {
      this.triggerRTH('critical_battery');
      warnings.push({ level: 'critical', message: 'Critical battery! RTH activated' });
    } else if (battery <= this.config.rthBatteryThreshold && !this.state.rthTriggered) {
      warnings.push({ level: 'warning', message: 'Low battery! RTH recommended' });
    } else if (battery <= this.config.lowBatteryWarning) {
      warnings.push({ level: 'info', message: 'Battery below 20%' });
    }

    if (warnings.length > 0 && JSON.stringify(warnings) !== JSON.stringify(this.state.warnings)) {
      this.state.warnings = warnings;
      this.emit('batteryWarning', { battery, warnings });
    }
  }

  // Complete mission
  completeMission() {
    clearInterval(this.simulationInterval);
    this.simulationInterval = null;
    
    this.state.missionState = MissionState.COMPLETED;
    this.state.missionProgress = 100;
    this.state.currentSpeed = 0;
    
    // Auto RTH after mission complete
    this.triggerRTH('mission_complete');
    
    this.emit('missionCompleted', this.getState());
  }

  // Complete RTH
  completeRTH() {
    clearInterval(this.simulationInterval);
    this.simulationInterval = null;
    
    this.state.droneState = DroneState.CHARGING;
    this.state.currentSpeed = 0;
    this.state.altitude = 0;
    this.state.position = [...this.state.homePosition];
    
    // Start charging simulation
    this.simulationInterval = setInterval(() => {
      this.update();
    }, this.config.updateInterval);
    
    this.emit('rthCompleted', this.getState());
  }

  // Start charging (when manually landed)
  startCharging() {
    this.state.droneState = DroneState.CHARGING;
    this.state.currentSpeed = 0;
    
    if (!this.simulationInterval) {
      this.simulationInterval = setInterval(() => {
        this.update();
      }, this.config.updateInterval);
    }
    
    this.emit('chargingStarted', this.getState());
  }

  // Utility: Calculate distance between two points
  calculateDistance(p1, p2) {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Utility: Calculate heading between two points
  calculateHeading(from, to) {
    const dx = to[1] - from[1];
    const dy = to[0] - from[0];
    return (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
  }

  // Get ETA in seconds
  getETA() {
    if (this.state.currentSpeed <= 0) return Infinity;
    
    const remainingWaypoints = this.flightPath.length - this.state.currentWaypointIndex;
    const avgDistancePerWaypoint = 10; // meters (approximate)
    const remainingDistance = remainingWaypoints * avgDistancePerWaypoint;
    
    return remainingDistance / this.state.currentSpeed;
  }

  // Get completed path for visualization
  getCompletedPath() {
    return [...this.completedPath];
  }

  // Get RTH path for visualization
  getRTHPath() {
    return [...this.rthPath];
  }

  // Cleanup
  destroy() {
    clearInterval(this.simulationInterval);
    this.listeners.clear();
    this.reset();
  }
}

export default FlightSimulationEngine;
