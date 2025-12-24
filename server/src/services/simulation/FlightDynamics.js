/**
 * Flight Dynamics Engine
 * 
 * Simulates realistic drone physics and battery consumption.
 */

class FlightDynamics {
    constructor(initialState = {}) {
        this.position = initialState.position || { lat: 0, lng: 0 };
        this.altitude = initialState.altitude || 0;
        this.speed = 0;
        this.maxSpeed = 15; // m/s
        this.heading = 0;
        this.battery = initialState.battery || 100;
        this.state = 'IDLE'; // IDLE, TAKEOFF, FLYING, HOVERING, LANDING, CHARGING
    }

    /**
     * Update state based on time delta
     * @param {number} dt - Time delta in seconds
     * @param {Object} target - Target position/state
     */
    update(dt, target) {
        if (this.state === 'CHARGING') {
            this._updateCharging(dt);
            return;
        }

        if (this.state === 'FLYING' || this.state === 'RTH') {
            this._updateMovement(dt, target);
        }

        this._updateBattery(dt);
    }

    _updateMovement(dt, target) {
        if (!target) return;

        // Calculate distance and bearing to target
        const R = 6371e3; // Earth radius in meters
        const dLat = (target.lat - this.position.lat) * Math.PI / 180;
        const dLon = (target.lng - this.position.lng) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.position.lat * Math.PI / 180) * Math.cos(target.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Simple P-controller for speed
        const desiredSpeed = Math.min(this.maxSpeed, distance); // Slow down as we get closer
        const acceleration = 2.0; // m/s^2

        if (this.speed < desiredSpeed) {
            this.speed = Math.min(this.speed + acceleration * dt, desiredSpeed);
        } else {
            this.speed = Math.max(this.speed - acceleration * dt, desiredSpeed);
        }

        // Update position
        if (distance > 0.5) { // If not at target
            const bearing = Math.atan2(
                Math.sin(dLon) * Math.cos(target.lat * Math.PI / 180),
                Math.cos(this.position.lat * Math.PI / 180) * Math.sin(target.lat * Math.PI / 180) -
                Math.sin(this.position.lat * Math.PI / 180) * Math.cos(target.lat * Math.PI / 180) * Math.cos(dLon)
            );

            this.heading = (bearing * 180 / Math.PI + 360) % 360;

            const distMoved = this.speed * dt;
            const angularDist = distMoved / R;

            const lat1 = this.position.lat * Math.PI / 180;
            const lon1 = this.position.lng * Math.PI / 180;

            const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDist) +
                Math.cos(lat1) * Math.sin(angularDist) * Math.cos(bearing));
            const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(angularDist) * Math.cos(lat1),
                Math.cos(angularDist) - Math.sin(lat1) * Math.sin(lat2));

            this.position = {
                lat: lat2 * 180 / Math.PI,
                lng: lon2 * 180 / Math.PI
            };
        }
    }

    _updateBattery(dt) {
        // Base drain + Speed factor + Climb factor
        let drainRate = 0.05; // Base drain per second (%/s)

        if (this.state === 'FLYING') {
            drainRate += (this.speed / this.maxSpeed) * 0.1; // Up to 0.15%/s at max speed
        } else if (this.state === 'HOVERING') {
            drainRate = 0.08;
        }

        this.battery = Math.max(0, this.battery - drainRate * dt);
    }

    _updateCharging(dt) {
        const charingRate = 2.0; // 2% per second
        this.battery = Math.min(100, this.battery + charingRate * dt);
        if (this.battery >= 100) {
            this.state = 'IDLE';
        }
    }

    setTargetSpeed(speed) {
        this.maxSpeed = Math.max(1, Math.min(20, speed));
    }
}

module.exports = FlightDynamics;
