/**
 * Mission List Component
 * 
 * Displays all missions with filtering and sorting.
 * Will be fully implemented in Task 16.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MissionList.css';

function MissionList() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder - will fetch from API
    setLoading(false);
    setMissions([
      { id: '1', name: 'SF Facility Inspection', status: 'completed', progress: 100, drone: 'Alpha-1' },
      { id: '2', name: 'NY Perimeter Survey', status: 'planned', progress: 0, drone: 'Beta-2' },
      { id: '3', name: 'Warehouse Mapping', status: 'in-progress', progress: 45, drone: 'Alpha-2' }
    ]);
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      'planned': 'badge-secondary',
      'starting': 'badge-info',
      'in-progress': 'badge-info',
      'paused': 'badge-warning',
      'completed': 'badge-success',
      'aborted': 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="mission-list">
      <div className="page-header">
        <h1>Missions</h1>
        <Link to="/dashboard/missions/new" className="btn btn-primary">
          New Mission
        </Link>
      </div>

      <div className="mission-filters">
        <select className="form-select">
          <option value="">All Status</option>
          <option value="planned">Planned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="aborted">Aborted</option>
        </select>
      </div>

      <div className="missions-table card">
        <table>
          <thead>
            <tr>
              <th>Mission Name</th>
              <th>Drone</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {missions.map(mission => (
              <tr key={mission.id}>
                <td>
                  <Link to={`/dashboard/missions/${mission.id}`}>
                    {mission.name}
                  </Link>
                </td>
                <td>{mission.drone}</td>
                <td>
                  <span className={`badge ${getStatusBadge(mission.status)}`}>
                    {mission.status}
                  </span>
                </td>
                <td>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${mission.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{mission.progress}%</span>
                </td>
                <td>
                  <Link 
                    to={`/dashboard/missions/${mission.id}`} 
                    className="btn btn-secondary btn-sm"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MissionList;
