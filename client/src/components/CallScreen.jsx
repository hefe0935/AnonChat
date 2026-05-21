import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CallQualityIndicator from './CallQualityIndicator';

const MicIcon = ({ muted }) => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    {muted && <path d="m3 3 18 18" />}
  </svg>
);

export default function CallScreen({ roomCode, remoteStream, onEndCall, callStats, rtcManager }) {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const durationIntervalRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    durationIntervalRef.current = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(durationIntervalRef.current);
  }, []);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((err) => console.error('Error playing remote audio:', err));
    }
  }, [remoteStream]);

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (rtcManager) rtcManager.toggleAudio(!newMutedState);
  };

  const formatDuration = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-screen p-3 md:p-5">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="h-full rounded-3xl border border-white/10 bg-black/30 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 text-center">
          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-28 h-28 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-slate-200 shadow-lg">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12" />
            </svg>
          </motion.div>

          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Voice Call Active</h2>
            <p className="text-slate-300">Live secure audio in session</p>
          </div>

          <div className="bg-black/35 border border-white/15 rounded-2xl px-8 py-4">
            <p className="text-white text-4xl font-mono font-bold">{formatDuration(callDuration)}</p>
          </div>

          <div className="bg-white/10 border border-white/15 px-5 py-2 rounded-full">
            <p className="text-white text-sm font-mono">Code: {roomCode}</p>
          </div>
        </div>

        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="bg-black/30 border-t border-white/10 px-5 py-6 md:px-7">
          <div className="flex items-center justify-center gap-5">
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} onClick={handleMuteToggle} className={`w-18 h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white ring-4 ring-red-300/60' : 'bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20'}`} title={isMuted ? 'Unmute' : 'Mute'}>
              <MicIcon muted={isMuted} />
            </motion.button>

            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} onClick={() => setShowStats(!showStats)} className="w-18 h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20" title="Toggle stats">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18" /><path d="M7 16v-5M12 16V8M17 16v-3" /></svg>
            </motion.button>

            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} onClick={onEndCall} className="w-18 h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-rose-500 hover:bg-rose-400 ring-4 ring-rose-300/40 text-white" title="End call">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72M14 4l6 6" /></svg>
            </motion.button>
          </div>

          {showStats && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-2xl mx-auto w-full space-y-4">
              <CallQualityIndicator stats={callStats} />
              {callStats && (
                <div className="bg-black/45 border border-white/10 rounded-xl p-4 text-white text-xs font-mono grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 mb-2">Audio In</p>
                    <p>Bytes: {callStats.audio?.inbound?.bytesReceived || 'N/A'}</p>
                    <p>Jitter: {callStats.audio?.inbound?.jitter?.toFixed(3) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-2">Audio Out</p>
                    <p>Bytes: {callStats.audio?.outbound?.bytesSent || 'N/A'}</p>
                    <p>Packets: {callStats.audio?.outbound?.packetsSent || 'N/A'}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <div className="bg-black/25 px-6 py-3 text-center text-xs text-slate-400 w-full border-t border-white/10">
          This voice call is not recorded. Ending the call disconnects and clears session data.
        </div>
      </div>
    </motion.div>
  );
}
