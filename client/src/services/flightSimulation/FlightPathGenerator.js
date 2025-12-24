/**
 * Flight Path Generator
 * 
 * Generates flight paths for different mission types.
 * Supports: Grid, Crosshatch, Perimeter, Waypoint Navigation, Hatch Pattern
 */

// Mission types
export const MissionType = {
  GRID: 'grid',
  CROSSHATCH: 'crosshatch',
  PERIMETER: 'perimeter',
  WAYPOINT: 'waypoint',
  HATCH: 'hatch'
};

// Default parameters
const DEFAULT_PARAMS = {
  overlap: 0.7,
  altitude: 50,
  turningRadius: 5,
  pathSpacing: 0.0003 // degrees (~30m)
};

class FlightPathGenerator {
  constructor(params = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  /**
   * Generate flight path based on mission type
   * @param {Object} surveyArea - GeoJSON polygon
   * @param {string} missionType - Type of mission
   * @param {Object} options - Additional options
   * @returns {Array} Array of [lat, lng] waypoints
   */
  generate(surveyArea, missionType, options = {}) {
    if (!surveyArea || !surveyArea.coordinates || !surveyArea.coordinates[0]) {
      return [];
    }

    const coords = surveyArea.coordinates[0];
    
    // Validate coordinates - must have at least 3 points and valid numbers
    if (coords.length < 3) {
      return [];
    }
    
    // Check for valid coordinate values
    for (const coord of coords) {
      if (!Array.isArray(coord) || coord.length < 2 || 
          !isFinite(coord[0]) || !isFinite(coord[1])) {
        return [];
      }
    }

    const params = { ...this.params, ...options };
    const bounds = this.calculateBounds(coords);
    
    // Validate bounds
    if (!isFinite(bounds.minLat) || !isFinite(bounds.maxLat) ||
        !isFinite(bounds.minLng) || !isFinite(bounds.maxLng)) {
      return [];
    }

    switch (missionType) {
      case MissionType.GRID:
        return this.generateGridPath(bounds, coords, params);
      case MissionType.CROSSHATCH:
        return this.generateCrosshatchPath(bounds, coords, params);
      case MissionType.PERIMETER:
        return this.generatePerimeterPath(bounds, coords, params);
      case MissionType.WAYPOINT:
        return this.generateWaypointPath(coords, params);
      case MissionType.HATCH:
        return this.generateHatchPath(bounds, coords, params);
      default:
        return this.generateGridPath(bounds, coords, params);
    }
  }

  /**
   * Calculate bounding box from coordinates
   */
  calculateBounds(coords) {
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
      centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2
    };
  }

