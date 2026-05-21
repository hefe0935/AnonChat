import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import callStatsManager from '../utils/callStatsManager';

/**
 * Call Stats Dashboard Component
 * Shows real-time call quality, bitrate, latency, etc
 * Collapsible for minimal UI footprint
 */
export default function CallStatsDashboard({ isVisible = true }) {
  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      const currentStats = callStatsManager.getCurrentStats();
      setStats(currentStats);
    };

    updateStats();
    const unsubscribe = callStatsManager.onChange(updateStats);

    return unsubscribe;
  }, [isVisible]);

  if (!stats) return null;

  const quality = stats.quality || 'unknown';
  const emoji = callStatsManager.getQualityEmoji();
  const duration = callStatsManager.getFormattedDuration();
  const bitrate = callStatsManager.getAverageBitrate().toFixed(1);
  const latency = callStatsManager.getLatency();
  const loss = stats.audioStats.packetsLost || 0;

  const qualityColors = {
    good: 'from-green-500 to-green-600',
    fair: 'from-yellow-500 to-yellow-600',
    poor: 'from-red-500 to-red-600'
  };

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {/* Collapsed View */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className={`
          bg-gradient-to-r ${qualityColors[quality]}
          text-white font-bold py-2 px-4 rounded-full
          shadow-lg hover:shadow-xl transition-all
          flex items-center gap-2
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-xl">{emoji}</span>
        <span className="text-sm">{duration}</span>
      </motion.button>

      {/* Expanded View */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="
              absolute bottom-16 right-0 w-64 rounded-lg
              bg-slate-900 border border-slate-700 shadow-2xl
              p-4 space-y-3
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span className="text-2xl">{emoji}</span>
                Call Quality
              </h3>
              <button
                onClick={() => setExpanded(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Quality Status */}
            <div className={`
              px-3 py-2 rounded bg-gradient-to-r ${qualityColors[quality]}
              text-white font-semibold text-center capitalize
            `}>
              {quality.toUpperCase()}
            </div>

            {/* Duration */}
            <StatRow
              label="Duration"
              value={duration}
              icon="⏱️"
            />

            {/* Bitrate */}
            <StatRow
              label="Bitrate"
              value={`${bitrate} Mbps`}
              icon="📊"
              warning={bitrate < 0.5}
            />

            {/* Latency */}
            <StatRow
              label="Latency"
              value={`${latency} ms`}
              icon="📡"
              warning={latency > 150}
            />

            {/* Packet Loss */}
            <StatRow
              label="Packet Loss"
              value={`${loss} packets`}
              icon="📉"
              warning={loss > 5}
            />

            {/* Network Connection State */}
            <StatRow
              label="Connection"
              value={stats.connectionStats.connectionState}
              icon="🔗"
            />

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(false)}
              className="
                w-full mt-4 px-3 py-2 rounded
                bg-slate-700 hover:bg-slate-600
                text-slate-200 text-sm font-semibold
                transition-all
              "
            >
              Close
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Stat Row Component
 */
function StatRow({ label, value, icon = '📌', warning = false }) {
  return (
    <div className={`
      flex items-center justify-between px-3 py-2 rounded
      ${warning ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-slate-800/50'}
    `}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-slate-300 text-sm font-medium">{label}</span>
      </div>
      <span className={`
        text-sm font-bold
        ${warning ? 'text-orange-400' : 'text-slate-100'}
      `}>
        {value}
      </span>
    </div>
  );
}
