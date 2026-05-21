/**
 * Latency Tracker Manager
 * 
 * Features:
 * - Message round-trip time measurement
 * - Voice packet latency distribution
 * - Bottleneck identification
 */

class LatencyTrackerManager {
  constructor() {
    this.messageLatencies = [];
    this.voiceLatencies = [];
    this.packetLatencies = [];
    this.thresholds = {
      goodLatency: 50,       // < 50ms is good
      acceptableLatency: 150, // < 150ms is acceptable
      poorLatency: 150       // > 150ms is poor
    };
  }

  /**
   * Track outgoing message latency
   * @param {string} messageId - Unique message identifier
   * @returns {string} - Unique tracking ID
   */
  startMessageTracking(messageId) {
    const trackingId = `msg_${messageId}_${Date.now()}`;
    
    this.messageLatencies.push({
      id: trackingId,
      messageId,
      sentTime: Date.now(),
      receivedTime: null,
      roundTripTime: null,
      status: 'pending'
    });

    return trackingId;
  }

  /**
   * Record message received time
   */
  recordMessageDelivery(trackingId) {
    const latencyEntry = this.messageLatencies.find(l => l.id === trackingId);
    
    if (latencyEntry) {
      latencyEntry.receivedTime = Date.now();
      latencyEntry.roundTripTime = latencyEntry.receivedTime - latencyEntry.sentTime;
      latencyEntry.status = 'completed';

      // Keep only last 100 messages
      if (this.messageLatencies.length > 100) {
        this.messageLatencies.shift();
      }
    }
  }

  /**
   * Track voice packet latency
   */
  trackVoicePacket(packetId, statistics) {
    const voiceLatency = {
      id: packetId,
      timestamp: Date.now(),
      roundTripTime: statistics.roundTripTime || 0,
      packetLoss: statistics.packetLoss || 0,
      jitter: statistics.jitter || 0,
      bitrate: statistics.bitrate || 0
    };

    this.voiceLatencies.push(voiceLatency);
    this.packetLatencies.push(voiceLatency);

    // Keep only last 1000 packets
    if (this.packetLatencies.length > 1000) {
      this.packetLatencies.shift();
    }

    if (this.voiceLatencies.length > 100) {
      this.voiceLatencies.shift();
    }
  }

