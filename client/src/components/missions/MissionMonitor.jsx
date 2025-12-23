/**
 * Mission Monitor Component
 * 
 * Real-time mission monitoring with map and controls.
 * Will be fully implemented in Task 17.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './MissionMonitor.css';

function MissionMonitor() {
  const { id } = useParams();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder - will fetch from API and subscribe to WebSocket
    setLoading(false);
    setMission({
      id,
      name: 'SF Facility Inspection',
      status: 'in-progress',
      progress: 45,
      drone: {
        name: 'Alpha-1',
        batteryLevel: 78,
        altitude: 50,
        speed: 8.5
      },
      estimatedTimeRemaining: '12:30'
    });
  }, [id]);

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (!mission) {
    return <div>Mission not found</div>;
  }

  return (
    <div className="mission-monitor">
      <div className="page-header">
        <div>
          <h1>{mission.name}</h1>
          <span className="badge badge-info">{mission.status}</span>
        </div>
      </div>

      <div className="monitor-layout">
        <div className="monitor-map">
          <div className="map-placeholder">
            <p>🗺️ Live Mission Map</p>
            <p className="text-sm text-muted">Drone position and flight path</p>
            <p className="text-xs text-muted">(Will be implemented in Task 15)</p>
          </div>
        </div>

        <div className="monitor-sidebar">
          <div className="card">
            <div className="card-header">
              <h3>Mission Progress</h3>
            </div>
            <div className="card-body">
              <div className="progress-display">
                <div className="progress-circle">
                  <span className="progress-value">{mission.progress}%</span>
                </div>
                <p className="text-sm text-muted">
                  Est. remaining: {mission.estimatedTimeRemaining}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Telemetry</h3>
            </div>
            <div className="card-body">
              <div className="telemetry-grid">
                <div className="telemetry-item">
                  <span className="telemetry-label">Battery</span>
                  <span className="telemetry-value">{mission.drone.batteryLevel}%</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Altitude</span>
                  <span className="telemetry-value">{mission.drone.altitude}m</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Speed</span>
                  <span className="telemetry-value">{mission.drone.speed} m/s</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Drone</span>
                  <span className="telemetry-value">{mission.drone.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Controls</h3>
            </div>
            <div className="card-body">
              <div className="control-buttons">
                <button className="btn btn-warning">Pause</button>
                <button className="btn btn-danger">Abort</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionMonitor;
