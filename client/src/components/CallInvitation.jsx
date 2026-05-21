import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ringtoneManager from '../utils/ringtoneManager';

export default function CallInvitation({ onAccept, onReject }) {
  useEffect(() => {
    ringtoneManager.ring();
    return () => {
      ringtoneManager.stopRingtone();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 backdrop-blur-md px-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative overflow-hidden bg-slate-950/90 rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_90px_rgba(0,0,0,0.55)] border border-white/15"
      >
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />

        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72" />
            </svg>
          </motion.div>
        </div>

        <h2 className="text-2xl font-extrabold text-white text-center mb-2">Incoming Call</h2>
        <p className="text-slate-300 text-center mb-6">A participant wants to start voice chat</p>

        <p className="text-xs text-slate-400 text-center mb-6 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          Keep your microphone ready before accepting.
        </p>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReject}
            className="flex-1 bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20 font-bold py-3 px-5 rounded-xl transition-all"
          >
            Decline
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAccept}
            className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold py-3 px-5 rounded-xl transition-all"
          >
            Accept
          </motion.button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-6">Private call. No recording by default.</p>
      </motion.div>
    </motion.div>
  );
}
