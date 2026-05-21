import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import userStatusManager from '../utils/userStatusManager';

/**
 * User Status Display Component
 * Shows current user status (online, away, offline)
 */
export default function UserStatusDisplay() {
  const [status, setStatus] = useState(userStatusManager.getStatus());
  const [statusText, setStatusText] = useState(userStatusManager.getStatusText());
  const [statusEmoji, setStatusEmoji] = useState(userStatusManager.getStatusEmoji());

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = userStatusManager.onChange((newStatus) => {
      setStatus(newStatus);
      
      // Update based on new status
      const emoji = userStatusManager.getStatusEmoji();
      const text = userStatusManager.getStatusText();
      setStatusEmoji(emoji);
      setStatusText(text);
    });

    return unsubscribe;
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'away':
        return 'text-yellow-500';
      case 'offline':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        bg-slate-700/30 border border-slate-600/50
      `}
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`text-lg ${getStatusColor()}`}
      >
        {statusEmoji}
      </motion.span>
      <span className="text-xs text-slate-300">{statusText}</span>
    </motion.div>
  );
}
