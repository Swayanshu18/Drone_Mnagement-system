/**
 * Mission Monitor Component
 * 
 * Real-time mission monitoring with flight simulation.
 * Features: Play, Pause, Stop, Resume controls with animated drone movement.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import './MissionMonitor.css';

// Custom drone icon
const droneIcon = new L.DivIcon({
  className: 'drone-marker',
  html: `<div class="drone-icon">🚁</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Component to update map view
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function MissionMonitor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [flightPath, setFlightPath] = useState([]);
  const [completedPath, setCompletedPath] = useState([]);
  const [telemetry, setTelemetry] = useState({
    battery: 100,
    altitude: 0,
    speed: 0,
    distance: 0
  });
  
  const simulationRef = useRef(null);
  const pathIndexRef = useRef(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 1x, 2x, 4x speed

  // Fetch mission data
  useEffect(() => {
    const fetchMission = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/missions/${id}`);
        setMission(response.data);
        
        // Generate flight path from survey area
        if (response.data.survey_area) {
          const path = generateFlightPath(response.data);
          setFlightPath(path);
          if (path.length > 0) {
            setCurrentPosition(path[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching mission:', err);
        setError('Failed to load mission');
      } finally {
        setLoading(false);
      }
    };

    fetchMission();
    
    return () => {
      // Cleanup simulation on unmount
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [id]);

  // Interpolate points between two coordinates for smooth animation
  const interpolatePoints = (start, end, numPoints = 10) => {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      points.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t
      ]);
    }
    return points;
  };

  // Generate flight path based on pattern
  const generateFlightPath = (missionData) => {
    const surveyArea = missionData.survey_area;
    if (!surveyArea || !surveyArea.coordinates) return [];
    
    const coords = surveyArea.coordinates[0];
    const pattern = missionData.flight_pattern || 'crosshatch';
    
    // Get bounding box
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const waypoints = [];
    const overlap = (missionData.overlap_percentage || 70) / 100;
    const spacing = 0.0003 * (1 - overlap + 0.3); // Adjust spacing based on overlap
    
    if (pattern === 'grid') {
      // GRID PATTERN: Horizontal lines only (lawn mower pattern)
      let direction = 1;
      let lastPoint = null;
      
      for (let lat = minLat; lat <= maxLat; lat += spacing) {
        const startPoint = [lat, direction === 1 ? minLng : maxLng];
        const endPoint = [lat, direction === 1 ? maxLng : minLng];
        
        // Add transition from last point if exists
        if (lastPoint) {
          waypoints.push(...interpolatePoints(lastPoint, startPoint, 5));
        }
        
        // Add the horizontal line
        waypoints.push(...interpolatePoints(startPoint, endPoint, 20));
        
        lastPoint = endPoint;
        direction *= -1;
      }
    } else if (pattern === 'crosshatch') {
      // CROSSHATCH PATTERN: Horizontal + Vertical lines (double coverage)
      let direction = 1;
      let lastPoint = null;
      
      // First pass: Horizontal lines
      for (let lat = minLat; lat <= maxLat; lat += spacing) {
        const startPoint = [lat, direction === 1 ? minLng : maxLng];
        const endPoint = [lat, direction === 1 ? maxLng : minLng];
        
        if (lastPoint) {
          waypoints.push(...interpolatePoints(lastPoint, startPoint, 5));
        }
        
        waypoints.push(...interpolatePoints(startPoint, endPoint, 20));
        lastPoint = endPoint;
        direction *= -1;
      }
      
      // Transition to vertical pass
      const verticalStart = [minLat, minLng];
      if (lastPoint) {
        waypoints.push(...interpolatePoints(lastPoint, verticalStart, 10));
      }
      
      // Second pass: Vertical lines
      direction = 1;
      lastPoint = verticalStart;
      
      for (let lng = minLng; lng <= maxLng; lng += spacing) {
        const startPoint = [direction === 1 ? minLat : maxLat, lng];
        const endPoint = [direction === 1 ? maxLat : minLat, lng];
        
        if (lastPoint) {
          waypoints.push(...interpolatePoints(lastPoint, startPoint, 5));
        }
        
        waypoints.push(...interpolatePoints(startPoint, endPoint, 20));
        lastPoint = endPoint;
        direction *= -1;
      }
    } else if (pattern === 'perimeter') {
      // PERIMETER PATTERN: Follow the polygon boundary multiple times
      const numLaps = 3; // Number of perimeter laps
      
      for (let lap = 0; lap < numLaps; lap++) {
        // Shrink the perimeter slightly for each lap (inward spiral effect)
        const shrinkFactor = 1 - (lap * 0.15);
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        
        const shrunkCoords = coords.map(coord => {
          const lat = centerLat + (coord[1] - centerLat) * shrinkFactor;
          const lng = centerLng + (coord[0] - centerLng) * shrinkFactor;
          return [lat, lng];
        });
        
        // Add interpolated points along the perimeter
        for (let i = 0; i < shrunkCoords.length; i++) {
          const current = shrunkCoords[i];
          const next = shrunkCoords[(i + 1) % shrunkCoords.length];
          waypoints.push(...interpolatePoints(current, next, 15));
        }
      }
    }
    
    return waypoints;
  };

  // Start simulation
  const startSimulation = useCallback(() => {
    if (flightPath.length === 0) return;
    
    setIsSimulating(true);
    setIsPaused(false);
    pathIndexRef.current = 0;
    setCompletedPath([]);
    setSimulationProgress(0);
    setTelemetry(prev => ({ ...prev, battery: 100, altitude: mission?.altitude || 50 }));
    
    const speed = mission?.speed || 10; // m/s
    const interval = 100 / simulationSpeed; // Adjust interval based on speed multiplier
    
    simulationRef.current = setInterval(() => {
      pathIndexRef.current += 1;
      
      if (pathIndexRef.current >= flightPath.length) {
        // Simulation complete
        clearInterval(simulationRef.current);
        setIsSimulating(false);
        setSimulationProgress(100);
        setTelemetry(prev => ({ ...prev, speed: 0 }));
        return;
      }
      
      const newPosition = flightPath[pathIndexRef.current];
      setCurrentPosition(newPosition);
      setCompletedPath(flightPath.slice(0, pathIndexRef.current + 1));
      
      // Update progress
      const progress = Math.round((pathIndexRef.current / flightPath.length) * 100);
      setSimulationProgress(progress);
      
      // Update telemetry
      setTelemetry(prev => ({
        battery: Math.max(0, 100 - (progress * 0.3)), // Battery drains
        altitude: mission?.altitude || 50,
        speed: (speed * simulationSpeed) + (Math.random() * 2 - 1), // Adjusted for sim speed
        distance: (pathIndexRef.current * 0.01).toFixed(2)
      }));
      
    }, interval);
  }, [flightPath, mission, simulationSpeed]);

  // Pause simulation
  const pauseSimulation = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setIsPaused(true);
    setTelemetry(prev => ({ ...prev, speed: 0 }));
  }, []);

  // Resume simulation
  const resumeSimulation = useCallback(() => {
    if (!isPaused || flightPath.length === 0) return;
    
    setIsPaused(false);
    const speed = mission?.speed || 10;
    const interval = 100 / simulationSpeed;
    
    simulationRef.current = setInterval(() => {
      pathIndexRef.current += 1;
      
      if (pathIndexRef.current >= flightPath.length) {
        clearInterval(simulationRef.current);
        setIsSimulating(false);
        setSimulationProgress(100);
        setTelemetry(prev => ({ ...prev, speed: 0 }));
        return;
      }
      
      const newPosition = flightPath[pathIndexRef.current];
      setCurrentPosition(newPosition);
      setCompletedPath(flightPath.slice(0, pathIndexRef.current + 1));
      
      const progress = Math.round((pathIndexRef.current / flightPath.length) * 100);
      setSimulationProgress(progress);
      
      setTelemetry(prev => ({
        battery: Math.max(0, 100 - (progress * 0.3)),
        altitude: mission?.altitude || 50,
        speed: (speed * simulationSpeed) + (Math.random() * 2 - 1),
        distance: (pathIndexRef.current * 0.01).toFixed(2)
      }));
      
    }, interval);
  }, [isPaused, flightPath, mission, simulationSpeed]);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setIsSimulating(false);
    setIsPaused(false);
    pathIndexRef.current = 0;
    setSimulationProgress(0);
    setCompletedPath([]);
    if (flightPath.length > 0) {
      setCurrentPosition(flightPath[0]);
    }
    setTelemetry({ battery: 100, altitude: 0, speed: 0, distance: 0 });
  }, [flightPath]);

  // Calculate map center
  const getMapCenter = () => {
    if (currentPosition) return currentPosition;
    if (mission?.survey_area?.coordinates?.[0]?.[0]) {
      const coord = mission.survey_area.coordinates[0][0];
      return [coord[1], coord[0]];
    }
    return [37.7749, -122.4194]; // Default SF
  };

  // Get survey area coordinates for polygon
  const getSurveyAreaCoords = () => {
    if (!mission?.survey_area?.coordinates?.[0]) return [];
    return mission.survey_area.coordinates[0].map(coord => [coord[1], coord[0]]);
  };

  // Format time remaining
  const getTimeRemaining = () => {
    if (!isSimulating || simulationProgress >= 100) return '00:00';
    const remaining = flightPath.length - pathIndexRef.current;
    const seconds = Math.round(remaining * 0.1);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="mission-monitor">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading mission data...</p>
        </div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="mission-monitor">
        <div className="error-container">
          <h2>⚠️ {error || 'Mission not found'}</h2>
          <button className="btn btn-primary" onClick={() => navigate('/missions')}>
            Back to Missions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mission-monitor">
      <div className="page-header">
        <div className="header-info">
          <h1>{mission.name}</h1>
          <div className="header-badges">
            <span className={`badge badge-${mission.status === 'completed' ? 'success' : mission.status === 'in_progress' ? 'info' : 'warning'}`}>
              {mission.status?.replace('_', ' ')}
            </span>
            {isSimulating && (
              <span className="badge badge-simulation">
                🎬 Simulation {isPaused ? 'Paused' : 'Running'}
              </span>
            )}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/missions')}>
          ← Back
        </button>
      </div>

      <div className="monitor-layout">
        <div className="monitor-map">
          <MapContainer
            center={getMapCenter()}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={currentPosition} />
            
            {/* Survey Area Polygon */}
            {getSurveyAreaCoords().length > 0 && (
              <Polygon
                positions={getSurveyAreaCoords()}
                pathOptions={{
                  color: '#3498db',
                  fillColor: '#3498db',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              />
            )}
            
            {/* Planned Flight Path */}
            {flightPath.length > 0 && (
              <Polyline
                positions={flightPath}
                pathOptions={{
                  color: '#95a5a6',
                  weight: 1,
                  dashArray: '5, 5',
                  opacity: 0.5
                }}
              />
            )}
            
            {/* Completed Flight Path */}
            {completedPath.length > 0 && (
              <Polyline
                positions={completedPath}
                pathOptions={{
                  color: '#2ecc71',
                  weight: 3,
                  opacity: 0.8
                }}
              />
            )}
            
            {/* Drone Marker */}
            {currentPosition && (
              <Marker position={currentPosition} icon={droneIcon} />
            )}
          </MapContainer>
          
          {/* Map Legend */}
          <div className="map-legend">
            <div className="legend-title">
              Pattern: <strong>{mission.flight_pattern || 'grid'}</strong>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#3498db' }}></span>
              Survey Area
            </div>
            <div className="legend-item">
              <span className="legend-color dashed" style={{ background: '#95a5a6' }}></span>
              Planned Path
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#2ecc71' }}></span>
              Completed Path
            </div>
            <div className="legend-item">
              <span className="legend-icon">🚁</span>
              Drone Position
            </div>
          </div>
          
          {/* Pattern Description */}
          <div className="pattern-info">
            {mission.flight_pattern === 'grid' && (
              <span>📐 Grid: Horizontal lawn-mower pattern</span>
            )}
            {mission.flight_pattern === 'crosshatch' && (
              <span>✖️ Crosshatch: Horizontal + Vertical coverage</span>
            )}
            {mission.flight_pattern === 'perimeter' && (
              <span>🔲 Perimeter: Boundary spiral pattern</span>
            )}
          </div>
        </div>

        <div className="monitor-sidebar">
          {/* Simulation Controls */}
          <div className="card simulation-card">
            <div className="card-header">
              <h3>🎬 Flight Simulation</h3>
            </div>
            <div className="card-body">
              <div className="simulation-controls">
                {!isSimulating ? (
                  <button 
                    className="btn btn-success btn-lg simulation-btn"
                    onClick={startSimulation}
                    disabled={flightPath.length === 0}
                  >
                    ▶️ Start Simulation
                  </button>
                ) : (
                  <div className="control-row">
                    {isPaused ? (
                      <button className="btn btn-success" onClick={resumeSimulation}>
                        ▶️ Resume
                      </button>
                    ) : (
                      <button className="btn btn-warning" onClick={pauseSimulation}>
                        ⏸️ Pause
                      </button>
                    )}
                    <button className="btn btn-danger" onClick={stopSimulation}>
                      ⏹️ Stop
                    </button>
                  </div>
                )}
                
                {/* Speed Control */}
                <div className="speed-control">
                  <label>Speed: {simulationSpeed}x</label>
                  <div className="speed-buttons">
                    <button 
                      className={`speed-btn ${simulationSpeed === 1 ? 'active' : ''}`}
                      onClick={() => setSimulationSpeed(1)}
                    >
                      1x
                    </button>
                    <button 
                      className={`speed-btn ${simulationSpeed === 2 ? 'active' : ''}`}
                      onClick={() => setSimulationSpeed(2)}
                    >
                      2x
                    </button>
                    <button 
                      className={`speed-btn ${simulationSpeed === 4 ? 'active' : ''}`}
                      onClick={() => setSimulationSpeed(4)}
                    >
                      4x
                    </button>
                  </div>
                </div>
              </div>
              {flightPath.length === 0 && (
                <p className="text-muted text-sm">No survey area defined for this mission</p>
              )}
              {flightPath.length > 0 && (
                <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>
                  📍 {flightPath.length} waypoints generated
                </p>
              )}
            </div>
          </div>

          {/* Progress Card */}
          <div className="card">
            <div className="card-header">
              <h3>Mission Progress</h3>
            </div>
            <div className="card-body">
              <div className="progress-display">
                <div 
                  className="progress-circle" 
                  style={{ '--progress': simulationProgress }}
                >
                  <span className="progress-value">{simulationProgress}%</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${simulationProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted">
                  Est. remaining: {getTimeRemaining()}
                </p>
              </div>
            </div>
          </div>

          {/* Telemetry Card */}
          <div className="card">
            <div className="card-header">
              <h3>📡 Live Telemetry</h3>
            </div>
            <div className="card-body">
              <div className="telemetry-grid">
                <div className="telemetry-item">
                  <span className="telemetry-icon">🔋</span>
                  <span className="telemetry-label">Battery</span>
                  <span className={`telemetry-value ${telemetry.battery < 20 ? 'warning' : ''}`}>
                    {telemetry.battery.toFixed(0)}%
                  </span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-icon">📏</span>
                  <span className="telemetry-label">Altitude</span>
                  <span className="telemetry-value">{telemetry.altitude}m</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-icon">💨</span>
                  <span className="telemetry-label">Speed</span>
                  <span className="telemetry-value">{telemetry.speed.toFixed(1)} m/s</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-icon">📍</span>
                  <span className="telemetry-label">Distance</span>
                  <span className="telemetry-value">{telemetry.distance} km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Details Card */}
          <div className="card">
            <div className="card-header">
              <h3>Mission Details</h3>
            </div>
            <div className="card-body">
              <div className="details-list">
                <div className="detail-item">
                  <span className="detail-label">Pattern</span>
                  <span className="detail-value">{mission.flight_pattern || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Altitude</span>
                  <span className="detail-value">{mission.altitude || 50}m</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Speed</span>
                  <span className="detail-value">{mission.speed || 10} m/s</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Overlap</span>
                  <span className="detail-value">{mission.overlap_percentage || 70}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Sensors</span>
                  <span className="detail-value">
                    {Array.isArray(mission.sensors) ? mission.sensors.join(', ') : 'RGB'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Drone Info Card */}
          {mission.drone_name && (
            <div className="card">
              <div className="card-header">
                <h3>🚁 Assigned Drone</h3>
              </div>
              <div className="card-body">
                <div className="drone-info">
                  <span className="drone-name">{mission.drone_name}</span>
                  <span className="drone-model">{mission.drone_model || 'Standard Drone'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MissionMonitor;
