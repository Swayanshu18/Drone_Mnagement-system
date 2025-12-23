/**
 * Main App Component
 * 
 * Sets up routing for the application.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layout
import DashboardLayout from './components/dashboard/DashboardLayout';

// Landing page
import LandingPage from './components/landing/LandingPage';

// Auth pages
import LoginForm from './components/auth/LoginForm';

// Dashboard pages
import FleetDashboard from './components/fleet/FleetDashboard';
import MissionList from './components/mission/MissionList';
import MissionPlanner from './components/mission/MissionPlanner';
import MissionMonitor from './components/mission/MissionMonitor';
import ReportsDashboard from './components/reports/ReportsDashboard';
import UserManagement from './components/users/UserManagement';

// Protected Route wrapper
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="fleet" replace />} />
        <Route path="fleet" element={<FleetDashboard />} />
        <Route path="missions" element={<MissionList />} />
        <Route path="missions/new" element={<MissionPlanner />} />
        <Route path="missions/:id" element={<MissionMonitor />} />
        <Route path="reports" element={<ReportsDashboard />} />
        <Route path="users" element={<UserManagement />} />
      </Route>

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
