import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { messageAutoDeleteManager, BURN_TIMER_PRESETS } from '../utils/messageAutoDelete';
import { messagePinningManager } from '../utils/messagePinning';

export default function MessageEnhancements({ messages, onMessageUpdate }) {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [burnTimers, setBurnTimers] = useState(new Map());
  const [selectedTimer, setSelectedTimer] = useState('medium'); // Default to 5 minutes

  // Setup burn timer display
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = new Map(burnTimers);
      
      messages.forEach(msg => {
        const remaining = messageAutoDeleteManager.getRemainingTime(msg.id);
        if (remaining !== null) {
          updatedTimers.set(msg.id, remaining);
        }
      });

      setBurnTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [messages]);

  const handleSetBurnTimer = (messageId, timerType) => {
    messageAutoDeleteManager.setTimer(
      messageId,
      timerType,
      (id) => {
        onMessageUpdate?.();
      }
    );
  };

  const handlePinMessage = (messageId, messageData) => {
    const pinned = messagePinningManager.isPinned(messageId);
    
    if (pinned) {
      messagePinningManager.unpinMessage(messageId);
    } else {
      messagePinningManager.pinMessage(messageId, messageData);
    }

    setPinnedMessages([...messagePinningManager.getPinnedMessages()]);
  };

  const handleBurnTimerSelect = (messageId) => {
    handleSetBurnTimer(messageId, selectedTimer);
  };

  const getCountdownDisplay = (messageId) => {
    const remaining = burnTimers.get(messageId);
    if (remaining === null || remaining === undefined) return null;

    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `⏱️ ${minutes}:${String(seconds).padStart(2, '0')}`;
    }
    return `⏱️ ${seconds}s`;
  };

  return (
    <div className="message-enhancements">
      {/* Pinned Messages Bar */}
      {pinnedMessages.length > 0 && (
        <div className="bg-gradient-to-r from-amber-900/50 to-amber-800/50 border-b border-amber-700/50 px-4 py-2 max-h-[150px] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-200 text-sm font-semibold">📌 Pinned Messages ({pinnedMessages.length})</span>
          </div>
          <AnimatePresence>
            {pinnedMessages.map((pinned) => (
              <motion.div
                key={pinned.messageId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-amber-700/30 border-l-2 border-amber-500 px-3 py-2 rounded text-amber-100 text-sm mb-1 flex justify-between items-start"
              >
                <div className="flex-1">
                  <p className="line-clamp-1">{pinned.content}</p>
                  <p className="text-xs text-amber-300/70 mt-0.5">
                    {new Date(pinned.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => handlePinMessage(pinned.messageId, pinned)}
                  className="text-amber-400 hover:text-amber-200 text-xs ml-2"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Burn Timer Controls */}
      <div className="burn-timer-controls px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex gap-2 items-center text-xs">
          <span className="text-slate-300">🔥 Burn timer:</span>
          <select
            value={selectedTimer}
            onChange={(e) => setSelectedTimer(e.target.value)}
            className="bg-slate-700 text-white text-xs px-2 py-1 rounded border border-slate-600"
          >
            <option value="immediate">1 second</option>
            <option value="quick">30 seconds</option>
            <option value="short">2 minutes</option>
            <option value="medium">5 minutes</option>
          </select>
          <span className="text-slate-400 text-xs ml-2">
            💡 Right-click messages to set burn timer
          </span>
        </div>
      </div>
    </div>
  );
}
