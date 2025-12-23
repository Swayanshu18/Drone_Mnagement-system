/**
 * Header Component
 * 
 * Top header with user info and logout.
 */

import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="header-title">Dashboard</h2>
      </div>

      <div className="header-right">
        <div className="header-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        <div className="header-user">
          <span className="header-user-name">{user?.name}</span>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
