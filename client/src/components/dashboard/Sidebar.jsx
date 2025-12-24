/**
 * Sidebar Component
 * 
 * Navigation sidebar with menu items.
 */

import { NavLink } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Sidebar.css';

function Sidebar() {
  const menuItems = [
    { path: '/dashboard/fleet', label: 'Fleet', icon: '✈️' },
    { path: '/dashboard/missions', label: 'Missions', icon: '📍' },
    { path: '/dashboard/missions/new', label: 'New Mission', icon: '➕' },
    { path: '/dashboard/reports', label: 'Reports', icon: '📊' },
    { path: '/dashboard/users', label: 'Users', icon: '👥' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="DroneSurvey" className="sidebar-logo-img" />
        <span className="sidebar-title">DroneSurvey</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
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
            Public Access
          </span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
