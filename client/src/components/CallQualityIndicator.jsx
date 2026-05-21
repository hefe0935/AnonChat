import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Call Quality Indicator Component
 * Shows real-time call statistics and quality metrics
 */
export default function CallQualityIndicator({ stats }) {
  const [qualityLevel, setQualityLevel] = useState('good');

  useEffect(() => {
    if (!stats) {
      setQualityLevel('unknown');
      return;
    }

    const { bitrate, latency, packetLoss } = stats;

    // Determine quality level based on metrics
    if (
      bitrate < 50 ||
      latency > 500 ||
      (packetLoss && packetLoss > 5)
    ) {
      setQualityLevel('poor');
    } else if (
      bitrate < 250 ||
      latency > 200 ||
      (packetLoss && packetLoss > 2)
    ) {
      setQualityLevel('fair');
    } else {
      setQualityLevel('good');
    }
  }, [stats]);

  const getQualityColor = () => {
    switch (qualityLevel) {
      case 'poor':
        return 'text-red-500';
      case 'fair':
        return 'text-yellow-500';
      case 'good':
        return 'text-green-500';
      default:
        return 'text-slate-400';
    }
  };

  const getQualityBg = () => {
    switch (qualityLevel) {
      case 'poor':
        return 'bg-red-500/10';
      case 'fair':
        return 'bg-yellow-500/10';
      case 'good':
        return 'bg-green-500/10';
      default:
        return 'bg-slate-500/10';
    }
  };

  const getQualityText = () => {
    switch (qualityLevel) {
      case 'poor':
        return 'Poor Connection';
      case 'fair':
        return 'Fair Connection';
      case 'good':
        return 'Good Connection';
      default:
        return 'Checking...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${getQualityBg()} border border-white/10 rounded-lg px-4 py-3 space-y-2`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className={`w-2 h-2 rounded-full ${
              qualityLevel === 'good'
                ? 'bg-green-500'
                : qualityLevel === 'fair'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
          />
          <span className={`text-sm font-semibold ${getQualityColor()}`}>
            {getQualityText()}
          </span>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
          <div>
            <span className="text-slate-400">Bitrate: </span>
            <span>{stats.bitrate || '0'} kbps</span>
          </div>
          <div>
            <span className="text-slate-400">Latency: </span>
            <span>{stats.latency || '0'} ms</span>
          </div>
          <div>
            <span className="text-slate-400">Loss: </span>
            <span>{stats.packetLoss ? stats.packetLoss.toFixed(2) : '0'}%</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
