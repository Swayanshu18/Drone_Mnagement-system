/**
 * Mission Monitor Component
 * 
 * Real-time monitoring of active missions.
 * Shows drone position, flight path, and telemetry.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapContainer from '../map/MapContainer';
import { createDroneMarker } from '../map/DroneMarker';
import { missionService } from '../../services/missionService';
import { useWebSocket } from '../../hooks/useWebSocket';
import './MissionMonitor.css';

const MissionMonitor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mission, setMission] = useState(null);
    const [telemetry, setTelemetry] = useState(null);
    const [loading, setLoading] = useState(true);

    const { subscribe, subscribeMission, subscribeDrone } = useWebSocket();

    // Fetch mission details
    useEffect(() => {
        const loadMission = async () => {
            try {
                const data = await missionService.getMission(id);
                setMission(data);
                // Set initial position if available (from last known or home)
                // For now, center on first waypoint
                if (data.waypoints && data.waypoints.length > 0) {
                    setTelemetry({
                        latitude: data.waypoints[0].latitude,
                        longitude: data.waypoints[0].longitude,
                        battery: 100,
                        altitude: 0,
                        speed: 0
                    });
                }
            } catch (err) {
                console.error('Failed to load mission', err);
            } finally {
                setLoading(false);
            }
        };
        loadMission();
    }, [id]);

    // Real-time subscriptions
    useEffect(() => {
        if (!mission) return;

        // Subscribe to mission updates (status, progress)
        const unsubMission = subscribeMission(id);

        // Subscribe to drone telemetry
        const unsubDrone = subscribeDrone(mission.drone_id);

        // Listeners
        const unsubTelem = subscribe('telemetry:update', (data) => {
            if (data.droneId === mission.drone_id) {
                setTelemetry(data);
            }
        });

        const unsubStatus = subscribe('mission:status', (data) => {
            if (data.missionId === mission.id) {
                setMission(prev => ({ ...prev, status: data.status }));
            }
        });

        return () => {
            unsubMission();
            unsubDrone();
            unsubTelem();
            unsubStatus();
        };
    }, [mission, id, subscribe, subscribeMission, subscribeDrone]);

    const handleControl = async (action) => {
        try {
            await missionService.controlMission(id, action);
        } catch (err) {
            alert(`Failed to ${action} mission: ${err.message}`);
        }
    };

    if (loading) return <div className="loading">Loading mission...</div>;
    if (!mission) return <div className="error">Mission not found</div>;

    // Get initial center from waypoints or survey area or default
    const getMapCenter = () => {
        if (telemetry?.latitude && telemetry?.longitude) {
            return [telemetry.latitude, telemetry.longitude];
        }
        if (mission.waypoints && mission.waypoints.length > 0) {
            return [mission.waypoints[0].latitude, mission.waypoints[0].longitude];
        }
        // Try to get center from survey_area
        if (mission.survey_area?.coordinates?.[0]?.[0]) {
            const coords = mission.survey_area.coordinates[0][0];
            return [coords[1], coords[0]]; // GeoJSON is [lng, lat]
        }
        return [37.7749, -122.4194]; // Default SF
    };

    return (
        <div className="mission-monitor">
            <div className="monitor-sidebar">
                <div className="mission-header">
                    <h2>{mission.name}</h2>
                    <span className={`badge badge-${mission.status}`}>{mission.status}</span>
                </div>

                <div className="telemetry-panel">
                    <h3>Mission Progress</h3>
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar-fill" 
                            style={{ width: `${mission.progress_percentage || 0}%` }}
                        />
                    </div>
                    <div className="progress-text">
                        {Math.round(mission.progress_percentage || 0)}% Complete
                    </div>
                </div>

                <div className="telemetry-panel">
                    <h3>Telemetry</h3>
                    <div className="telemetry-grid">
                        <div className="metric">
                            <span className="metric-label">Altitude</span>
                            <span className="metric-value">{telemetry?.altitude?.toFixed(1) || 0} m</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Speed</span>
                            <span className="metric-value">{telemetry?.speed?.toFixed(1) || 0} m/s</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Battery</span>
                            <span className={`metric-value ${telemetry?.battery < 20 ? 'text-danger' : ''}`}>
                                {telemetry?.battery?.toFixed(0) || 0}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="controls-panel">
                    <h3>Mission Control</h3>
                    <div className="control-buttons">
                        {mission.status === 'planned' && (
                            <button className="btn btn-success" onClick={() => handleControl('start')}>
                                Start Mission
                            </button>
                        )}
                        {mission.status === 'in_progress' && (
                            <button className="btn btn-warning" onClick={() => handleControl('pause')}>
                                Pause
                            </button>
                        )}
                        {mission.status === 'paused' && (
                            <button className="btn btn-info" onClick={() => handleControl('resume')}>
                                Resume
                            </button>
                        )}
                        {['in_progress', 'paused'].includes(mission.status) && (
                            <button className="btn btn-danger" onClick={() => handleControl('abort')}>
                                Abort
                            </button>
                        )}
                    </div>
                </div>

                <button className="btn btn-link back-btn" onClick={() => navigate('/dashboard/missions')}>
                    ← Back to Missions
                </button>
            </div>

            <div className="monitor-map">
                <MapContainer
                    initialCenter={getMapCenter()}
                    initialZoom={16}
                    markers={telemetry ? [createDroneMarker({
                        latitude: telemetry.latitude,
                        longitude: telemetry.longitude,
                        id: mission.drone_id,
                        status: mission.status === 'in_progress' ? 'in-mission' : 'available'
                    })] : []}
                />
            </div>
        </div>
    );
};

export default MissionMonitor;
