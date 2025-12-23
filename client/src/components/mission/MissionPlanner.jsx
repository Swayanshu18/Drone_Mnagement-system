/**
 * Mission Planner Component
 * 
 * Allows users to define a new mission area and parameters.
 */

import { useState, useEffect, useCallback } from 'react';
import MapContainer from '../map/MapContainer';
import DrawingTools from '../map/DrawingTools';
import { droneService } from '../../services/droneService';
import { missionService } from '../../services/missionService';
import { useNavigate } from 'react-router-dom';
import './MissionPlanner.css';

const MissionPlanner = () => {
    const navigate = useNavigate();
    const [mapInstance, setMapInstance] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        drone_id: '',
        site_id: '',
        altitude: 50,
        speed: 10,
        overlap_percentage: 70,
        flight_pattern: 'crosshatch'
    });

    const [surveyArea, setSurveyArea] = useState(null);
    const [areaSize, setAreaSize] = useState(0);
    const [availableDrones, setAvailableDrones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Load available drones
        const loadDrones = async () => {
            try {
                const drones = await droneService.getAllDrones({ status: 'available' });
                setAvailableDrones(drones);
            } catch (err) {
                console.error('Failed to load drones', err);
            }
        };
        loadDrones();
    }, []);

    const handleMapReady = useCallback((map) => {
        setMapInstance(map);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAreaCreated = (data) => {
        if (data) {
            setSurveyArea(data.geometry);
            setAreaSize(Math.round(data.area)); // sq meters
        } else {
            setSurveyArea(null);
            setAreaSize(0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!surveyArea) {
            setError('Please draw a survey area on the map');
            return;
        }
        if (!formData.drone_id) {
            setError('Please select a drone');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create Mission with all data including drone_id and area_size
            const missionPayload = {
                name: formData.name,
                description: formData.description,
                drone_id: formData.drone_id,
                site_id: availableDrones.find(d => d.id === formData.drone_id)?.site_id,
                survey_area: surveyArea,
                area_size: areaSize,
                flight_pattern: formData.flight_pattern,
                parameters: {
                    altitude: parseInt(formData.altitude),
                    speed: parseInt(formData.speed),
                    overlap_percentage: parseInt(formData.overlap_percentage)
                }
            };

            await missionService.createMission(missionPayload);
            navigate('/dashboard/missions');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create mission');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mission-planner">
            <div className="planner-sidebar">
                <h2>Plan Mission</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Mission Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Select Drone</label>
                        <select
                            name="drone_id"
                            value={formData.drone_id}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">-- Select Available Drone --</option>
                            {availableDrones.map(drone => (
                                <option key={drone.id} value={drone.id}>
                                    {drone.name} ({drone.model})
                                </option>
                            ))}
                        </select>
                    </div>

                    <hr />
                    <h3>Flight Parameters</h3>

                    <div className="form-group">
                        <label>Flight Pattern</label>
                        <select
                            name="flight_pattern"
                            value={formData.flight_pattern}
                            onChange={handleInputChange}
                        >
                            <option value="crosshatch">Crosshatch (Best Coverage)</option>
                            <option value="perimeter">Perimeter (Security)</option>
                            <option value="grid">Grid (Standard)</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Altitude (m)</label>
                            <input
                                type="number"
                                name="altitude"
                                value={formData.altitude}
                                onChange={handleInputChange}
                                min="10" max="120"
                            />
                        </div>
                        <div className="form-group">
                            <label>Speed (m/s)</label>
                            <input
                                type="number"
                                name="speed"
                                value={formData.speed}
                                onChange={handleInputChange}
                                min="2" max="20"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Overlap Percentage (%)</label>
                        <input
                            type="number"
                            name="overlap_percentage"
                            value={formData.overlap_percentage}
                            onChange={handleInputChange}
                            min="30" max="90"
                        />
                    </div>

                    <div className="area-info">
                        <strong>Survey Area:</strong> {areaSize > 0 ? `${areaSize} m²` : 'Not defined'}
                    </div>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="planner-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard/missions')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Mission'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="planner-map">
                <MapContainer onMapReady={handleMapReady} />
                {mapInstance && <DrawingTools map={mapInstance} onAreaCreated={handleAreaCreated} />}
            </div>
        </div>
    );
};

export default MissionPlanner;
