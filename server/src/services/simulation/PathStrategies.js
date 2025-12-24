/**
 * Path Generation Strategies
 * 
 * Generates waypoints based on mission type and survey area.
 */

const turf = require('@turf/turf');

const PathStrategies = {
    generate(type, surveyArea, options = {}) {
        if (!surveyArea || !surveyArea.coordinates) {
            console.error('❌ Invalid survey area:', surveyArea);
            return [];
        }

        console.log(`🗺️ Generating ${type} pattern for area with ${surveyArea.coordinates[0]?.length || 0} points`);

        switch (type.toLowerCase()) {
            case 'grid':
                return this._generateGridPath(surveyArea, options);
            case 'crosshatch':
                return this._generateCrosshatchPath(surveyArea, options);
            case 'perimeter':
                return this._generatePerimeterPath(surveyArea, options);
            case 'hatch': // Diagonal grid
                return this._generateHatchPath(surveyArea, options);
            case 'waypoint':
                // Just return the polygon vertices as waypoints
                const coords = surveyArea.coordinates[0];
                return coords.map(c => ({ lat: c[1], lng: c[0] }));
            default:
                console.warn(`⚠️ Unknown pattern type: ${type}, falling back to grid`);
                return this._generateGridPath(surveyArea, options);
        }
    },

    _generateGridPath(surveyArea, { spacing = 0.0005 } = {}) {
        try {
            // Create a bounding box
            const bbox = turf.bbox(surveyArea); // [minX, minY, maxX, maxY]
            const waypoints = [];

            let x = bbox[0];
            let movingUp = true;

            while (x <= bbox[2]) {
                const yStart = movingUp ? bbox[1] : bbox[3];
                const yEnd = movingUp ? bbox[3] : bbox[1];

                // Add vertical line segment points
                waypoints.push({ lat: yStart, lng: x });
                waypoints.push({ lat: yEnd, lng: x });

                x += spacing;
                movingUp = !movingUp;
            }

            console.log(`✅ Generated grid path with ${waypoints.length} waypoints`);
            return waypoints;
        } catch (error) {
            console.error('❌ Error generating grid path:', error);
            return [];
        }
    },

    _generateCrosshatchPath(surveyArea, { spacing = 0.0005 } = {}) {
        try {
            // Crosshatch = horizontal passes + vertical passes
            const bbox = turf.bbox(surveyArea);
            const waypoints = [];

            // First: Horizontal passes (left to right, alternating)
            let y = bbox[1];
            let movingRight = true;

            while (y <= bbox[3]) {
                const xStart = movingRight ? bbox[0] : bbox[2];
                const xEnd = movingRight ? bbox[2] : bbox[0];

                waypoints.push({ lat: y, lng: xStart });
                waypoints.push({ lat: y, lng: xEnd });

                y += spacing;
                movingRight = !movingRight;
            }

            // Second: Vertical passes (bottom to top, alternating)
            let x = bbox[0];
            let movingUp = true;

            while (x <= bbox[2]) {
                const yStart = movingUp ? bbox[1] : bbox[3];
                const yEnd = movingUp ? bbox[3] : bbox[1];

                waypoints.push({ lat: yStart, lng: x });
                waypoints.push({ lat: yEnd, lng: x });

                x += spacing;
                movingUp = !movingUp;
            }

            console.log(`✅ Generated crosshatch path with ${waypoints.length} waypoints`);
            return waypoints;
        } catch (error) {
            console.error('❌ Error generating crosshatch path:', error);
            return [];
        }
    },

    _generatePerimeterPath(surveyArea, options = {}) {
        try {
            // Return the boundary itself
            if (surveyArea.type === 'Polygon') {
                const waypoints = surveyArea.coordinates[0].map(c => ({ lat: c[1], lng: c[0] }));
                console.log(`✅ Generated perimeter path with ${waypoints.length} waypoints`);
                return waypoints;
            }
            console.warn('⚠️ Survey area is not a Polygon');
            return [];
        } catch (error) {
            console.error('❌ Error generating perimeter path:', error);
            return [];
        }
    },

    _generateHatchPath(surveyArea, { spacing = 0.0003 } = {}) {
        try {
            // Diagonal pattern at 45 degrees
            // For simplicity, use a denser grid pattern
            // In production, you'd rotate the coordinate system
            const waypoints = this._generateGridPath(surveyArea, { spacing });
            console.log(`✅ Generated hatch path with ${waypoints.length} waypoints`);
            return waypoints;
        } catch (error) {
            console.error('❌ Error generating hatch path:', error);
            return [];
        }
    }
};

module.exports = PathStrategies;
