import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ringtoneManager from '../utils/ringtoneManager';

export default function CallInvitation({ onAccept, onReject }) {
  useEffect(() => {
    // Play ringtone when invitation appears
    ringtoneManager.ring();

    // Stop ringtone on cleanup
    return () => {
      ringtoneManager.stopRingtone();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-white/10"
      >
        {/* Incoming Call Animation */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-6xl"
          >
            📞
          </motion.div>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Incoming Call
        </h2>
        <p className="text-slate-400 text-center mb-8">
          Someone wants to talk with you
        </p>

        {/* Note about permissions */}
        <p className="text-xs text-slate-500 text-center mb-6 bg-slate-800/50 px-4 py-2 rounded-lg">
          💬 Please have your microphone ready
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReject}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 font-bold py-3 px-6 rounded-lg transition-all"
          >
            ❌ Decline
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAccept}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
          >
            ✅ Accept
          </motion.button>
        </div>

        {/* Privacy notice */}
        <p className="text-xs text-slate-500 text-center mt-6">
          🔒 This call is private and not recorded
        </p>
      </motion.div>
    </motion.div>
  );
}
