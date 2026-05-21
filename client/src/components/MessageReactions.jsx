import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Message Reactions Component
 * Allows users to react to messages with emojis
 * Shows reaction counts and who reacted
 */
export default function MessageReactions({ messageId, reactions = {}, onAddReaction, onRemoveReaction }) {
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState(null);

  const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '✨', '👏'];

  const handleReactionClick = (emoji) => {
    onAddReaction?.(messageId, emoji);
    setShowPicker(false);
  };

  const handleRemoveReaction = (emoji, e) => {
    e.stopPropagation();
    onRemoveReaction?.(messageId, emoji);
  };

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <div className="relative mt-2">
      <div className="flex flex-wrap items-center gap-1">
        {/* Show existing reactions */}
        <AnimatePresence>
          {Object.entries(reactions).map(([emoji, count]) => (
            <motion.button
              key={emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => handleRemoveReaction(emoji, event)}
              onMouseEnter={() => setHoveredReaction(emoji)}
              onMouseLeave={() => setHoveredReaction(null)}
              className="
                flex items-center gap-1 px-2 py-1 rounded-full
                bg-slate-700/50 hover:bg-slate-600/50 transition-all
                text-xs font-semibold text-slate-200
              "
              title="Click to remove your reaction"
            >
              <span>{emoji}</span>
              <span className="text-xs opacity-75">{count}</span>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Add reaction button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPicker(!showPicker)}
            className="
              p-1 rounded-full
              bg-slate-700/30 hover:bg-slate-600/50
              text-slate-400 hover:text-slate-200 transition-all
              text-lg leading-none
            "
            title="Add reaction"
          >
            😊
          </motion.button>

          {/* Reaction picker */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                className="
                  absolute bottom-full mb-2 left-0 z-50
                  bg-slate-800 border border-slate-700 rounded-lg
                  p-3 shadow-xl
                "
              >
                <div className="flex flex-wrap gap-1 w-max">
                  {QUICK_REACTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleReactionClick(emoji)}
                      className="
                        text-2xl cursor-pointer transition-transform
                        hover:bg-slate-700/50 rounded p-1
                      "
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">Click emoji to react</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
