/**
 * Main App Component
 * 
 * Sets up routing for the application.
 */

import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import DashboardLayout from './components/dashboard/DashboardLayout';

// Landing page
import LandingPage from './components/landing/LandingPage';

// Dashboard pages
import FleetDashboard from './components/fleet/FleetDashboard';
import MissionList from './components/missions/MissionList';
import MissionPlanner from './components/missions/MissionPlanner';
import MissionMonitor from './components/missions/MissionMonitor';
import ReportsDashboard from './components/reports/ReportsDashboard';
import UserManagement from './components/users/UserManagement';

function App() {
  return (
    <Routes>
      {/* Public routes - Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Dashboard routes - No authentication required */}
      <Route path="/dashboard" element={<DashboardLayout />}>
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
