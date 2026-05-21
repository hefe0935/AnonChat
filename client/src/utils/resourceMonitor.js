/**
 * Resource Monitor Manager
 * 
 * Features:
 * - Real-time CPU/Memory/GPU usage tracking (local only)
 * - Browser memory leak detector
 * - WebRTC resource consumption breakdown
 */

class ResourceMonitorManager {
  constructor() {
    this.metrics = {
      memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        history: []
      },
      cpu: {
        usage: 0,
        history: []
      },
      webrtc: {
        videoFramesDecoded: 0,
        audioBytes: 0,
        bandwidth: 0
      },
      memoryLeakWarnings: []
    };

    this.thresholds = {
      heapSizeWarning: 0.8, // 80% of max
      memoryGrowthRate: 5000000, // 5MB growth
      memoryLeakCheckInterval: 5000 // 5 seconds
    };

    this.memoryCheckInterval = null;
  }

  /**
   * Get memory usage stats
   */
  getMemoryStats() {
    if (performance.memory) {
      const memory = performance.memory;
      this.metrics.memory.usedJSHeapSize = memory.usedJSHeapSize;
      this.metrics.memory.totalJSHeapSize = memory.totalJSHeapSize;
      this.metrics.memory.jsHeapSizeLimit = memory.jsHeapSizeLimit;

      this.metrics.memory.history.push({
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize
      });

      // Keep only last 100 samples
      if (this.metrics.memory.history.length > 100) {
        this.metrics.memory.history.shift();
      }

      // Check for memory leaks
      this.checkForMemoryLeaks();

      return {
        usedMB: (memory.usedJSHeapSize / 1048576).toFixed(2),
        totalMB: (memory.totalJSHeapSize / 1048576).toFixed(2),
        limitMB: (memory.jsHeapSizeLimit / 1048576).toFixed(2),
        percentUsed: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1) + '%'
      };
    }
    return null;
  }

  /**
   * Detect memory leaks by analyzing growth patterns
   */
  checkForMemoryLeaks() {
    const history = this.metrics.memory.history;
    if (history.length < 10) return;

    // Get recent samples
    const recent = history.slice(-10);
    const older = history.slice(-20, -10);

    if (recent.length === 0 || older.length === 0) return;

    // Calculate average growth
    const recentAvg = recent.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / older.length;
    const growth = recentAvg - olderAvg;

    // Check if growth exceeds threshold
    if (growth > this.thresholds.memoryGrowthRate) {
      const warning = {
        type: 'memory_growth',
        growth: (growth / 1048576).toFixed(2) + ' MB',
        timestamp: Date.now(),
        severity: growth > this.thresholds.memoryGrowthRate * 2 ? 'high' : 'medium'
      };

      this.metrics.memoryLeakWarnings.push(warning);

      if (this.metrics.memoryLeakWarnings.length > 1) {
        console.warn('[ResourceMonitor] Possible memory leak detected:', warning);
      }

      // Keep only recent warnings
      if (this.metrics.memoryLeakWarnings.length > 10) {
        this.metrics.memoryLeakWarnings.shift();
      }
    }
  }

  /**
   * Get CPU usage estimation (browser doesn't expose true CPU)
   * This estimates based on task execution time
   */
  estimateCPUUsage() {
    const startTime = performance.now();

    // Run a small computational task
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += Math.sqrt(i);
    }

    const endTime = performance.now();
    const taskDuration = endTime - startTime;

    // Estimate based on task duration
    // This is a rough approximation
    const cpuUsage = Math.min(100, (taskDuration / 10) * 100);
    
    this.metrics.cpu.usage = cpuUsage;
    this.metrics.cpu.history.push({
      timestamp: Date.now(),
      usage: cpuUsage
    });

    if (this.metrics.cpu.history.length > 100) {
      this.metrics.cpu.history.shift();
    }

    return cpuUsage.toFixed(1) + '%';
  }

  /**
   * Track WebRTC resource consumption
   */
  trackWebRTCResources(stats) {
    if (!stats) return;

    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        this.metrics.webrtc.videoFramesDecoded = report.framesDecoded || 0;
      }
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        this.metrics.webrtc.audioBytes = report.bytesReceived || 0;
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        const currentBandwidth = report.availableOutgoingBitrate || 0;
        this.metrics.webrtc.bandwidth = (currentBandwidth / 1000000).toFixed(2) + ' Mbps';
      }
    });
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    this.memoryCheckInterval = setInterval(() => {
      this.getMemoryStats();
    }, this.thresholds.memoryLeakCheckInterval);

    console.log('[ResourceMonitor] Monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    console.log('[ResourceMonitor] Monitoring stopped');
  }

  /**
   * Get resource report
   */
  getReport() {
    return {
      timestamp: Date.now(),
      memory: this.getMemoryStats(),
      cpu: this.metrics.cpu.usage.toFixed(1) + '%',
      webrtc: this.metrics.webrtc,
      leaks: this.metrics.memoryLeakWarnings,
      status: this.getHealthStatus()
    };
  }

  /**
   * Get overall health status
   */
  getHealthStatus() {
    const memStats = this.getMemoryStats();
    if (!memStats) return 'unknown';

    const memPercent = parseFloat(memStats.percentUsed);
    if (memPercent > 90) return 'critical';
    if (memPercent > 80) return 'warning';
    if (this.metrics.memoryLeakWarnings.length > 0) return 'degraded';

    return 'healthy';
  }

  /**
   * Get memory usage history
   */
  getMemoryHistory() {
    return this.metrics.memory.history;
  }

  /**
   * Clear monitoring data
   */
  clear() {
    this.metrics.memoryLeakWarnings = [];
    this.metrics.memory.history = [];
    this.metrics.cpu.history = [];
  }
}

export const resourceMonitorManager = new ResourceMonitorManager();
