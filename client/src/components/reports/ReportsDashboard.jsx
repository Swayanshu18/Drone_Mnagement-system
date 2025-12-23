/**
 * Reports Dashboard Component
 * 
 * Organization-wide statistics and mission reports with charts.
 */

import { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ReportsDashboard.css';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

function ReportsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await reportService.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load stats', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (error || !stats) {
    return (
      <div className="reports-dashboard">
        <div className="page-header">
          <h1>Reports & Analytics</h1>
        </div>
        <div className="error-message">{error || 'No data available'}</div>
      </div>
    );
  }

  const statusData = [
    { name: 'Completed', value: stats.completed_missions || 0 },
    { name: 'Active', value: stats.active_missions || 0 },
    { name: 'Planned', value: stats.planned_missions || 0 },
    { name: 'Aborted', value: stats.aborted_missions || 0 }
  ].filter(item => item.value > 0);

  const hasStatusData = statusData.length > 0;
  const hasMonthlyData = stats.missions_by_month && stats.missions_by_month.length > 0;

  // Format coverage - convert from m² to km² if large
  const formatCoverage = (sqm) => {
    if (!sqm || sqm === 0) return '0 m²';
    if (sqm >= 1000000) return `${(sqm / 1000000).toFixed(2)} km²`;
    if (sqm >= 1000) return `${(sqm / 1000).toFixed(1)} k m²`;
    return `${Math.round(sqm)} m²`;
  };

  return (
    <div className="reports-dashboard">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <span className="stat-value">{stats.total_missions || 0}</span>
          <span className="stat-label">Total Missions</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <span className="stat-value">{stats.completed_missions || 0}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🗺️</span>
          <span className="stat-value">{formatCoverage(stats.total_coverage)}</span>
          <span className="stat-label">Coverage</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🎯</span>
          <span className="stat-value">{stats.success_rate || 0}%</span>
          <span className="stat-label">Success Rate</span>
        </div>
      </div>

      <div className="charts-section">
        <div className="card">
          <div className="card-header">
            <h3>Mission Status Distribution</h3>
          </div>
          <div className="card-body chart-container">
            {hasStatusData ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">
                <span className="no-data-icon">📭</span>
                <p>No mission data available yet</p>
                <p className="no-data-hint">Create and complete missions to see statistics</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Missions by Month</h3>
          </div>
          <div className="card-body chart-container">
            {hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.missions_by_month}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Missions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">
                <span className="no-data-icon">📅</span>
                <p>No monthly data available</p>
                <p className="no-data-hint">Mission history will appear here over time</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="card full-width">
          <div className="card-header">
            <h3>Mission Summary</h3>
          </div>
          <div className="card-body">
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Active Missions</span>
                <span className="summary-value active">{stats.active_missions || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Planned Missions</span>
                <span className="summary-value planned">{stats.planned_missions || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Aborted/Failed</span>
                <span className="summary-value aborted">{stats.aborted_missions || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Completion Rate</span>
                <span className="summary-value">{stats.success_rate || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsDashboard;
