/**
 * Call Statistics Manager
 * Tracks call metrics: duration, quality, bitrate, network stats
 * Privacy-respecting: Stats are local-only, not persisted
 */

class CallStatsManager {
  constructor() {
    this.currentCall = null;
    this.callHistory = []; // Recent calls only, cleared on disconnect
    this.listeners = new Set();
    this.statsInterval = null;
  }

  /**
   * Start tracking a new call
   * @param {string} callId - Unique call ID
   * @param {Object} options - Call options (peer info, etc)
   */
  startCall(callId, options = {}) {
    this.currentCall = {
      id: callId,
      startTime: Date.now(),
      duration: 0,
      audioStats: {
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0,
        jitter: 0,
        audioLevel: 0
      },
      videoStats: {
        bytesReceived: 0,
        bytesSent: 0,
        framesDecoded: 0,
        framesEncoded: 0,
        frameRate: 0
      },
      connectionStats: {
        currentRoundTripTime: 0,
        availableOutgoingBitrate: 0,
        bytesReceived: 0,
        bytesSent: 0,
        consentCheck: true,
        connectionState: 'new'
      },
      quality: 'good', // good, fair, poor
      qualityHistory: [], // Track quality changes
      ...options
    };

    // Update duration every second
    this.statsInterval = setInterval(() => {
      if (this.currentCall) {
        this.currentCall.duration = Date.now() - this.currentCall.startTime;
        this.notify();
      }
    }, 1000);

    this.notify();
  }

  /**
   * Update audio statistics from WebRTC
   * @param {Object} stats - Audio stats from RTCPeerConnection
   */
  updateAudioStats(stats) {
    if (!this.currentCall) return;

    this.currentCall.audioStats = {
      bytesReceived: stats.bytesReceived || 0,
      bytesSent: stats.bytesSent || 0,
      packetsLost: stats.packetsLost || 0,
      jitter: stats.jitter || 0,
      audioLevel: stats.audioLevel || 0
    };

    this.updateQuality();
    this.notify();
  }

  /**
   * Update video statistics from WebRTC
   * @param {Object} stats - Video stats from RTCPeerConnection
   */
  updateVideoStats(stats) {
    if (!this.currentCall) return;

    this.currentCall.videoStats = {
      bytesReceived: stats.bytesReceived || 0,
      bytesSent: stats.bytesSent || 0,
      framesDecoded: stats.framesDecoded || 0,
      framesEncoded: stats.framesEncoded || 0,
      frameRate: stats.frameRate || 0
    };

    this.updateQuality();
    this.notify();
  }

  /**
   * Update connection statistics
   * @param {Object} stats - Connection stats from RTCPeerConnection
   */
  updateConnectionStats(stats) {
    if (!this.currentCall) return;

    this.currentCall.connectionStats = {
      currentRoundTripTime: stats.currentRoundTripTime || 0,
      availableOutgoingBitrate: stats.availableOutgoingBitrate || 0,
      bytesReceived: stats.bytesReceived || 0,
      bytesSent: stats.bytesSent || 0,
      consentCheck: stats.consentCheck !== false,
      connectionState: stats.connectionState || 'connected'
    };

    this.updateQuality();
    this.notify();
  }

  /**
   * Determine call quality based on current stats
   * Quality: good (RTT < 150ms, bitrate > 500kbps, loss < 1%)
   *          fair (RTT < 300ms, bitrate > 250kbps, loss < 3%)
   *          poor (RTT >= 300ms or bitrate < 250kbps or loss >= 3%)
   */
  updateQuality() {
    if (!this.currentCall) return;

    const stats = this.currentCall.connectionStats;
    const audioStats = this.currentCall.audioStats;

    const rtt = stats.currentRoundTripTime * 1000; // Convert to ms
    const bitrate = stats.availableOutgoingBitrate || 0;
    const bitrateMbps = bitrate / (1024 * 1024);
    const loss = audioStats.packetsLost || 0;

    let quality = 'poor';

    if (rtt < 150 && bitrateMbps > 0.5 && loss < 1) {
      quality = 'good';
    } else if (rtt < 300 && bitrateMbps > 0.25 && loss < 3) {
      quality = 'fair';
    }

    if (quality !== this.currentCall.quality) {
      this.currentCall.quality = quality;
      this.currentCall.qualityHistory.push({
        quality,
        timestamp: Date.now()
      });
      // Keep only last 100 quality changes
      if (this.currentCall.qualityHistory.length > 100) {
        this.currentCall.qualityHistory.shift();
      }
    }
  }

  /**
   * End current call and save to history
   */
  endCall() {
    if (!this.currentCall) return;

    clearInterval(this.statsInterval);

    // Store in history (privacy: auto-clear after 24 hours)
    this.callHistory.push({
      ...this.currentCall,
      endTime: Date.now()
    });

    // Keep only last 20 calls
    if (this.callHistory.length > 20) {
      this.callHistory.shift();
    }

    this.currentCall = null;
    this.notify();
  }

  /**
   * Get current call statistics
   */
  getCurrentStats() {
    return this.currentCall ? { ...this.currentCall } : null;
  }

  /**
   * Get formatted call duration
   */
  getFormattedDuration() {
    if (!this.currentCall) return '00:00:00';

    const seconds = Math.floor(this.currentCall.duration / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  }

  /**
   * Get quality emoji indicator
   */
  getQualityEmoji() {
    if (!this.currentCall) return '❓';
    switch (this.currentCall.quality) {
      case 'good':
        return '✅';
      case 'fair':
        return '⚠️';
      case 'poor':
        return '❌';
      default:
        return '❓';
    }
  }

  /**
   * Get average bitrate in Mbps
   */
  getAverageBitrate() {
    if (!this.currentCall) return 0;
    return (this.currentCall.connectionStats.availableOutgoingBitrate || 0) / (1024 * 1024);
  }

  /**
   * Get network latency (RTT) in ms
   */
  getLatency() {
    if (!this.currentCall) return 0;
    return Math.round(this.currentCall.connectionStats.currentRoundTripTime * 1000);
  }

  /**
   * Get packet loss percentage
   */
  getPacketLoss() {
    if (!this.currentCall) return 0;
    return this.currentCall.audioStats.packetsLost || 0;
  }

  /**
   * Subscribe to stat changes
   * @param {Function} callback - Called when stats update
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of changes
   */
  notify() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Call stats listener error:', error);
      }
    });
  }

  /**
   * Clear all history (privacy: on disconnect)
   */
  clear() {
    this.callHistory = [];
    this.currentCall = null;
    clearInterval(this.statsInterval);
    this.notify();
  }

  /**
   * Get call history
   * @returns {Array} Recent calls
   */
  getHistory() {
    return [...this.callHistory];
  }

  /**
   * Get debug info
   */
  getDebugInfo() {
    return {
      currentCall: this.currentCall,
      historyCount: this.callHistory.length,
      history: this.callHistory.slice(0, 5) // Last 5 calls
    };
  }
}

// Export singleton instance
export default new CallStatsManager();
