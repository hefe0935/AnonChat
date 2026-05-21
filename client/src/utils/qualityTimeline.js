  /**
 * Connection Quality Timeline Manager
 * 
 * Features:
 * - Historical graph of connection quality
 * - Connection drop detection
 * - Network pattern identification
 */

class QualityTimelineManager {
  constructor() {
    this.qualitySnapshots = [];
    this.dropEvents = [];
    this.patterns = [];
    this.maxSnapshots = 500; // Store ~8 hours at 1 sample/minute
  }

  /**
   * Record quality snapshot
   */
  recordQualitySnapshot(quality) {
    const snapshot = {
      timestamp: Date.now(),
      bitrate: quality.bitrate || 0,
      packetsLost: quality.packetsLost || 0,
      packetLossPercent: quality.packetLossPercent || 0,
      rtt: quality.rtt || 0,
      jitter: quality.jitter || 0,
      audioLevel: quality.audioLevel || 0,
      quality: this.calculateQualityLevel(quality)
    };

    this.qualitySnapshots.push(snapshot);

    // Keep max snapshots
    if (this.qualitySnapshots.length > this.maxSnapshots) {
      this.qualitySnapshots.shift();
    }

    // Check for quality drops
    this.detectDrops();
  }

  /**
   * Calculate quality level (Good/Fair/Poor)
   */
  calculateQualityLevel(quality) {
    let score = 100;

    // Penalize based on metrics
    if (quality.packetsLost > 10) score -= 30;
    else if (quality.packetsLost > 5) score -= 20;
    else if (quality.packetsLost > 0) score -= 10;

    if (quality.rtt > 200) score -= 20;
    else if (quality.rtt > 100) score -= 10;

    if (quality.jitter > 50) score -= 15;
    else if (quality.jitter > 30) score -= 10;

    if (quality.bitrate < 1000000) score -= 20; // < 1 Mbps

    if (score >= 75) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Detect quality drops
   */
  detectDrops() {
    if (this.qualitySnapshots.length < 2) return;

    const current = this.qualitySnapshots[this.qualitySnapshots.length - 1];
    const previous = this.qualitySnapshots[this.qualitySnapshots.length - 2];

    // Detect packet loss spike
    if (current.packetsLost > previous.packetsLost + 5) {
      this.recordDropEvent('packet_loss_spike', {
        previous: previous.packetsLost,
        current: current.packetsLost
      });
    }

    // Detect latency spike
    if (current.rtt > previous.rtt * 2 && previous.rtt > 0) {
      this.recordDropEvent('latency_spike', {
        previous: previous.rtt,
        current: current.rtt
      });
    }

    // Detect quality degradation
    if (current.quality !== previous.quality && 
        (previous.quality === 'good' && current.quality !== 'good')) {
      this.recordDropEvent('quality_degradation', {
        from: previous.quality,
        to: current.quality
      });
    }
  }

  /**
   * Record drop event
   */
  recordDropEvent(type, details) {
    const event = {
      timestamp: Date.now(),
      type,
      details,
      recovery: null
    };

    this.dropEvents.push(event);

    // Keep only last 100 events
    if (this.dropEvents.length > 100) {
      this.dropEvents.shift();
    }

    console.warn('[QualityTimeline] Connection drop detected:', event);
  }

  /**
   * Get quality statistics over time period
   */
  getQualityStats(windowMs = 300000) { // Default 5 minutes
    const now = Date.now();
    const relevant = this.qualitySnapshots.filter(s => now - s.timestamp <= windowMs);

    if (relevant.length === 0) return null;

    const bitrates = relevant.map(s => s.bitrate);
    const packetLosses = relevant.map(s => s.packetsLost);
    const rtts = relevant.map(s => s.rtt);
    const jitters = relevant.map(s => s.jitter);

    const qualityCounts = {
      good: relevant.filter(s => s.quality === 'good').length,
      fair: relevant.filter(s => s.quality === 'fair').length,
      poor: relevant.filter(s => s.quality === 'poor').length
    };

    return {
      timeWindow: (windowMs / 60000).toFixed(1) + ' min',
      sampleCount: relevant.length,
      avgBitrate: (bitrates.reduce((a, b) => a + b) / bitrates.length / 1000000).toFixed(2) + ' Mbps',
      avgPacketLoss: (packetLosses.reduce((a, b) => a + b) / packetLosses.length).toFixed(1),
      avgRTT: (rtts.reduce((a, b) => a + b) / rtts.length).toFixed(0) + ' ms',
      avgJitter: (jitters.reduce((a, b) => a + b) / jitters.length).toFixed(0) + ' ms',
      qualityDistribution: {
        good: ((qualityCounts.good / relevant.length) * 100).toFixed(1) + '%',
        fair: ((qualityCounts.fair / relevant.length) * 100).toFixed(1) + '%',
        poor: ((qualityCounts.poor / relevant.length) * 100).toFixed(1) + '%'
      }
    };
  }

  /**
   * Get quality timeline for graphing
   */
  getQualityTimeline(pointCount = 60) {
    if (this.qualitySnapshots.length === 0) return [];

    // Reduce snapshots to fit graph
    const step = Math.max(1, Math.floor(this.qualitySnapshots.length / pointCount));
    const timeline = [];

    for (let i = 0; i < this.qualitySnapshots.length; i += step) {
      const snapshot = this.qualitySnapshots[i];
      timeline.push({
        timestamp: snapshot.timestamp,
        time: new Date(snapshot.timestamp).toLocaleTimeString(),
        quality: snapshot.quality,
        bitrate: (snapshot.bitrate / 1000000).toFixed(1),
        packetLoss: snapshot.packetLossPercent.toFixed(1),
        rtt: snapshot.rtt
      });
    }

    return timeline;
  }

  /**
   * Identify network patterns
   */
  analyzePatterns() {
    const patterns = [];

    // Pattern 1: Periodic drops
    if (this.dropEvents.length >= 3) {
      const dropIntervals = [];
      for (let i = 1; i < this.dropEvents.length; i++) {
        dropIntervals.push(this.dropEvents[i].timestamp - this.dropEvents[i - 1].timestamp);
      }

      const avgInterval = dropIntervals.reduce((a, b) => a + b) / dropIntervals.length;
      const regularityScore = this.calculateRegularity(dropIntervals);

      if (regularityScore > 0.8 && avgInterval < 300000) { // Regular and frequent
        patterns.push({
          type: 'periodic_drops',
          severity: 'medium',
          interval: (avgInterval / 1000).toFixed(0) + ' seconds',
          suggestion: 'Check for interference or network contention'
        });
      }
    }

    // Pattern 2: Degrading quality
    if (this.qualitySnapshots.length >= 10) {
      const recent = this.qualitySnapshots.slice(-10);
      const poorQuality = recent.filter(s => s.quality === 'poor').length;

      if (poorQuality >= 7) {
        patterns.push({
          type: 'consistent_poor_quality',
          severity: 'high',
          affectedSamples: poorQuality + '/10',
          suggestion: 'Network conditions may be degraded'
        });
      }
    }

    // Pattern 3: Jitter issues
    if (this.qualitySnapshots.length >= 5) {
      const recent = this.qualitySnapshots.slice(-5);
      const avgJitter = recent.reduce((sum, s) => sum + s.jitter, 0) / recent.length;

      if (avgJitter > 100) {
        patterns.push({
          type: 'high_jitter',
          severity: 'medium',
          avgJitterMs: avgJitter.toFixed(0),
          suggestion: 'Inconsistent network conditions detected'
        });
      }
    }

    this.patterns = patterns;
    return patterns;
  }

  /**
   * Calculate regularity of events (0-1)
   */
  calculateRegularity(intervals) {
    if (intervals.length < 2) return 0;

    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Lower std dev = higher regularity
    const regularity = 1 - Math.min(1, stdDev / avgInterval);
    return regularity;
  }

  /**
   * Get drop event history
   */
  getDropHistory(limit = 20) {
    return this.dropEvents.slice(-limit).reverse();
  }

  /**
   * Estimate recovery time from last drop
   */
  getRecoveryTime() {
    if (this.dropEvents.length === 0) return null;

    const lastDrop = this.dropEvents[this.dropEvents.length - 1];
    if (!this.qualitySnapshots.length) return null;

    // Find when quality returned to good
    const afterDrop = this.qualitySnapshots.filter(s => s.timestamp > lastDrop.timestamp);
    for (const snapshot of afterDrop) {
      if (snapshot.quality === 'good') {
        return {
          recoveryMs: snapshot.timestamp - lastDrop.timestamp,
          recoverySeconds: ((snapshot.timestamp - lastDrop.timestamp) / 1000).toFixed(1)
        };
      }
    }

    return null; // Still recovering or not recovered yet
  }

  /**
   * Get comprehensive quality report
   */
  getReport() {
    return {
      timestamp: Date.now(),
      stats1min: this.getQualityStats(60000),
      stats5min: this.getQualityStats(300000),
      stats30min: this.getQualityStats(1800000),
      timeline: this.getQualityTimeline(),
      dropEvents: this.getDropHistory(),
      patterns: this.analyzePatterns(),
      currentQuality: this.qualitySnapshots.length > 0 
        ? this.qualitySnapshots[this.qualitySnapshots.length - 1].quality
        : null
    };
  }

  /**
   * Clear timeline
   */
  clear() {
    this.qualitySnapshots = [];
    this.dropEvents = [];
    this.patterns = [];
  }
}

export const qualityTimelineManager = new QualityTimelineManager();