  /**
   * Get message latency statistics
   */
  getMessageLatencyStats() {
    if (this.messageLatencies.length === 0) return null;

    const completed = this.messageLatencies.filter(l => l.status === 'completed');
    if (completed.length === 0) return null;

    const latencies = completed.map(l => l.roundTripTime);
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const avg = latencies.reduce((a, b) => a + b) / latencies.length;
    const variance = latencies.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / latencies.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: completed.length,
      minMs: min.toFixed(2),
      maxMs: max.toFixed(2),
      avgMs: avg.toFixed(2),
      stdDevMs: stdDev.toFixed(2),
      quality: this.getLatencyQuality(avg)
    };
  }

  /**
   * Get voice packet latency statistics
   */
  getVoiceLatencyStats() {
    if (this.voiceLatencies.length === 0) return null;

    const rttValues = this.voiceLatencies.map(v => v.roundTripTime);
    const packetLossValues = this.voiceLatencies.map(v => v.packetLoss);
    const jitterValues = this.voiceLatencies.map(v => v.jitter);

    const avgRTT = rttValues.reduce((a, b) => a + b) / rttValues.length;
    const avgPacketLoss = packetLossValues.reduce((a, b) => a + b) / packetLossValues.length;
    const avgJitter = jitterValues.reduce((a, b) => a + b) / jitterValues.length;

    return {
      count: this.voiceLatencies.length,
      avgRTTMs: avgRTT.toFixed(2),
      avgPacketLossPercent: avgPacketLoss.toFixed(2),
      avgJitterMs: avgJitter.toFixed(2),
      quality: this.getLatencyQuality(avgRTT)
    };
  }

  /**
   * Get latency distribution histogram
   */
  getLatencyDistribution(type = 'message') {
    const latencies = type === 'message' 
      ? this.messageLatencies.filter(l => l.status === 'completed').map(l => l.roundTripTime)
      : this.voiceLatencies.map(v => v.roundTripTime);

    if (latencies.length === 0) return null;

    // Create buckets: 0-50ms, 50-100ms, 100-150ms, 150-200ms, 200+ms
    const buckets = {
      '0-50ms': 0,
      '50-100ms': 0,
      '100-150ms': 0,
      '150-200ms': 0,
      '200+ms': 0
    };

    latencies.forEach(lat => {
      if (lat < 50) buckets['0-50ms']++;
      else if (lat < 100) buckets['50-100ms']++;
      else if (lat < 150) buckets['100-150ms']++;
      else if (lat < 200) buckets['150-200ms']++;
      else buckets['200+ms']++;
    });

    return buckets;
  }

  /**
   * Get quality assessment
   */
  getLatencyQuality(latencyMs) {
    if (latencyMs < this.thresholds.goodLatency) return 'excellent';
    if (latencyMs < this.thresholds.acceptableLatency) return 'good';
    return 'poor';
  }

  /**
   * Identify network bottlenecks
   */
  identifyBottlenecks() {
    const bottlenecks = [];

    const msgStats = this.getMessageLatencyStats();
    if (msgStats && parseFloat(msgStats.avgMs) > 200) {
      bottlenecks.push({
        type: 'high_message_latency',
        severity: 'medium',
        value: msgStats.avgMs + 'ms',
        suggestion: 'Network congestion or distant server'
      });
    }

    const voiceStats = this.getVoiceLatencyStats();
    if (voiceStats) {
      if (parseFloat(voiceStats.avgRTTMs) > 150) {
        bottlenecks.push({
          type: 'high_voice_rtt',
          severity: 'medium',
          value: voiceStats.avgRTTMs + 'ms',
          suggestion: 'Audio quality may be degraded'
        });
      }

      if (parseFloat(voiceStats.avgPacketLossPercent) > 2) {
        bottlenecks.push({
          type: 'packet_loss',
          severity: 'high',
          value: voiceStats.avgPacketLossPercent + '%',
          suggestion: 'Network reliability issues'
        });
      }

      if (parseFloat(voiceStats.avgJitterMs) > 50) {
        bottlenecks.push({
          type: 'high_jitter',
          severity: 'medium',
          value: voiceStats.avgJitterMs + 'ms',
          suggestion: 'Inconsistent network conditions'
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Get latency trend
   */
  getLatencyTrend(type = 'message', window = 10) {
    const latencies = type === 'message'
      ? this.messageLatencies.filter(l => l.status === 'completed').slice(-window).map(l => l.roundTripTime)
      : this.voiceLatencies.slice(-window).map(v => v.roundTripTime);

    if (latencies.length < 2) return null;

    const first = latencies.slice(0, Math.floor(latencies.length / 2));
    const last = latencies.slice(Math.floor(latencies.length / 2));

    const firstAvg = first.reduce((a, b) => a + b) / first.length;
    const lastAvg = last.reduce((a, b) => a + b) / last.length;
    const trend = lastAvg > firstAvg ? 'degrading' : 'improving';
    const change = Math.abs(lastAvg - firstAvg).toFixed(2);

    return {
      trend,
      changeMs: change,
      direction: trend === 'degrading' ? '↑' : '↓'
    };
  }

  /**
   * Get comprehensive latency report
   */
  getReport() {
    return {
      timestamp: Date.now(),
      messageLatency: this.getMessageLatencyStats(),
      voiceLatency: this.getVoiceLatencyStats(),
      messageDistribution: this.getLatencyDistribution('message'),
      voiceDistribution: this.getLatencyDistribution('voice'),
      bottlenecks: this.identifyBottlenecks(),
      trend: this.getLatencyTrend()
    };
  }

  /**
   * Clear latency data
   */
  clear() {
    this.messageLatencies = [];
    this.voiceLatencies = [];
    this.packetLatencies = [];
  }
}

export const latencyTrackerManager = new LatencyTrackerManager();
