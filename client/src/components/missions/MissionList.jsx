/**
 * Mission List Component
 * 
 * Displays all missions with filtering, sorting, and simulation access.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './MissionList.css';

function MissionList() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/missions');
      setMissions(response.data.missions || response.data || []);
    } catch (err) {
      console.error('Error fetching missions:', err);
      // Fallback to demo data
      setMissions([
        { id: '1', name: 'SF Facility Inspection', status: 'completed', progress: 100, drone_name: 'Alpha-1' },
        { id: '2', name: 'NY Perimeter Survey', status: 'planned', progress: 0, drone_name: 'Beta-2' },
        { id: '3', name: 'Warehouse Mapping', status: 'in_progress', progress: 45, drone_name: 'Alpha-2' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'planned': 'badge-secondary',
      'starting': 'badge-info',
      'in_progress': 'badge-info',
      'in-progress': 'badge-info',
      'paused': 'badge-warning',
      'completed': 'badge-success',
      'aborted': 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  const filteredMissions = filter 
    ? missions.filter(m => m.status === filter)
    : missions;

  if (loading) {
    return (
      <div className="mission-list">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mission-list">
      <div className="page-header">
        <h1>Missions</h1>
        <Link to="/dashboard/missions/new" className="btn btn-primary">
          + New Mission
        </Link>
      </div>

      <div className="mission-filters">
        <select 
          className="form-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="aborted">Aborted</option>
        </select>
        <span className="mission-count">{filteredMissions.length} missions</span>
      </div>

      <div className="missions-table card">
        <table>
          <thead>
            <tr>
              <th>Mission Name</th>
              <th>Drone</th>
              <th>Pattern</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMissions.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No missions found. Create your first mission!
                </td>
              </tr>
            ) : (
              filteredMissions.map(mission => (
                <tr key={mission.id}>
                  <td>
                    <Link to={`/dashboard/missions/${mission.id}`} className="mission-name">
                      {mission.name}
                    </Link>
                  </td>
                  <td>{mission.drone_name || 'Unassigned'}</td>
                  <td className="pattern-cell">
                    <span className="pattern-badge">
                      {mission.flight_pattern || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(mission.status)}`}>
                      {mission.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${mission.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{mission.progress || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/dashboard/missions/${mission.id}`)}
                        title="View & Simulate"
                      >
                        🎬 Simulate
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/dashboard/missions/${mission.id}`)}
                        title="View Details"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MissionList;
