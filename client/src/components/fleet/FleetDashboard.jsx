/**
 * Fleet Dashboard Component
 * 
 * Displays organization-wide drone inventory and allows registration.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { droneService } from '../../services/droneService';
import { useWebSocket } from '../../hooks/useWebSocket';
import DroneForm from './DroneForm';
import './FleetDashboard.css';

function FleetDashboard() {
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { subscribe, subscribeDrone } = useWebSocket();

  const fetchDrones = useCallback(async () => {
    try {
      if (drones.length === 0) setLoading(true);

      const data = await droneService.getAllDrones();
      const transformed = data.map(d => ({
        ...d,
        batteryLevel: d.battery_level
      }));
      setDrones(transformed);
      setError(null);
    } catch (err) {
      setError('Failed to load fleet data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [drones.length]);

  useEffect(() => {
    fetchDrones();
  }, [fetchDrones, refreshTrigger]);

  // Live updates
  useEffect(() => {
    // Listen for status changes
    const unsubStatus = subscribe('drone:status', (data) => {
      setDrones(prev => prev.map(d =>
        d.id === data.droneId ? { ...d, status: data.status } : d
      ));
    });

    // Listen for battery alerts
    const unsubAlert = subscribe('alert:battery', (data) => {
      setDrones(prev => prev.map(d =>
        d.id === data.droneId ? { ...d, batteryLevel: data.batteryLevel } : d
      ));
    });

    // Listen for telemetry updates (requires room subscription)
    const unsubTelemetry = subscribe('telemetry:update', (data) => {
      setDrones(prev => prev.map(d =>
        d.id === data.droneId ? { ...d, batteryLevel: data.battery } : d
      ));
    });

    return () => {
      unsubStatus();
      unsubAlert();
      unsubTelemetry();
    };
  }, [subscribe]);

  // Manage room subscriptions
  const droneIds = useMemo(() => drones.map(d => d.id).sort().join(','), [drones]);

  useEffect(() => {
    if (!droneIds) return;
    const ids = droneIds.split(',');

    // Subscribe to each drone's room
    const unsubs = ids.map(id => subscribeDrone(id));

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [droneIds, subscribeDrone]);

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'available': 'badge-success',
      'in-mission': 'badge-info',
      'maintenance': 'badge-warning',
      'offline': 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading && drones.length === 0) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="fleet-dashboard">
      <div className="page-header">
        <h1>Fleet Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add Drone</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="fleet-stats">
        <div className="stat-card">
          <span className="stat-value">{drones.length}</span>
          <span className="stat-label">Total Drones</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{drones.filter(d => d.status === 'available').length}</span>
          <span className="stat-label">Available</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{drones.filter(d => d.status === 'in-mission').length}</span>
          <span className="stat-label">In Mission</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{drones.filter(d => d.status === 'maintenance').length}</span>
          <span className="stat-label">Maintenance</span>
        </div>
      </div>

      <div className="drone-grid">
        {drones.length === 0 ? (
          <p className="no-data">No drones registered. Add one to get started.</p>
        ) : (
          drones.map(drone => (
            <div key={drone.id} className="card drone-card">
              <div className="card-body">
                <div className="drone-header">
                  <h3>{drone.name}</h3>
                  <span className={`badge ${getStatusBadge(drone.status)}`}>
                    {drone.status}
                  </span>
                </div>
                <p className="drone-model">{drone.model}</p>
                <div className="drone-battery">
                  <span>Battery</span>
                  <div className="battery-bar">
                    <div
                      className="battery-fill"
                      style={{
                        width: `${drone.batteryLevel}%`,
                        backgroundColor: drone.batteryLevel < 20 ? 'var(--danger-color)' : 'var(--success-color)'
                      }}
                    ></div>
                  </div>
                  <span>{drone.batteryLevel ? Math.round(drone.batteryLevel) : 0}%</span>
                </div>
                <div className="drone-details">
                  <small>SN: {drone.serial_number}</small>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <DroneForm
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default FleetDashboard;
