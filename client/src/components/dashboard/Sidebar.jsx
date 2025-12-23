/**
 * Sidebar Component
 * 
 * Navigation sidebar with role-based menu items.
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.png';
import './Sidebar.css';

function Sidebar() {
  const { user } = useAuth();

  const menuItems = [
    { path: '/dashboard/fleet', label: 'Fleet', icon: '✈️', roles: ['admin', 'operator', 'viewer'] },
    { path: '/dashboard/missions', label: 'Missions', icon: '📍', roles: ['admin', 'operator', 'viewer'] },
    { path: '/dashboard/missions/new', label: 'New Mission', icon: '➕', roles: ['admin', 'operator'] },
    { path: '/dashboard/reports', label: 'Reports', icon: '📊', roles: ['admin', 'operator', 'viewer'] },
    { path: '/dashboard/users', label: 'Users', icon: '👥', roles: ['admin'] }
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="DroneSurvey" className="sidebar-logo-img" />
        <span className="sidebar-title">DroneSurvey</span>
      </div>

      <nav className="sidebar-nav">
        {filteredItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-role badge badge-info">
            {user?.role}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
