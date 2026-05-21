import React, { useEffect, useState, useRef, createContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import Landing from './components/Landing';
import Chat from './components/Chat';
import CallScreen from './components/CallScreen';
import CallInvitation from './components/CallInvitation';
import AdvancedDiagnosticsPanel from './components/AdvancedDiagnosticsPanel';
import SettingsPanel from './components/SettingsPanel';
import SignalingClient from './utils/SignalingClient';
import RTCManager from './utils/RTCManager';
import screenshotBlocker from './utils/screenshotBlocker';
import { generateSessionId, generateRoomCode, generateCallId } from './utils/crypto';
import secureStorage from './utils/storage';
// Privacy & Security Features
import { memoryWipeManager } from './utils/memoryWipe';
import { sessionProtectionManager } from './utils/sessionProtection';
import { threatDetectionManager } from './utils/threatDetection';
import { screenMirrorDetectionManager } from './utils/screenMirrorDetection';
import { certificatePinningManager } from './utils/certificatePinning';
// Diagnostics & Monitoring
import { networkDiagnosticsManager } from './utils/networkDiagnostics';
import { latencyTrackerManager } from './utils/latencyTracker';
import { resourceMonitorManager } from './utils/resourceMonitor';
import { peerTrustScoreManager } from './utils/peerTrustScore';
import { qualityTimelineManager } from './utils/qualityTimeline';
// Enhanced Features
import { messageAutoDeleteManager } from './utils/messageAutoDelete';
import { messagePinningManager } from './utils/messagePinning';
import { rateLimiterManager } from './utils/rateLimiter';
import { zenModeManager } from './utils/zenMode';
import { audioTranscriptionManager } from './utils/audioTranscription';

/**
 * PRIVACY & ARCHITECTURE NOTES:
 * 
 * 1. All user data is ephemeral - generated locally, never stored
 * 2. Session IDs and room codes are discarded on disconnect
 * 3. Messages exist only in memory, never persisted
 * 4. WebRTC streams are never recorded (no MediaRecorder usage)
 * 5. On disconnect, all local data is cleared
 */

export const AppContext = createContext({
  sessionId: '',
  signalingClient: null,
});

function App() {
  const [screen, setScreen] = useState('landing'); // landing, chat, call
  const [sessionId] = useState(() => generateSessionId());
  const [roomCode, setRoomCode] = useState('');
  const [signalingClient] = useState(() => new SignalingClient('http://localhost:5000'));
  const [rtcManager] = useState(() => new RTCManager());
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStats, setCallStats] = useState(null);
  const [pendingCallOffer, setPendingCallOffer] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const statsIntervalRef = useRef(null);
  const [error, setError] = useState('');

  /**
   * Initialize screenshot blocker and signaling connection on app start
   */
  useEffect(() => {
    // Initialize privacy/security features
    screenshotBlocker.init();
    screenshotBlocker.addWatermark();
    
    // Initialize advanced security features
    sessionProtectionManager.injectSessionWatermark();
    screenMirrorDetectionManager.startMonitoring();
    resourceMonitorManager.startMonitoring();
    threatDetectionManager.trackConnection(sessionId, 'app-start');
    
    // Initialize diagnostics
    networkDiagnosticsManager.detectConnectionType();
    
    const initializeConnection = async () => {
      try {
        // Run protection checks
        const protectionChecks = await sessionProtectionManager.runFullCheck();
        console.log('[Security] Protection checks:', protectionChecks);

        await signalingClient.connect();
        console.log('Connected to signaling server');
        // Set signaling client on RTC manager for ICE candidate relay
        rtcManager.setSignalingClient(signalingClient);
      } catch (err) {
        setError('Failed to connect to server. Make sure it\'s running on port 5000.');
        console.error('Connection error:', err);
      }
    };

    initializeConnection();

    /**
     * PRIVACY: Cleanup on app close
     */
    return () => {
      cleanup();
    };
  }, [signalingClient, rtcManager, sessionId]);

  /**
   * Handle WebRTC events
   */
  useEffect(() => {
    rtcManager.onRemoteStream = (stream) => {
      setRemoteStream(stream);
    };

    rtcManager.onConnectionStateChange = (state) => {
      console.log('RTC connection state:', state);
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        handleEndCall();
      }
    };
  }, [rtcManager]);

  /**
   * Handle signaling messages
   */
  useEffect(() => {
    signalingClient.onOffer(async (data) => {
      try {
        console.log('Received offer');
        // If a peer connection is already active, ignore this offer
        if (rtcManager.isCallActive() || rtcManager.isInitialized) {
          console.log('Call already active, ignoring offer');
          return;
        }
        // Store the incoming offer data for user to accept
        setIncomingCallData(data);
        setPendingCallOffer(data.offer);
      } catch (err) {
        setError('Incoming call error: ' + err.message);
        console.error('Error receiving offer:', err);
      }
    });

    signalingClient.onAnswer(async (data) => {
      try {
        console.log('Received answer');
        if (!rtcManager.peerConnection) {
          console.warn('No peer connection to handle answer');
          return;
        }
        await rtcManager.handleAnswer(data.answer);
        // Switch to call screen when answer is received
        if (screen === 'chat') {
          setScreen('call');
          startStatsMonitoring();
        }
      } catch (err) {
        console.error('Error handling answer:', err);
        // Don't show error for stable state - it's expected
        if (!err.message.includes('stable')) {
          setError('Failed to handle answer');
        }
      }
    });

    signalingClient.onIceCandidate(async (data) => {
      try {
        if (rtcManager.peerConnection) {
          await rtcManager.addIceCandidate(data.candidate);
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });
  }, [signalingClient, rtcManager, screen]);

  /**
   * Create a new anonymous session
   */
  const handleCreateRoom = async () => {
    try {
      setError('');
      const code = generateRoomCode();
      const response = await signalingClient.createRoom(sessionId);
      setRoomCode(response.roomCode);
      setScreen('chat');
    } catch (err) {
      setError(err.message || 'Failed to create room');
      console.error(err);
    }
  };

  /**
   * Join an existing session
   */
  const handleJoinRoom = async (code) => {
    try {
      setError('');
      const response = await signalingClient.joinRoom(code, sessionId);
      setRoomCode(code);
      setScreen('chat');
    } catch (err) {
      setError(err.message || 'Failed to join room');
      console.error(err);
      throw err;
    }
  };

  /**
   * Initiate a voice/video call
   */
  const handleInitiateCall = async () => {
    try {
      setError('');
      console.log('User clicked Start Call');

      // If there's already a pending incoming call, just accept it instead of initiating
      if (pendingCallOffer) {
        console.log('Call invitation pending, accepting...');
        await handleAcceptCall();
        return;
      }

      // Check if peer connection already exists
      if (rtcManager.peerConnection) {
        setError('Call already in progress');
        return;
      }

      // Initialize WebRTC
      console.log('Initializing peer connection...');
      await rtcManager.initializePeerConnection(sessionId, roomCode);

      // Get local media (requests microphone permission)
      console.log('Requesting microphone access...');
      const stream = await rtcManager.getLocalMedia();
      setLocalStream(stream);
      console.log('Local media acquired, stream has', stream.getTracks().length, 'tracks');

      // Set up remote stream handler
      rtcManager.onRemoteStream = (stream) => {
        console.log('Setting remote stream');
        setRemoteStream(stream);
      };

      // Create offer and send to peer
      console.log('Creating and sending offer...');
      const offer = await rtcManager.createOffer();
      console.log('Offer created, sending to peer...');
      signalingClient.sendOffer(offer);

      // Switch to call screen and start monitoring stats
      setScreen('call');
      startStatsMonitoring();
      
      console.log('Waiting for answer...');
    } catch (err) {
      setError(err.message || 'Failed to initiate call');
      console.error('Error initiating call:', err);
      // Clean up if something went wrong
      if (rtcManager.peerConnection) {
        rtcManager.close();
      }
    }
  };

  /**
   * End call and cleanup
   */
  const handleEndCall = () => {
    stopStatsMonitoring();
    rtcManager.close();
    setLocalStream(null);
    setRemoteStream(null);
    setCallStats(null);
    setPendingCallOffer(null);
    setIncomingCallData(null);
    setScreen('chat');
  };

  /**
   * Accept incoming call invitation
   */
  const handleAcceptCall = async () => {
    try {
      setError('');
      console.log('User accepting call');
      
      if (!incomingCallData || !pendingCallOffer) {
        setError('Call data missing');
        return;
      }

      // Initialize peer connection if not already done
      if (!rtcManager.peerConnection) {
        console.log('Initializing peer connection for accepted call...');
        await rtcManager.initializePeerConnection(sessionId, incomingCallData.roomCode);

        // Request microphone permission and get local media
        console.log('Requesting microphone access...');
        const stream = await rtcManager.getLocalMedia();
        setLocalStream(stream);

        // Set up remote stream handler
        rtcManager.onRemoteStream = (stream) => {
          console.log('Setting remote stream for accepted call');
          setRemoteStream(stream);
        };
      }

      // Handle the offer and create answer
      console.log('Handling offer and creating answer...');
      const answer = await rtcManager.handleOffer(pendingCallOffer);
      signalingClient.sendAnswer(answer);

      // Clear pending call state and switch to call screen
      setPendingCallOffer(null);
      setIncomingCallData(null);
      setScreen('call');

      // Start stats monitoring
      startStatsMonitoring();
      console.log('Call accepted, switched to call screen');
    } catch (err) {
      setError(err.message || 'Failed to accept call');
      console.error('Error accepting call:', err);
      if (rtcManager.peerConnection) {
        rtcManager.close();
      }
    }
  };

  /**
   * Reject incoming call invitation
   */
  const handleRejectCall = () => {
    setPendingCallOffer(null);
    setIncomingCallData(null);
    // User stays on chat screen
  };

  /**
   * Leave room and return to landing
   */
  const handleLeaveRoom = () => {
    cleanup();
    setScreen('landing');
  };

  /**
   * Monitor WebRTC connection stats
   */
  const startStatsMonitoring = () => {
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);

    statsIntervalRef.current = setInterval(async () => {
      try {
        const stats = await rtcManager.getStats();
        setCallStats(stats);
      } catch (err) {
        console.error('Error getting stats:', err);
      }
    }, 1000);
  };

  const stopStatsMonitoring = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
  };

  /**
   * PRIVACY: Complete cleanup on disconnect
   * Stops all streams, closes connections, clears storage
   */
  const cleanup = () => {
    stopStatsMonitoring();
    rtcManager.close();
    setLocalStream(null);
    setRemoteStream(null);
    setCallStats(null);
    signalingClient.disconnect();
    secureStorage.clear();
    setRoomCode('');
    
    // Privacy: Perform full memory wipe on disconnect
    memoryWipeManager.performFullWipe();
    screenMirrorDetectionManager.stopMonitoring();
    resourceMonitorManager.stopMonitoring();
    audioTranscriptionManager.clearHistory();
    messageAutoDeleteManager.clearAll();
    messagePinningManager.clearAll();
    
    console.log('[Privacy] Full cleanup completed');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return (
    <AppContext.Provider value={{ sessionId, signalingClient }}>
      <AnimatePresence mode="wait">
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-4 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top-Center Controls */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3">
          <SettingsPanel />
          <AdvancedDiagnosticsPanel />
        </div>

        {screen === 'landing' && (
          <Landing
            key="landing"
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        )}

        {screen === 'chat' && (
          <Chat
            key="chat"
            roomCode={roomCode}
            onInitiateCall={handleInitiateCall}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {screen === 'call' && (
          <CallScreen
            key="call"
            roomCode={roomCode}
            localStream={localStream}
            remoteStream={remoteStream}
            onEndCall={handleEndCall}
            callStats={callStats}
            rtcManager={rtcManager}
          />
        )}

        {/* Call Invitation Overlay */}
        {pendingCallOffer && (
          <AnimatePresence>
            <CallInvitation
              onAccept={handleAcceptCall}
              onReject={handleRejectCall}
            />
          </AnimatePresence>
        )}
      </AnimatePresence>
    </AppContext.Provider>
  );
}

export default App;
