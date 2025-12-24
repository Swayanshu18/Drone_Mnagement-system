/**
 * WebSocket Context
 * 
 * Provides WebSocket connection and event handling throughout the app.
 */

import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

export const WebSocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? 'https://drone-mnagement-system.onrender.com' : 'http://localhost:5001');

export function WebSocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  // Initialize socket connection (no auth required)
  useEffect(() => {
    // Disconnect existing socket before creating new one
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Generic message handler
    socketRef.current.onAny((event, data) => {
      setLastMessage({ event, data, timestamp: new Date() });
    });

    // Re-attach existing listeners to new socket
    listenersRef.current.forEach((callbacks, event) => {
      callbacks.forEach(cb => {
        socketRef.current.on(event, cb);
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // Only run once on mount

  // Subscribe to an event
  const subscribe = useCallback((event, callback) => {
    if (!socketRef.current) return () => { };

    socketRef.current.on(event, callback);

    // Track listener for cleanup
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
      listenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  // Emit an event
  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  // Subscribe to mission updates
  const subscribeMission = useCallback((missionId) => {
    emit('mission:subscribe', missionId);
    return () => emit('mission:unsubscribe', missionId);
  }, [emit]);

  // Subscribe to drone updates
  const subscribeDrone = useCallback((droneId) => {
    emit('drone:subscribe', droneId);
    return () => emit('drone:unsubscribe', droneId);
  }, [emit]);

  const value = {
    isConnected,
    lastMessage,
    subscribe,
    emit,
    subscribeMission,
    subscribeDrone,
    socket: socketRef.current
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
