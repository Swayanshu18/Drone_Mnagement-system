/**
 * Header Component
 * 
 * Top header with connection status.
 */

import { useWebSocket } from '../../hooks/useWebSocket';
import './Header.css';

function Header() {
  const { isConnected } = useWebSocket();

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
      </div>
    </header>
  );
}

export default Header;
