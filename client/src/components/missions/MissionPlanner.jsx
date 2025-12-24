/**
 * Mission Planner Component
 * 
 * Create and configure new missions with map integration.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapContainer from '../map/MapContainer';
import DrawingTools from '../map/DrawingTools';
import api from '../../services/api';
import './MissionPlanner.css';

function MissionPlanner() {
  const navigate = useNavigate();
  const [mapInstance, setMapInstance] = useState(null);
  const [surveyArea, setSurveyArea] = useState(null);
  const [drones, setDrones] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [missionData, setMissionData] = useState({
    name: '',
    description: '',
    droneId: '',
    siteId: '',
    flightPattern: 'crosshatch',
    altitude: 50,
    speed: 10,
    overlapPercentage: 70,
    sensorType: 'RGB Camera'
  });

  // Fetch available drones and sites
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dronesRes, sitesRes] = await Promise.all([
          api.get('/drones'),
          api.get('/sites')
        ]);
        setDrones(dronesRes.data);
        setSites(sitesRes.data);
        
        // Auto-select first available drone
        if (dronesRes.data.length > 0) {
          setMissionData(prev => ({ ...prev, droneId: dronesRes.data[0].id }));
        }
        // Auto-select first site
        if (sitesRes.data.length > 0) {
          setMissionData(prev => ({ ...prev, siteId: sitesRes.data[0].id }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleMapReady = useCallback((map) => {
    setMapInstance(map);
  }, []);

  const handleAreaDrawn = useCallback((area) => {
    setSurveyArea(area);
    console.log('Survey area drawn:', area);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMissionData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!missionData.droneId) {
      alert('Please select a drone');
      return;
    }
    
    if (!surveyArea) {
      alert('Please draw a survey area on the map');
      return;
    }
    
    setLoading(true);
    
    const payload = {
      name: missionData.name,
      description: missionData.description,
      drone_id: missionData.droneId,
      site_id: missionData.siteId,
      survey_area: surveyArea.geometry,
      flight_pattern: missionData.flightPattern,
      altitude: parseFloat(missionData.altitude),
      speed: parseFloat(missionData.speed),
      overlap_percentage: parseFloat(missionData.overlapPercentage),
      sensor_type: missionData.sensorType
    };
    
    api.post('/missions', payload)
      .then(response => {
        console.log('Mission created:', response.data);
        alert('Mission created successfully!');
        navigate('/dashboard/missions');
      })
      .catch(error => {
        console.error('Error creating mission:', error);
        alert('Error creating mission: ' + (error.response?.data?.message || error.message));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="mission-planner">
      <div className="page-header">
        <h1>New Mission</h1>
      </div>

      <div className="planner-layout">
        <div className="planner-map">
          <MapContainer
            initialCenter={[37.7749, -122.4194]}
            initialZoom={13}
            onMapReady={handleMapReady}
          />
          {mapInstance && (
            <DrawingTools 
              map={mapInstance} 
              onAreaDrawn={handleAreaDrawn}
            />
          )}
          {!surveyArea && (
            <div className="map-hint">
              <span className="hint-icon">✏️</span>
              <span className="hint-text">Click the polygon tool (top-right) to draw survey area</span>
            </div>
          )}
          {surveyArea && (
            <div className="map-hint success">
              <span className="hint-icon">✓</span>
              <span className="hint-text">Survey area: {(surveyArea.area / 10000).toFixed(2)} hectares</span>
            </div>
          )}
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
                <label className="form-label">Select Drone *</label>
                <select
                  name="droneId"
                  className="form-select"
                  value={missionData.droneId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a drone...</option>
                  {drones.map(drone => (
                    <option key={drone.id} value={drone.id}>
                      {drone.model} - {drone.serial_number} ({drone.status})
                    </option>
                  ))}
                </select>
                {drones.length === 0 && (
                  <small className="form-text text-muted">⚠️ No drones available. Please add a drone first.</small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Site Location</label>
                <select
                  name="siteId"
                  className="form-select"
                  value={missionData.siteId}
                  onChange={handleChange}
                >
                  <option value="">Choose a site (optional)...</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Flight Pattern</label>
                <select
                  name="flightPattern"
                  className="form-select"
                  value={missionData.flightPattern}
                  onChange={handleChange}
                >
                  <option value="grid">Grid</option>
                  <option value="crosshatch">Crosshatch</option>
                  <option value="perimeter">Perimeter</option>
                  <option value="hatch">Hatch</option>
                  <option value="waypoint">Waypoint</option>
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

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Creating...' : 'Create Mission'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionPlanner;
