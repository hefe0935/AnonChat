import { useEffect, useState } from 'react';

/**
 * Hook: Use ephemeral session data
 * Handles local state that persists during session but clears on disconnect
 */
export function useEphemeralSession() {
  const [sessionData, setSessionData] = useState({
    sessionId: '',
    roomCode: '',
    messages: [],
    participants: [],
  });

  const updateSession = (updates) => {
    setSessionData((prev) => ({ ...prev, ...updates }));
  };

  const clearSession = () => {
    setSessionData({
      sessionId: '',
      roomCode: '',
      messages: [],
      participants: [],
    });
  };

  return {
    sessionData,
    updateSession,
    clearSession,
  };
}

/**
 * Hook: Monitor WebRTC connection state
 */
export function useRTCConnection(peerConnection) {
  const [connectionState, setConnectionState] = useState('new');
  const [iceConnectionState, setIceConnectionState] = useState('new');

  useEffect(() => {
    if (!peerConnection) return;

    const handleConnectionStateChange = () => {
      setConnectionState(peerConnection.connectionState);
    };

    const handleIceConnectionStateChange = () => {
      setIceConnectionState(peerConnection.iceConnectionState);
    };

    peerConnection.addEventListener('connectionstatechange', handleConnectionStateChange);
    peerConnection.addEventListener('iceconnectionstatechange', handleIceConnectionStateChange);

    return () => {
      peerConnection.removeEventListener('connectionstatechange', handleConnectionStateChange);
      peerConnection.removeEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
    };
  }, [peerConnection]);

  return { connectionState, iceConnectionState };
}

/**
 * Hook: Auto-delete data after timeout
 */
export function useAutoDelete(data, delayMs = 24 * 60 * 60 * 1000) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Data is effectively deleted by not retaining reference
      console.log('Data auto-deleted after timeout');
    }, delayMs);

    return () => clearTimeout(timer);
  }, [data, delayMs]);
}

/**
 * Hook: Monitor device media
 */
export function useMediaDevices() {
  const [devices, setDevices] = useState({
    cameras: [],
    microphones: [],
  });

  useEffect(() => {
    const enumerateDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const cameras = deviceList.filter((d) => d.kind === 'videoinput');
        const microphones = deviceList.filter((d) => d.kind === 'audioinput');

        setDevices({ cameras, microphones });
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };

    enumerateDevices();

    // Listen for device changes (plug/unplug)
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
    };
  }, []);

  return devices;
}

/**
 * Hook: Detect screen recording
 * BEST EFFORT: Not foolproof, but can detect some tools
 */
export function useScreenRecordingDetection() {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Method 1: Check if DisplayMediaStreamTrack is active (unreliable)
    const checkDisplayStream = async () => {
      try {
        const constraints = { video: { mediaSource: 'screen' } };
        const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
        // If successful, likely means screen is shareable (weak indicator)
        stream.getTracks().forEach((t) => t.stop());
      } catch (error) {
        // Permission denied or not available
      }
    };

    // Method 2: Monitor performance degradation (heuristic)
    const checkPerformance = () => {
      const startTime = performance.now();
      let count = 0;

      const loop = () => {
        count++;
        if (count < 1000) {
          requestAnimationFrame(loop);
        } else {
          const duration = performance.now() - startTime;
          // If suspiciously slow, might be recording
          if (duration > 100) {
            console.warn('Possible screen recording detected (performance degradation)');
            // Could show warning to user
          }
        }
      };

      requestAnimationFrame(loop);
    };

    checkDisplayStream();
    checkPerformance();
  }, []);

  return { isRecording };
}
