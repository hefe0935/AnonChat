import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../App';

export default function Landing({ onJoinRoom, onCreateRoom }) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { sessionId } = useContext(AppContext);

  const handleCreateRoom = async () => {
    setError('');
    try {
      await onCreateRoom();
    } catch (err) {
      setError(err.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    const code = joinCode.toUpperCase().trim();
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      setError('Invalid room code format (8 alphanumeric characters)');
      return;
    }

    setError('');
    setIsJoining(true);

    try {
      await onJoinRoom(code);
    } catch (err) {
      setError(err.message || 'Failed to join room');
      setIsJoining(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full h-screen flex items-center justify-center px-4 py-6">
      <div className="relative overflow-hidden backdrop-blur-2xl bg-slate-950/45 rounded-3xl p-10 shadow-[0_24px_80px_rgba(0,0,0,0.5)] max-w-lg w-full border border-white/15">
        <div className="pointer-events-none absolute -top-28 -right-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Anonymous Chat</h1>
          <p className="text-slate-300 text-sm">Private by default. No account, no profile, no history.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-black/25 rounded-xl p-4 mb-8 border border-white/15">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">Session Fingerprint</p>
          <p className="text-sm font-mono text-white break-all">{sessionId}</p>
          <p className="text-xs text-slate-400 mt-2">Temporary and cleared when the app closes</p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/15 border border-red-300/50 rounded-xl p-3 mb-6 text-red-100 text-sm">
            {error}
          </motion.div>
        )}

        <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreateRoom} className="w-full bg-slate-100 text-slate-900 font-bold py-3 px-6 rounded-xl shadow-lg mb-4 hover:bg-white transition-colors">
          Create New Session
        </motion.button>

        <motion.div variants={itemVariants} className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-transparent text-slate-300">or join with a code</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <input type="text" placeholder="Enter 8-character code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()} maxLength={8} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300/60 uppercase tracking-[0.12em] text-sm" />

          <button onClick={handleJoinRoom} disabled={isJoining} className="w-full bg-amber-300 text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isJoining ? 'Joining...' : 'Join Session'}
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8 text-center text-xs text-slate-400 space-y-1">
          <p>Messages stay transient in memory</p>
          <p>Screen capture deterrence is active</p>
          <p>Data is wiped on disconnect</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