  /**
   * Interpolate points between two coordinates with smooth curves
   */
  interpolatePoints(start, end, numPoints = 10, smooth = false) {
    // Validate inputs
    if (!start || !end || !Array.isArray(start) || !Array.isArray(end) ||
        !isFinite(start[0]) || !isFinite(start[1]) ||
        !isFinite(end[0]) || !isFinite(end[1])) {
      return [];
    }
    
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // Apply easing for smoother movement
      const easedT = smooth ? this.easeInOutQuad(t) : t;
      const lat = start[0] + (end[0] - start[0]) * easedT;
      const lng = start[1] + (end[1] - start[1]) * easedT;
      
      // Only add valid points
      if (isFinite(lat) && isFinite(lng)) {
        points.push([lat, lng]);
      }
    }
    return points;
  }

  /**
   * Easing function for smooth acceleration/deceleration
   */
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /**
   * Generate smooth turn between two line segments
   */
  generateSmoothTurn(p1, corner, p2, radius = 5) {
    const points = [];
    const numPoints = 8;
    
    // Calculate control points for bezier curve
    const d1 = this.distance(p1, corner);
    const d2 = this.distance(corner, p2);
    const offset = Math.min(radius * 0.00001, d1 * 0.3, d2 * 0.3);
    
    const cp1 = [
      corner[0] + (p1[0] - corner[0]) * offset / d1,
      corner[1] + (p1[1] - corner[1]) * offset / d1
    ];
    const cp2 = [
      corner[0] + (p2[0] - corner[0]) * offset / d2,
      corner[1] + (p2[1] - corner[1]) * offset / d2
    ];
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // Quadratic bezier
      const x = (1 - t) * (1 - t) * cp1[0] + 2 * (1 - t) * t * corner[0] + t * t * cp2[0];
      const y = (1 - t) * (1 - t) * cp1[1] + 2 * (1 - t) * t * corner[1] + t * t * cp2[1];
      points.push([x, y]);
    }
    
    return points;
  }

  /**
   * Calculate distance between two points
   */
  distance(p1, p2) {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }


  /**
   * GRID PATTERN: Horizontal lawn-mower pattern
   * Efficient for large rectangular areas
   */
  generateGridPath(bounds, coords, params) {
    const waypoints = [];
    const spacing = params.pathSpacing * (1 - params.overlap + 0.3);
    let direction = 1;
    let lastPoint = null;

    for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += spacing) {
      const startPoint = [lat, direction === 1 ? bounds.minLng : bounds.maxLng];
      const endPoint = [lat, direction === 1 ? bounds.maxLng : bounds.minLng];

      if (lastPoint) {
        // Add smooth turn
        waypoints.push(...this.generateSmoothTurn(
          lastPoint, 
          [lat, lastPoint[1]], 
          startPoint,
          params.turningRadius
        ));
      }

      // Add line segment with interpolation
      waypoints.push(...this.interpolatePoints(startPoint, endPoint, 20));
      lastPoint = endPoint;
      direction *= -1;
    }

    return waypoints;
  }

  /**
   * CROSSHATCH PATTERN: Horizontal + Vertical passes
   * Double coverage for detailed surveys
   */
  generateCrosshatchPath(bounds, coords, params) {
    const waypoints = [];
    const spacing = params.pathSpacing * (1 - params.overlap + 0.3);
    let direction = 1;
    let lastPoint = null;

    // Horizontal pass
    for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += spacing) {
      const startPoint = [lat, direction === 1 ? bounds.minLng : bounds.maxLng];
      const endPoint = [lat, direction === 1 ? bounds.maxLng : bounds.minLng];

      if (lastPoint) {
        waypoints.push(...this.generateSmoothTurn(
          lastPoint,
          [lat, lastPoint[1]],
          startPoint,
          params.turningRadius
        ));
      }

      waypoints.push(...this.interpolatePoints(startPoint, endPoint, 20));
      lastPoint = endPoint;
      direction *= -1;
    }

    // Transition to vertical pass
    const verticalStart = [bounds.minLat, bounds.minLng];
    if (lastPoint) {
      waypoints.push(...this.interpolatePoints(lastPoint, verticalStart, 15, true));
    }

    // Vertical pass
    direction = 1;
    lastPoint = verticalStart;

    for (let lng = bounds.minLng; lng <= bounds.maxLng; lng += spacing) {
      const startPoint = [direction === 1 ? bounds.minLat : bounds.maxLat, lng];
      const endPoint = [direction === 1 ? bounds.maxLat : bounds.minLat, lng];

      if (lastPoint) {
        waypoints.push(...this.generateSmoothTurn(
          lastPoint,
          [lastPoint[0], lng],
          startPoint,
          params.turningRadius
        ));
      }

      waypoints.push(...this.interpolatePoints(startPoint, endPoint, 20));
      lastPoint = endPoint;
      direction *= -1;
    }

    return waypoints;
  }

  /**
   * PERIMETER PATTERN: Spiral inward from boundary
   * Good for edge-focused surveys and boundary mapping
   */
  generatePerimeterPath(bounds, coords, params) {
    const waypoints = [];
    const numLaps = params.numLaps || 4;
    let lastPoint = null;

    for (let lap = 0; lap < numLaps; lap++) {
      const shrinkFactor = 1 - (lap * 0.2);
      
      const shrunkCoords = coords.map(coord => {
        const lat = bounds.centerLat + (coord[1] - bounds.centerLat) * shrinkFactor;
        const lng = bounds.centerLng + (coord[0] - bounds.centerLng) * shrinkFactor;
        return [lat, lng];
      });

      for (let i = 0; i < shrunkCoords.length; i++) {
        const current = shrunkCoords[i];
        const next = shrunkCoords[(i + 1) % shrunkCoords.length];
        
        if (lastPoint && i === 0) {
          // Smooth transition between laps
          waypoints.push(...this.interpolatePoints(lastPoint, current, 10, true));
        }
        
        waypoints.push(...this.interpolatePoints(current, next, 15));
        lastPoint = next;
      }
    }

    return waypoints;
  }

  /**
   * WAYPOINT NAVIGATION: Direct point-to-point flight
   * For custom survey paths
   */
  generateWaypointPath(coords, params) {
    const waypoints = [];
    
    for (let i = 0; i < coords.length; i++) {
      const current = [coords[i][1], coords[i][0]]; // Convert from [lng, lat] to [lat, lng]
      const next = coords[(i + 1) % coords.length];
      const nextPoint = [next[1], next[0]];
      
      if (i < coords.length - 1) {
        waypoints.push(...this.interpolatePoints(current, nextPoint, 15, true));
      } else {
        waypoints.push(current);
      }
    }

    return waypoints;
  }

  /**
   * HATCH PATTERN: Diagonal lines at 45 degrees
   * Alternative coverage pattern for specific terrain
   */
  generateHatchPath(bounds, coords, params) {
    const waypoints = [];
    const spacing = params.pathSpacing * (1 - params.overlap + 0.3);
    const width = bounds.maxLng - bounds.minLng;
    const height = bounds.maxLat - bounds.minLat;
    const diagonal = Math.sqrt(width * width + height * height);
    
    let direction = 1;
    let lastPoint = null;
    
    // Generate diagonal lines from bottom-left to top-right
    const numLines = Math.ceil(diagonal / spacing) * 2;
    
    for (let i = 0; i < numLines; i++) {
      const offset = (i - numLines / 2) * spacing;
      
      // Calculate intersection points with bounding box
      const intersections = this.getDiagonalIntersections(bounds, offset, 45);
      
      if (intersections.length >= 2) {
        const [start, end] = direction === 1 ? intersections : intersections.reverse();
        
        if (lastPoint) {
          waypoints.push(...this.generateSmoothTurn(
            lastPoint,
            [(lastPoint[0] + start[0]) / 2, (lastPoint[1] + start[1]) / 2],
            start,
            params.turningRadius
          ));
        }
        
        waypoints.push(...this.interpolatePoints(start, end, 20));
        lastPoint = end;
        direction *= -1;
      }
    }

    return waypoints;
  }

  /**
   * Calculate diagonal line intersections with bounding box
   */
  getDiagonalIntersections(bounds, offset, angle) {
    const intersections = [];
    const rad = angle * Math.PI / 180;
    const tan = Math.tan(rad);
    
    // Line equation: y - centerY = tan(angle) * (x - centerX) + offset
    const centerX = bounds.centerLng;
    const centerY = bounds.centerLat;
    
    // Check intersection with each edge
    // Bottom edge (y = minLat)
    const xBottom = centerX + (bounds.minLat - centerY - offset) / tan;
    if (xBottom >= bounds.minLng && xBottom <= bounds.maxLng) {
      intersections.push([bounds.minLat, xBottom]);
    }
    
    // Top edge (y = maxLat)
    const xTop = centerX + (bounds.maxLat - centerY - offset) / tan;
    if (xTop >= bounds.minLng && xTop <= bounds.maxLng) {
      intersections.push([bounds.maxLat, xTop]);
    }
    
    // Left edge (x = minLng)
    const yLeft = centerY + tan * (bounds.minLng - centerX) + offset;
    if (yLeft >= bounds.minLat && yLeft <= bounds.maxLat) {
      intersections.push([yLeft, bounds.minLng]);
    }
    
    // Right edge (x = maxLng)
    const yRight = centerY + tan * (bounds.maxLng - centerX) + offset;
    if (yRight >= bounds.minLat && yRight <= bounds.maxLat) {
      intersections.push([yRight, bounds.maxLng]);
    }
    
    // Sort by latitude for consistent ordering
    return intersections.sort((a, b) => a[0] - b[0]).slice(0, 2);
  }

  /**
   * Get mission type description
   */
  static getDescription(missionType) {
    const descriptions = {
      [MissionType.GRID]: 'Horizontal lawn-mower pattern for efficient area coverage',
      [MissionType.CROSSHATCH]: 'Horizontal + vertical passes for double coverage and detail',
      [MissionType.PERIMETER]: 'Spiral inward from boundary for edge-focused surveys',
      [MissionType.WAYPOINT]: 'Direct point-to-point navigation for custom paths',
      [MissionType.HATCH]: 'Diagonal pattern at 45° for alternative terrain coverage'
    };
    return descriptions[missionType] || 'Unknown mission type';
  }

  /**
   * Get mission type icon
   */
  static getIcon(missionType) {
    const icons = {
      [MissionType.GRID]: '📐',
      [MissionType.CROSSHATCH]: '✖️',
      [MissionType.PERIMETER]: '🔲',
      [MissionType.WAYPOINT]: '📍',
      [MissionType.HATCH]: '⬔'
    };
    return icons[missionType] || '🚁';
  }
}

export default FlightPathGenerator;
