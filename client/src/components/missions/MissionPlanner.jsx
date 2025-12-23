/**
 * Mission Planner Component
 * 
 * Create and configure new missions with map integration.
 * Will be fully implemented in Task 16.
 */

import { useState } from 'react';
import './MissionPlanner.css';

function MissionPlanner() {
  const [missionData, setMissionData] = useState({
    name: '',
    description: '',
    flightPattern: 'crosshatch',
    altitude: 50,
    speed: 10,
    overlapPercentage: 70,
    sensorType: 'RGB Camera'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMissionData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Mission data:', missionData);
    // Will submit to API
  };

  return (
    <div className="mission-planner">
      <div className="page-header">
        <h1>New Mission</h1>
      </div>

      <div className="planner-layout">
        <div className="planner-map">
          <div className="map-placeholder">
            <p>🗺️ Mapbox Map</p>
            <p className="text-sm text-muted">Draw survey area here</p>
            <p className="text-xs text-muted">(Will be implemented in Task 15)</p>
          </div>
        </div>

        <div className="planner-form card">
          <div className="card-header">
            <h3>Mission Configuration</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Mission Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={missionData.name}
                  onChange={handleChange}
                  placeholder="Enter mission name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  value={missionData.description}
                  onChange={handleChange}
                  placeholder="Mission description"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Flight Pattern</label>
                <select
                  name="flightPattern"
                  className="form-select"
                  value={missionData.flightPattern}
                  onChange={handleChange}
                >
                  <option value="crosshatch">Crosshatch</option>
                  <option value="perimeter">Perimeter</option>
                  <option value="grid">Grid</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Altitude (m)</label>
                  <input
                    type="number"
                    name="altitude"
                    className="form-input"
                    value={missionData.altitude}
                    onChange={handleChange}
                    min={10}
                    max={120}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Speed (m/s)</label>
                  <input
                    type="number"
                    name="speed"
                    className="form-input"
                    value={missionData.speed}
                    onChange={handleChange}
                    min={1}
                    max={20}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Overlap (%)</label>
                  <input
                    type="number"
                    name="overlapPercentage"
                    className="form-input"
                    value={missionData.overlapPercentage}
                    onChange={handleChange}
                    min={0}
                    max={100}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sensor Type</label>
                  <select
                    name="sensorType"
                    className="form-select"
                    value={missionData.sensorType}
                    onChange={handleChange}
                  >
                    <option value="RGB Camera">RGB Camera</option>
                    <option value="Thermal Camera">Thermal Camera</option>
                    <option value="Multispectral">Multispectral</option>
                    <option value="LiDAR">LiDAR</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg">
                Create Mission
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionPlanner;
