/**
 * Mission List Component
 * 
 * Displays list of missions with filtering and actions.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService } from '../../services/missionService';
import './MissionList.css';

const MissionList = () => {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadMissions();
    }, []);

    const loadMissions = async () => {
        try {
            setLoading(true);
            const data = await missionService.getAllMissions();
            // Ensure data is array
            setMissions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load missions', err);
            setError('Failed to load missions');
            // Set empty array on error to prevent map error
            setMissions([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredMissions = missions.filter(m => {
        if (filter === 'all') return true;
        return m.status === filter;
    });

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'planned': return 'badge-secondary';
            case 'in_progress': return 'badge-primary';
            case 'completed': return 'badge-success';
            case 'aborted': return 'badge-danger';
            case 'paused': return 'badge-warning';
            default: return 'badge-secondary';
        }
    };

    return (
        <div className="mission-list-page">
            <div className="page-header">
                <h1>Missions</h1>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard/missions/new')}>
                    + New Mission
                </button>
            </div>

            <div className="filter-bar">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-btn ${filter === 'planned' ? 'active' : ''}`}
                    onClick={() => setFilter('planned')}
                >
                    Planned
                </button>
                <button
                    className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
                    onClick={() => setFilter('in_progress')}
                >
                    Active
                </button>
                <button
                    className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Completed
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading missions...</div>
            ) : error ? (
                <div className="error">{error}</div>
            ) : filteredMissions.length === 0 ? (
                <div className="empty-state">
                    <p>No missions found.</p>
                    <button className="btn btn-link" onClick={() => navigate('/dashboard/missions/new')}>
                        Create your first mission
                    </button>
                </div>
            ) : (
                <div className="mission-grid">
                    {filteredMissions.map(mission => (
                        <div key={mission.id} className="mission-card" onClick={() => navigate(`/dashboard/missions/${mission.id}`)}>
                            <div className="mission-card-header">
                                <h3>{mission.name}</h3>
                                <span className={`badge ${getStatusBadgeClass(mission.status)}`}>
                                    {mission.status}
                                </span>
                            </div>
                            <div className="mission-card-body">
                                <p>{mission.description || 'No description'}</p>
                                <div className="mission-meta">
                                    <span>🚁 Drone: {mission.drone_name || 'Assigned'}</span>
                                    <span>📍 Area: {Math.round(mission.area_size || 0)} m²</span>
                                    <span>📅 {new Date(mission.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="mission-card-footer">
                                <button className="btn btn-sm btn-outline">
                                    {mission.status === 'in_progress' ? 'Monitor' : 'View Details'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MissionList;
