/**
 * useFlightSimulation Hook
 * 
 * Manages drone flight simulation via Backend WebSocket connection.
 */

import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { WebSocketContext } from '../context/WebSocketContext';
import FlightPathGenerator, { MissionType } from '../services/flightSimulation/FlightPathGenerator';

export const SpeedPresets = {
  SLOW: 5,
  NORMAL: 10,
  FAST: 15,
  MAX: 20
};

export const DroneState = {
  IDLE: 'IDLE',
  TAKEOFF: 'TAKEOFF',
  FLYING: 'FLYING',
  HOVERING: 'HOVERING',
  RTH: 'RTH',
  LANDING: 'LANDING',
  CHARGING: 'CHARGING',
  READY: 'READY'
};

export const MissionState = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ABORTED: 'ABORTED'
};

const useFlightSimulation = (missionData) => {
  const { socket, isConnected } = useContext(WebSocketContext);
  const pathGeneratorRef = useRef(new FlightPathGenerator());

  // State matching backend telemetry
  const [simulationState, setSimulationState] = useState({
    droneState: DroneState.IDLE,
    missionState: MissionState.PLANNED,
    position: null,
    homePosition: null,
    currentSpeed: 0,
    targetSpeed: SpeedPresets.NORMAL,
    battery: 100,
    altitude: 0,
    heading: 0,
    distanceTraveled: 0,
    missionProgress: 0,
    warnings: [],
    rthTriggered: false,
    rthReason: null
  });

  const [flightPath, setFlightPath] = useState([]);
  const [completedPath, setCompletedPath] = useState([]);
  const [rthPath, setRthPath] = useState([]);
  const [selectedMissionType, setSelectedMissionType] = useState(MissionType.GRID);
  const [eta, setEta] = useState(0);

  // Subscribe to telemetry
  useEffect(() => {
    if (!socket || !isConnected || !missionData?.drone_id) return;

    console.log('🔌 Subscribing to drone:', missionData.drone_id, 'mission:', missionData.id);

    // Subscribe to drone telemetry
    socket.emit('drone:subscribe', missionData.drone_id);
    socket.emit('mission:subscribe', missionData.id);

    // Set initial home position from survey area (only once)
    if (missionData?.survey_area?.coordinates?.[0]?.[0]) {
      const firstCoord = missionData.survey_area.coordinates[0][0];
      const homePos = [firstCoord[1], firstCoord[0]];
      setSimulationState(prev => {
        // Only set if not already set
        if (!prev.homePosition) {
          console.log('🏠 Home position set:', homePos);
          return {
            ...prev,
            homePosition: homePos,
            position: homePos
          };
        }
        return prev;
      });
    }

    const handleTelemetry = (data) => {
      console.log('📡 Telemetry received:', data);
      if (data.droneId !== missionData.drone_id) return;

      setSimulationState(prev => ({
        ...prev,
        position: [data.latitude, data.longitude],
        altitude: data.altitude,
        currentSpeed: data.speed,
        battery: data.battery,
        heading: data.heading,
        droneState: data.state || prev.droneState
      }));
      // Add point to completed path
      setCompletedPath(prev => [...prev, [data.latitude, data.longitude]]);
    };

    const handleProgress = (data) => {
      if (data.missionId !== missionData.id) return;
      setSimulationState(prev => ({
        ...prev,
        missionProgress: data.percentage
      }));
      if (data.eta) setEta(data.eta);
    };

    const handleStatus = (data) => {
      console.log('📊 Mission status received:', data);
      if (data.missionId !== missionData.id) return;
      setSimulationState(prev => ({
        ...prev,
        missionState: data.status === 'completed' ? MissionState.COMPLETED :
          data.status === 'started' ? MissionState.IN_PROGRESS : prev.missionState
      }));
      if (data.flightPath) {
        console.log('✈️ Flight path received:', data.flightPath.length, 'waypoints');
        setFlightPath(data.flightPath);
      }
    };

    socket.on('telemetry:update', handleTelemetry);
    socket.on('mission:progress', handleProgress);
    socket.on('mission:status', handleStatus);

    return () => {
      console.log('🔌 Unsubscribing from drone:', missionData.drone_id, 'mission:', missionData.id);
      socket.off('telemetry:update', handleTelemetry);
      socket.off('mission:progress', handleProgress);
      socket.off('mission:status', handleStatus);

      socket.emit('drone:unsubscribe', missionData.drone_id);
      socket.emit('mission:unsubscribe', missionData.id);
    };
  }, [socket, isConnected, missionData?.drone_id, missionData?.id]); // Only re-run if these specific values change

  // Generate flight path (Preview) locally
  // This allows the user to see the path before starting the simulation
  useEffect(() => {
    // If simulation is already running, don't overwrite path
    if (simulationState.missionState === MissionState.IN_PROGRESS ||
      simulationState.missionState === MissionState.PAUSED) return;

    if (!missionData?.survey_area?.coordinates?.[0]) return;

    // Instantiate generator if needed (should already be done in init effect but for safety)
    if (!pathGeneratorRef.current) {
      pathGeneratorRef.current = new FlightPathGenerator();
    }

    const path = pathGeneratorRef.current.generate(
      missionData.survey_area,
      selectedMissionType,
      {
        overlap: (missionData.overlap_percentage || 70) / 100,
        altitude: missionData.altitude || 50
      }
    );

    if (path && path.length > 0) {
      setFlightPath(path);
    }
  }, [missionData, selectedMissionType, simulationState.missionState]);

  // Commands
  const start = useCallback(() => {
    if (socket && missionData?.id) {
      console.log('Starting simulation for mission:', missionData.id, 'with pattern:', selectedMissionType);
      setSimulationState(prev => ({ ...prev, missionState: MissionState.IN_PROGRESS }));
      // Send the selected mission type to the backend
      socket.emit('simulation:start', {
        missionId: missionData.id,
        flightPattern: selectedMissionType
      });
    }
  }, [socket, missionData, selectedMissionType]);

  const pause = useCallback(() => {
    if (socket && missionData?.id) {
      setSimulationState(prev => ({ ...prev, missionState: MissionState.PAUSED }));
      socket.emit('simulation:pause', missionData.id);
    }
  }, [socket, missionData?.id]);

  const resume = useCallback(() => {
    if (socket && missionData?.id) {
      setSimulationState(prev => ({ ...prev, missionState: MissionState.IN_PROGRESS }));
      socket.emit('simulation:resume', missionData.id);
    }
  }, [socket, missionData?.id]);

  const stop = useCallback(() => {
    if (socket && missionData?.id) {
      setSimulationState(prev => ({ ...prev, missionState: MissionState.ABORTED }));
      socket.emit('simulation:stop', missionData.id);
    }
  }, [socket, missionData?.id]);

  const setSpeed = useCallback((speed) => {
    if (socket && missionData?.id) {
      setSimulationState(prev => ({ ...prev, targetSpeed: speed }));
      socket.emit('simulation:setSpeed', { missionId: missionData.id, speed });
    }
  }, [socket, missionData?.id]);

  const triggerRTH = useCallback(() => {
    if (socket && missionData?.id) {
      socket.emit('simulation:rth', missionData.id);
    }
  }, [socket, missionData?.id]);

  // Temporary: Generate path locally for checking valid area
  // (Ideally backend sends this too)
  const setMissionType = useCallback((type) => {
    setSelectedMissionType(type);
  }, []);

  return {
    ...simulationState,
    flightPath, // TODO: Get from backend start response?
    completedPath,
    rthPath,
    selectedMissionType,
    eta,
    formattedEta: eta, // Backend sends string formatted
    chargingStatus: { status: 'Normal', progress: simulationState.battery },
    canFly: isConnected,

    start,
    pause,
    resume,
    stop,
    reset: () => { }, // TODO
    triggerRTH,
    setSpeed,
    setMissionType,
    MissionType,
    DroneState,
    MissionState,
    SpeedPresets
  };
};

export default useFlightSimulation;
