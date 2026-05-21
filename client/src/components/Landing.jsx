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
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"
    >
      <div className="backdrop-blur-md bg-white/10 rounded-2xl p-12 shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Anonymous Chat
          </h1>
          <p className="text-blue-100">
            Ephemeral, private, no accounts needed
          </p>
        </motion.div>

        {/* Your ID Badge */}
        <motion.div
          variants={itemVariants}
          className="bg-white/20 rounded-lg p-4 mb-8 border border-white/30"
        >
          <p className="text-xs text-blue-100 mb-2">Your Ephemeral ID</p>
          <p className="text-sm font-mono text-white break-all">{sessionId}</p>
          <p className="text-xs text-blue-100 mt-2">
            🗑️ Deleted when you close this app
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-400 rounded-lg p-3 mb-6 text-red-200 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Create Room Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateRoom}
          className="w-full bg-white text-purple-600 font-bold py-3 px-6 rounded-lg shadow-lg mb-4 hover:shadow-xl transition-shadow"
        >
          ✨ Create New Session
        </motion.button>

        {/* Divider */}
        <motion.div variants={itemVariants} className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-blue-100">or join one</span>
          </div>
        </motion.div>

        {/* Join Room Form */}
        <motion.div variants={itemVariants} className="space-y-3">
          <input
            type="text"
            placeholder="Enter session code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
            maxLength={8}
            className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white uppercase"
          />

          <button
            onClick={handleJoinRoom}
            disabled={isJoining}
            className="w-full bg-blue-500/80 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </button>
        </motion.div>

        {/* Privacy Badge */}
        <motion.div
          variants={itemVariants}
          className="mt-8 text-center text-xs text-blue-100"
        >
          <p>🛡️ No servers store your messages</p>
          <p>🎥 Recording protection enabled</p>
          <p>🗑️ All data auto-deleted</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
