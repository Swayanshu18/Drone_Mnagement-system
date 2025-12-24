/**
 * Mission Monitor Component
 * 
 * Real-time mission monitoring with intelligent flight simulation.
 * Features:
 * - Mission-based flight path generation (Grid, Crosshatch, Perimeter, Hatch, Waypoint)
 * - Realistic drone physics (acceleration, deceleration, turning)
 * - Battery simulation with charging logic
 * - Speed control with ETA updates
 * - Return-to-Home (RTH) functionality
 * - Real-time telemetry display
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import useFlightSimulation, { SpeedPresets } from '../../hooks/useFlightSimulation';
import { MissionType } from '../../services/flightSimulation';
import './MissionMonitor.css';

// Custom drone icon with rotation support and animation
const createDroneIcon = (heading = 0, isFlying = false) => new L.DivIcon({
  className: 'drone-marker',
  html: `<div class="drone-icon ${isFlying ? 'flying' : ''}" style="transform: rotate(${heading}deg)">
    <div class="drone-body">🚁</div>
    ${isFlying ? '<div class="propeller-effect"></div>' : ''}
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Home base icon
const homeIcon = new L.DivIcon({
  className: 'home-marker',
  html: `<div class="home-icon">🏠</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Component to update map view
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

function MissionMonitor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use the flight simulation hook
  const simulation = useFlightSimulation(mission);

  // Debug logging
  useEffect(() => {
    console.log('Mission data:', mission);
    console.log('Simulation state:', {
      isInitialized: simulation.isInitialized,
      canFly: simulation.canFly,
      flightPathLength: simulation.flightPath?.length,
      battery: simulation.battery,
      droneState: simulation.droneState,
      missionState: simulation.missionState
    });
  }, [mission, simulation.isInitialized, simulation.canFly, simulation.flightPath]);

  // Fetch mission data
  useEffect(() => {
    const fetchMission = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/missions/${id}`);
        const missionData = response.data;
        
        // Merge parameters into mission object for simulation
        if (missionData.parameters) {
          missionData.altitude = missionData.parameters.altitude || 50;
          missionData.overlap_percentage = missionData.parameters.overlap_percentage || 70;
        }
        
        setMission(missionData);
      } catch (err) {
        console.error('Error fetching mission:', err);
        // Fallback to demo mission for testing
        const demoMission = {
          id: id,
          name: 'Demo Mission - SF Area',
          status: 'planned',
          flight_pattern: 'grid',
          altitude: 50,
          overlap_percentage: 70,
          survey_area: {
            type: 'Polygon',
            coordinates: [[
              [-122.4200, 37.7740],
              [-122.4180, 37.7740],
              [-122.4180, 37.7760],
              [-122.4200, 37.7760],
              [-122.4200, 37.7740]
            ]]
          }
        };
        setMission(demoMission);
        console.log('Using demo mission data');
      } finally {
        setLoading(false);
      }
    };

    fetchMission();
  }, [id]);

  // Handle mission type change
  const handleMissionTypeChange = useCallback((type) => {
    if (simulation.missionState === simulation.MissionState.IN_PROGRESS) {
      return; // Can't change during flight
    }
    simulation.setMissionType(type);
  }, [simulation]);

  // Handle speed change
  const handleSpeedChange = useCallback((speed) => {
    simulation.setSpeed(speed);
  }, [simulation]);

  // Get map center
  const getMapCenter = useCallback(() => {
    if (simulation.position) return simulation.position;
    if (mission?.survey_area?.coordinates?.[0]?.[0]) {
      const coord = mission.survey_area.coordinates[0][0];
      return [coord[1], coord[0]];
    }
    return [37.7749, -122.4194];
  }, [simulation.position, mission]);

  // Get survey area coordinates for polygon
  const getSurveyAreaCoords = useCallback(() => {
    if (!mission?.survey_area?.coordinates?.[0]) return [];
    return mission.survey_area.coordinates[0].map(coord => [coord[1], coord[0]]);
  }, [mission]);

  // Get battery color based on level
  const getBatteryColor = useCallback((level) => {
    if (level <= 10) return '#e74c3c';
    if (level <= 20) return '#f39c12';
    if (level <= 50) return '#f1c40f';
    return '#2ecc71';
  }, []);

  // Get status badge class
  const getStatusBadgeClass = useCallback(() => {
    switch (simulation.droneState) {
      case simulation.DroneState.FLYING: return 'badge-success';
      case simulation.DroneState.HOVERING: return 'badge-warning';
      case simulation.DroneState.RETURNING: return 'badge-danger';
      case simulation.DroneState.CHARGING: return 'badge-info';
      case simulation.DroneState.READY: return 'badge-success';
      default: return 'badge-secondary';
    }
  }, [simulation.droneState, simulation.DroneState]);

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
          <button className="btn btn-primary" onClick={() => navigate('/dashboard/missions')}>
            Back to Missions
          </button>
        </div>
      </div>
    );
  }

  const isFlying = simulation.missionState === simulation.MissionState.IN_PROGRESS;
  const isPaused = simulation.missionState === simulation.MissionState.PAUSED;
  const isRTH = simulation.rthTriggered;
  const isCharging = simulation.droneState === simulation.DroneState.CHARGING;

  return (
    <div className="mission-monitor">
      <div className="page-header">
        <div className="header-info">
          <h1>{mission.name}</h1>
          <span className={`badge ${getStatusBadgeClass()}`}>
            {simulation.droneState.toUpperCase()}
          </span>
          {isRTH && (
            <span className="badge badge-danger rth-badge">
              RTH: {simulation.rthReason}
            </span>
          )}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard/missions')}>
          ← Back
        </button>
      </div>

      <div className="monitor-layout">
        <div className="monitor-sidebar">
          {/* Mission Progress */}
          <div className="card">
            <h3>Mission Progress</h3>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${simulation.missionProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">{simulation.missionProgress.toFixed(1)}% Complete</p>
            <p className="time-remaining">
              Est. remaining: <strong>{simulation.formattedEta}</strong>
            </p>
          </div>

          {/* Battery Status */}
          <div className="card battery-card">
            <h3>Battery Status</h3>
            <div className="battery-display">
              <div className="battery-icon-container">
                <div 
                  className="battery-level" 
                  style={{ 
                    width: `${simulation.battery}%`,
                    backgroundColor: getBatteryColor(simulation.battery)
                  }}
                ></div>
                <span className="battery-percentage">{simulation.battery.toFixed(0)}%</span>
              </div>
              <span className={`charging-status ${simulation.chargingStatus.status.toLowerCase().replace(' ', '-')}`}>
                {isCharging && '⚡'} {simulation.chargingStatus.status}
              </span>
            </div>
            {simulation.warnings.length > 0 && (
              <div className="battery-warnings">
                {simulation.warnings.map((w, i) => (
                  <div key={i} className={`warning-item warning-${w.level}`}>
                    ⚠️ {w.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Telemetry */}
          <div className="card">
            <h3>Telemetry</h3>
            <div className="telemetry-grid">
              <div className="telemetry-item">
                <span className="telemetry-label">Altitude</span>
                <span className="telemetry-value">{simulation.altitude.toFixed(1)} m</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Speed</span>
                <span className="telemetry-value">{simulation.currentSpeed.toFixed(1)} m/s</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Heading</span>
                <span className="telemetry-value">{simulation.heading.toFixed(0)}°</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Distance</span>
                <span className="telemetry-value">{(simulation.distanceTraveled / 1000).toFixed(2)} km</span>
              </div>
            </div>
          </div>

          {/* Mission Type Selection */}
          <div className="card">
            <h3>Mission Type</h3>
            <div className="mission-type-selector">
              {Object.values(MissionType).map((type) => (
                <button
                  key={type}
                  className={`mission-type-btn ${simulation.selectedMissionType === type ? 'active' : ''}`}
                  onClick={() => handleMissionTypeChange(type)}
                  disabled={isFlying || isPaused}
                >
                  {type === MissionType.GRID && '📐'}
                  {type === MissionType.CROSSHATCH && '✖️'}
                  {type === MissionType.PERIMETER && '🔲'}
                  {type === MissionType.WAYPOINT && '📍'}
                  {type === MissionType.HATCH && '⬔'}
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </button>
              ))}
            </div>
            <p className="mission-type-description">
              {simulation.selectedMissionType === MissionType.GRID && 'Horizontal lawn-mower pattern for efficient coverage'}
              {simulation.selectedMissionType === MissionType.CROSSHATCH && 'Horizontal + vertical passes for double coverage'}
              {simulation.selectedMissionType === MissionType.PERIMETER && 'Spiral inward from boundary for edge surveys'}
              {simulation.selectedMissionType === MissionType.WAYPOINT && 'Direct point-to-point navigation'}
              {simulation.selectedMissionType === MissionType.HATCH && 'Diagonal pattern at 45° for terrain coverage'}
            </p>
          </div>

          {/* Speed Control */}
          <div className="card">
            <h3>Speed Control</h3>
            <div className="speed-slider-container">
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={simulation.targetSpeed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="speed-slider"
              />
              <div className="speed-labels">
                <span>Slow</span>
                <span className="speed-value">{simulation.targetSpeed} m/s</span>
                <span>Fast</span>
              </div>
            </div>
            <div className="speed-presets">
              <button 
                className={`preset-btn ${simulation.targetSpeed === SpeedPresets.SLOW ? 'active' : ''}`}
                onClick={() => handleSpeedChange(SpeedPresets.SLOW)}
              >
                🐢 Slow
              </button>
              <button 
                className={`preset-btn ${simulation.targetSpeed === SpeedPresets.NORMAL ? 'active' : ''}`}
                onClick={() => handleSpeedChange(SpeedPresets.NORMAL)}
              >
                🚶 Normal
              </button>
              <button 
                className={`preset-btn ${simulation.targetSpeed === SpeedPresets.FAST ? 'active' : ''}`}
                onClick={() => handleSpeedChange(SpeedPresets.FAST)}
              >
                🏃 Fast
              </button>
            </div>
            <p className="speed-info">
              Higher speed = faster mission but more battery drain
            </p>
          </div>

          {/* Mission Control */}
          <div className="card">
            <h3>Mission Control</h3>
            
            {/* Debug Info */}
            {!simulation.canFly && (
              <div className="debug-info" style={{
                background: 'rgba(243, 156, 18, 0.2)',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '0.75rem',
                fontSize: '0.8rem',
                color: '#f39c12'
              }}>
                <div><strong>Debug Info:</strong></div>
                <div>Battery: {simulation.battery}%</div>
                <div>Flight Path: {simulation.flightPath?.length || 0} points</div>
                <div>Initialized: {simulation.isInitialized ? 'Yes' : 'No'}</div>
                <div>Can Fly: {simulation.canFly ? 'Yes' : 'No'}</div>
                <div>Drone State: {simulation.droneState}</div>
              </div>
            )}
            
            <div className="control-buttons">
              {!isFlying && !isPaused && !isCharging ? (
                <button 
                  className="btn btn-success btn-block btn-start-mission"
                  onClick={simulation.start}
                  disabled={!simulation.canFly}
                  title={!simulation.canFly ? 'Check debug info above' : 'Start the mission simulation'}
                >
                  ▶️ Start Mission
                </button>
              ) : isCharging ? (
                <button className="btn btn-info btn-block" disabled>
                  ⚡ Charging... {simulation.battery.toFixed(0)}%
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button className="btn btn-success" onClick={simulation.resume}>
                      ▶️ Resume
                    </button>
                  ) : (
                    <button className="btn btn-warning" onClick={simulation.pause}>
                      ⏸️ Pause
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={simulation.stop}>
                    ⏹️ Abort
                  </button>
                </>
              )}
            </div>
            
            {/* RTH Button */}
            {(isFlying || isPaused) && !isRTH && (
              <button 
                className="btn btn-rth btn-block"
                onClick={() => simulation.triggerRTH('manual')}
              >
                🏠 Return to Home
              </button>
            )}

            {/* Reset Button */}
            {!isFlying && !isPaused && !isCharging && (
              <button 
                className="btn btn-secondary btn-block"
                onClick={simulation.reset}
                style={{ marginTop: '0.5rem' }}
              >
                🔄 Reset Simulation
              </button>
            )}

            <p className="waypoint-count">
              📍 {simulation.flightPath.length} waypoints
            </p>
          </div>
        </div>

        {/* Map View */}
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
            <MapUpdater center={simulation.position} />
            
            {/* Survey Area */}
            {getSurveyAreaCoords().length > 0 && (
              <Polygon
                positions={getSurveyAreaCoords()}
                pathOptions={{
                  color: '#3498db',
                  fillColor: '#3498db',
                  fillOpacity: 0.15,
                  weight: 2
                }}
              />
            )}
            
            {/* Planned Flight Path */}
            {simulation.flightPath.length > 0 && simulation.flightPath.every(p => p && isFinite(p[0]) && isFinite(p[1])) && (
              <Polyline
                positions={simulation.flightPath}
                pathOptions={{
                  color: '#95a5a6',
                  weight: 1,
                  dashArray: '5, 5',
                  opacity: 0.4
                }}
              />
            )}
            
            {/* Completed Path */}
            {simulation.completedPath.length > 0 && simulation.completedPath.every(p => p && isFinite(p[0]) && isFinite(p[1])) && (
              <Polyline
                positions={simulation.completedPath}
                pathOptions={{
                  color: '#2ecc71',
                  weight: 3,
                  opacity: 0.8
                }}
              />
            )}

            {/* RTH Path */}
            {simulation.rthPath.length > 0 && simulation.rthPath.every(p => p && isFinite(p[0]) && isFinite(p[1])) && (
              <Polyline
                positions={simulation.rthPath}
                pathOptions={{
                  color: '#e74c3c',
                  weight: 3,
                  dashArray: '10, 5',
                  opacity: 0.8
                }}
              />
            )}
            
            {/* Home Base Marker */}
            {simulation.homePosition && isFinite(simulation.homePosition[0]) && isFinite(simulation.homePosition[1]) && (
              <>
                <Marker position={simulation.homePosition} icon={homeIcon} />
                <Circle
                  center={simulation.homePosition}
                  radius={20}
                  pathOptions={{
                    color: '#3498db',
                    fillColor: '#3498db',
                    fillOpacity: 0.2
                  }}
                />
              </>
            )}
            
            {/* Drone Marker */}
            {simulation.position && isFinite(simulation.position[0]) && isFinite(simulation.position[1]) && (
              <Marker 
                position={simulation.position} 
                icon={createDroneIcon(simulation.heading, isFlying)} 
              />
            )}
          </MapContainer>
          
          {/* Status Overlay */}
          <div className="simulation-overlay">
            {isFlying && !isPaused && (
              <span className="status-indicator running">
                🔴 LIVE
              </span>
            )}
            {isPaused && (
              <span className="status-indicator paused">
                ⏸️ PAUSED
              </span>
            )}
            {isRTH && (
              <span className="status-indicator rth">
                🏠 RTH ACTIVE
              </span>
            )}
            {isCharging && (
              <span className="status-indicator charging">
                ⚡ CHARGING
              </span>
            )}
            <span className="speed-indicator">
              {simulation.currentSpeed.toFixed(1)} m/s
            </span>
          </div>

          {/* Battery Warning Overlay */}
          {simulation.battery <= 20 && !isCharging && (
            <div className="battery-warning-overlay">
              <span className={simulation.battery <= 10 ? 'critical' : 'warning'}>
                ⚠️ {simulation.battery <= 10 ? 'CRITICAL' : 'LOW'} BATTERY: {simulation.battery.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MissionMonitor;
