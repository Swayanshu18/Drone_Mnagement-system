/**
 * Main Entry Point
 * 
 * Initializes the React application with routing and context providers.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WebSocketProvider } from './context/WebSocketContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WebSocketProvider>
        <App />
      </WebSocketProvider>
    </BrowserRouter>
  </React.StrictMode>
);
