/**
 * Alert Service
 * 
 * Monitors drone status and generates alerts.
 * Specifically checks for low battery conditions.
 */

const alertService = {
    /**
     * Check battery level and generate alert if critical
     * @param {Object} drone - Drone object with battery_level
     * @returns {Object|null} Alert object if threshold breached, null otherwise
     */
    checkBatteryLevels(drone) {
        const LOW_BATTERY_THRESHOLD = 20;

        if (drone.battery_level !== undefined && drone.battery_level < LOW_BATTERY_THRESHOLD) {
            return {
                type: 'LOW_BATTERY',
                level: 'WARNING',
                message: `Drone ${drone.name} (${drone.serial_number}) battery low: ${drone.battery_level}%`,
                drone_id: drone.id,
                timestamp: new Date()
            };
        }
        return null;
    }
};

module.exports = alertService;
