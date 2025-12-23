/**
 * Flight Pattern Service
 * 
 * Generates waypoints based on survey area and flight parameters.
 */

const flightPatternService = {
    /**
     * Generate waypoints for a mission
     * @param {Object} surveyArea - GeoJSON Polygon
     * @param {string} pattern - 'crosshatch' or 'perimeter'
     * @param {number} altitude - Flight altitude in meters
     * @param {number} overlap - Overlap percentage (0-100)
     * @returns {Array} List of waypoint objects
     */
    generateWaypoints(surveyArea, pattern, altitude, overlap) {
        if (!surveyArea || !surveyArea.coordinates || surveyArea.coordinates.length === 0) {
            return [];
        }

        const polygon = surveyArea.coordinates[0]; // Outer ring

        // Calculate bounding box
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        polygon.forEach(([lng, lat]) => {
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        });

        const waypoints = [];
        const step = 0.0001; // Simplified step size (~10m) - in real app would depend on altitude/overlap

        if (pattern === 'perimeter') {
            // Just fly around the boundary
            // GeoJSON is [lng, lat], we need {latitude, longitude}
            polygon.forEach(coord => {
                waypoints.push({
                    latitude: coord[1],
                    longitude: coord[0],
                    altitude,
                    action: 'flythrough'
                });
            });
            // Ensure specific closure if not already closed by polygon definition
            // (GeoJSON usually closes it)
        } else if (pattern === 'crosshatch' || pattern === 'grid') {
            // Simple grid generation
            let goingEast = true;
            for (let lat = minLat; lat <= maxLat; lat += step) {
                if (goingEast) {
                    waypoints.push({ latitude: lat, longitude: minLng, altitude, action: 'flythrough' });
                    waypoints.push({ latitude: lat, longitude: maxLng, altitude, action: 'flythrough' });
                } else {
                    waypoints.push({ latitude: lat, longitude: maxLng, altitude, action: 'flythrough' });
                    waypoints.push({ latitude: lat, longitude: minLng, altitude, action: 'flythrough' });
                }
                goingEast = !goingEast;
            }
        }

        return waypoints;
    }
};

module.exports = flightPatternService;
