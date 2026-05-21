import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../App';
import CallQualityIndicator from './CallQualityIndicator';

export default function CallScreen({
  roomCode,
  remoteStream,
  localStream,
  onEndCall,
  callStats,
  rtcManager,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const durationIntervalRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Play remote stream through audio element
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      console.log('Attaching remote stream to audio element');
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((err) => {
        console.error('Error playing remote audio:', err);
      });
    }
  }, [remoteStream]);

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    // Actually mute/unmute the audio
    if (rtcManager) {
      rtcManager.toggleAudio(!newMutedState); // If muted, disable audio (pass false)
      console.log(newMutedState ? 'Muted' : 'Unmuted');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center"
    >
      {/* Hidden audio element for playing remote stream */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
      />

      {/* Voice Call Screen */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Speaker Icon */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-9xl"
        >
          🔊
        </motion.div>

        {/* Status */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Voice Call Active</h2>
          <p className="text-slate-300 text-lg">Connected to session</p>
        </div>

        {/* Duration */}
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl px-8 py-4">
          <p className="text-white text-4xl font-mono font-bold">
            {formatDuration(callDuration)}
          </p>
        </div>

        {/* Session Code Badge */}
        <div className="bg-black/30 backdrop-blur px-6 py-3 rounded-full">
          <p className="text-white text-sm font-mono">Code: {roomCode}</p>
        </div>
      </div>

      {/* Controls Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-black/30 backdrop-blur border-t border-white/10 px-6 py-8 w-full"
      >
        <div className="flex items-center justify-center gap-6">
          {/* Mute Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleMuteToggle}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all ${
              isMuted
                ? 'bg-red-500 ring-4 ring-red-400'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🎤'}
          </motion.button>

          {/* Stats Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowStats(!showStats)}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-gray-700 hover:bg-gray-600"
            title="Toggle stats"
          >
            📊
          </motion.button>

          {/* End Call Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEndCall}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-red-600 hover:bg-red-700 ring-4 ring-red-400/50"
            title="End call"
          >
            ☎️
          </motion.button>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-2xl mx-auto w-full space-y-4"
          >
            {/* Quality Indicator */}
            <CallQualityIndicator stats={callStats} />

            {/* Detailed Stats */}
            {callStats && (
              <div className="bg-black/50 rounded-lg p-4 text-white text-xs font-mono grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 mb-2">📥 Audio In</p>
                  <p>Bytes: {callStats.audio?.inbound?.bytesReceived || 'N/A'}</p>
                  <p>Jitter: {callStats.audio?.inbound?.jitter?.toFixed(3) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-2">📤 Audio Out</p>
                  <p>Bytes: {callStats.audio?.outbound?.bytesSent || 'N/A'}</p>
                  <p>Packets: {callStats.audio?.outbound?.packetsSent || 'N/A'}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Privacy Notice */}
      <div className="bg-black/30 px-6 py-3 text-center text-xs text-gray-400 w-full border-t border-white/10">
        🛡️ This voice call is not recorded. End call to disconnect and delete all data.
      </div>
    </motion.div>
  );
}
