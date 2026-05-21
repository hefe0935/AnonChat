import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { networkDiagnosticsManager } from '../utils/networkDiagnostics';
import { latencyTrackerManager } from '../utils/latencyTracker';
import { resourceMonitorManager } from '../utils/resourceMonitor';
import { peerTrustScoreManager } from '../utils/peerTrustScore';
import { qualityTimelineManager } from '../utils/qualityTimeline';

export default function AdvancedDiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('network');
  const [loading, setLoading] = useState(false);

  const handleRunDiagnostics = async () => {
    setLoading(true);
    try {
      const results = await networkDiagnosticsManager.runFullDiagnostics();
      setDiagnostics(results);
    } catch (e) {
      console.error('Diagnostics error:', e);
    }
    setLoading(false);
  };

  const getNetworkQualityScore = () => {
    return networkDiagnosticsManager.getNetworkQualityScore();
  };

  const getResourceStatus = () => {
    return resourceMonitorManager.getReport();
  };

  const getLatencyReport = () => {
    return latencyTrackerManager.getReport();
  };

  const getQualityReport = () => {
    return qualityTimelineManager.getReport();
  };

  return (
    <motion.div className="relative inline-block">
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full p-3 shadow-lg mb-3 hover:shadow-xl transition-shadow"
        title="Advanced Diagnostics (🔍)"
      >
        🔍
      </motion.button>

      {/* Diagnostics Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute top-12 left-1/2 transform -translate-x-1/2 mt-2 bg-slate-900 border border-purple-500/30 rounded-xl shadow-2xl w-96 max-h-[600px] flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex justify-between items-center">
              <h3 className="text-white font-bold">🔍 Advanced Diagnostics</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-purple-500/20 px-4 pt-3">
              {['network', 'latency', 'resources', 'quality', 'trust'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'text-purple-400 border-purple-400'
                      : 'text-slate-400 border-transparent hover:text-slate-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {activeTab === 'network' && (
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRunDiagnostics}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs py-2 rounded font-semibold"
                  >
                    {loading ? '⏳ Running...' : '▶ Run Network Diagnostics'}
                  </motion.button>

                  {diagnostics && (
                    <div className="bg-slate-800/50 rounded p-2 text-xs space-y-1">
                      <p className="text-purple-300">
                        <strong>Quality Score:</strong> {getNetworkQualityScore()}/100
                      </p>
                      {diagnostics.checks?.nat && (
                        <p className="text-slate-300">
                          <strong>NAT Type:</strong> {diagnostics.checks.nat.type}
                        </p>
                      )}
                      {diagnostics.checks?.bandwidth && (
                        <p className="text-slate-300">
                          <strong>Bandwidth:</strong> {diagnostics.checks.bandwidth.download}
                        </p>
                      )}
                      {diagnostics.checks?.latency && (
                        <p className="text-slate-300">
                          <strong>Latency:</strong> {diagnostics.checks.latency.average}
                        </p>
                      )}
                      {diagnostics.checks?.connectionType && (
                        <p className="text-slate-300">
                          <strong>Type:</strong> {diagnostics.checks.connectionType.effectiveType}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'latency' && (
                <div className="space-y-2">
                  {(() => {
                    const report = getLatencyReport();
                    return (
                      <div className="bg-slate-800/50 rounded p-2 text-xs space-y-1">
                        {report?.messageLatency && (
                          <>
                            <p className="text-purple-300 font-semibold">Messages</p>
                            <p className="text-slate-300">Avg: {report.messageLatency.avgMs}ms</p>
                            <p className="text-slate-300">Min: {report.messageLatency.minMs}ms</p>
                            <p className="text-slate-300">Max: {report.messageLatency.maxMs}ms</p>
                          </>
                        )}
                        {report?.voiceLatency && (
                          <>
                            <p className="text-purple-300 font-semibold mt-2">Voice</p>
                            <p className="text-slate-300">RTT: {report.voiceLatency.avgRTTMs}ms</p>
                            <p className="text-slate-300">Loss: {report.voiceLatency.avgPacketLossPercent}%</p>
                            <p className="text-slate-300">Jitter: {report.voiceLatency.avgJitterMs}ms</p>
                          </>
                        )}
                        {report?.bottlenecks?.length > 0 && (
                          <div className="mt-2 p-1 bg-red-900/30 rounded border border-red-700/50">
                            <p className="text-red-300 font-semibold text-xs">⚠ Bottlenecks:</p>
                            {report.bottlenecks.map((bn, i) => (
                              <p key={i} className="text-red-200 text-xs">{bn.type}: {bn.suggestion}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-2">
                  {(() => {
                    const report = getResourceStatus();
                    return (
                      <div className="bg-slate-800/50 rounded p-2 text-xs space-y-1">
                        {report?.memory && (
                          <>
                            <p className="text-purple-300 font-semibold">Memory</p>
                            <p className="text-slate-300">Used: {report.memory.usedMB}MB / {report.memory.limitMB}MB</p>
                            <p className={`font-semibold ${
                              parseFloat(report.memory.percentUsed) > 80 ? 'text-red-300' : 'text-green-300'
                            }`}>
                              {report.memory.percentUsed} used
                            </p>
                          </>
                        )}
                        <p className="text-slate-300">
                          <strong>Status:</strong> {report?.status}
                        </p>
                        {report?.leaks?.length > 0 && (
                          <div className="mt-1 p-1 bg-yellow-900/30 rounded border border-yellow-700/50">
                            <p className="text-yellow-300 text-xs font-semibold">⚠ Memory Warnings:</p>
                            {report.leaks.slice(0, 2).map((leak, i) => (
                              <p key={i} className="text-yellow-200 text-xs">{leak.type}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'quality' && (
                <div className="space-y-2">
                  {(() => {
                    const report = getQualityReport();
                    return (
                      <div className="bg-slate-800/50 rounded p-2 text-xs space-y-1">
                        {report?.stats5min && (
                          <>
                            <p className="text-purple-300 font-semibold">5 Minute Stats</p>
                            <p className="text-slate-300">Bitrate: {report.stats5min.avgBitrate}</p>
                            <p className="text-slate-300">RTT: {report.stats5min.avgRTT}</p>
                            <p className="text-slate-300">Packet Loss: {report.stats5min.avgPacketLoss}</p>
                            <p className="text-slate-300">
                              Quality: Good {report.stats5min.qualityDistribution.good}
                            </p>
                          </>
                        )}
                        {report?.patterns?.length > 0 && (
                          <div className="mt-2 p-1 bg-orange-900/30 rounded border border-orange-700/50">
                            <p className="text-orange-300 font-semibold text-xs">🔍 Patterns:</p>
                            {report.patterns.map((p, i) => (
                              <p key={i} className="text-orange-200 text-xs">{p.type}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'trust' && (
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs">
                    Peer trust scores are calculated based on:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>✓ Connection stability (30%)</li>
                    <li>✓ Message response time (20%)</li>
                    <li>✓ Call completion rate (30%)</li>
                    <li>✓ Interaction history (20%)</li>
                  </ul>
                  <p className="text-slate-400 text-xs mt-2 italic">
                    Track peer reliability with real-time scoring
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-purple-500/20 px-4 py-2 bg-slate-800/30">
              <p className="text-xs text-slate-400">
                ✓ All diagnostics run locally • No data sent to server
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
