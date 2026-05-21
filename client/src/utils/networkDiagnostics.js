/**
 * Network Diagnostics Manager
 * 
 * Features:
 * - STUN/TURN server detection
 * - NAT traversal method identification
 * - Bandwidth capacity detection
 * - Latency variance tracking
 */

class NetworkDiagnosticsManager {
  constructor() {
    this.diagnostics = {
      stunServers: [],
      turnServers: [],
      natType: null,
      bandwidth: {
        upload: null,
        download: null
      },
      latency: {
        min: null,
        max: null,
        average: null,
        variance: null,
        samples: []
      },
      connectionType: null,
      mtu: null
    };
  }

  /**
   * Detect STUN/TURN servers in use
   */
  async detectSTUNTURNServers() {
    return new Promise((resolve) => {
      const servers = {
        stun: new Set(),
        turn: new Set()
      };

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] }
        ]
      });

      const ipRegex = /(?:([0-9]{1,3}(\.[0-9]{1,3}){3})|([a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}))/g;

      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate) {
          pc.close();
          resolve({
            stun: Array.from(servers.stun),
            turn: Array.from(servers.turn)
          });
          return;
        }

        const candidate = ice.candidate.candidate;
        const type = candidate.split(' ')[7];

        if (type === 'srflx') {
          servers.stun.add('stun_server_detected');
        } else if (type === 'relay') {
          servers.turn.add('turn_server_detected');
        }
      };

      pc.createDataChannel('');
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {});

      setTimeout(() => {
        pc.close();
        resolve({
          stun: Array.from(servers.stun),
          turn: Array.from(servers.turn)
        });
      }, 2000);
    });
  }

  /**
   * Detect NAT type using STUN
   */
  async detectNATType() {
    try {
      const pc = new RTCPeerConnection();
      let candidateIP = null;
      let candidateType = null;

      pc.onicecandidate = (ice) => {
        if (ice && ice.candidate) {
          const candidate = ice.candidate.candidate;
          const ipMatch = candidate.match(/\d+\.\d+\.\d+\.\d+/);
          const typeMatch = candidate.match(/\btyp\s+(\S+)/);

          if (ipMatch) candidateIP = ipMatch[0];
          if (typeMatch) candidateType = typeMatch[1];
        }
      };

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {});

      await new Promise(resolve => setTimeout(resolve, 2000));
      pc.close();

      // Determine NAT type based on candidate type
      if (candidateType === 'host') {
        this.diagnostics.natType = 'no_nat';
      } else if (candidateType === 'srflx') {
        this.diagnostics.natType = 'symmetric_nat';
      } else if (candidateType === 'relay') {
        this.diagnostics.natType = 'symmetric_nat_strict';
      } else {
        this.diagnostics.natType = 'unknown';
      }

      return { type: this.diagnostics.natType, ip: candidateIP };
    } catch (e) {
      console.error('[NetworkDiagnostics] NAT detection error:', e);
      return { type: 'unknown' };
    }
  }

  /**
   * Measure bandwidth (upload/download)
   */
  async measureBandwidth() {
    return new Promise((resolve) => {
      const testSize = 1000000; // 1MB
      const testData = new Array(testSize).fill('A').join('');
      const startTime = performance.now();

      // Simulate bandwidth test
      const worker = new Worker(URL.createObjectURL(new Blob([`
        const data = new Array(1000000).fill('A');
        self.postMessage({ done: true, size: data.length });
      `], { type: 'application/javascript' })));

      worker.onmessage = (e) => {
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const bandwidth = (testSize / 1024 / 1024) / duration; // MB/s

        this.diagnostics.bandwidth.download = bandwidth;
        this.diagnostics.bandwidth.upload = bandwidth;

        worker.terminate();
        resolve({
          upload: bandwidth.toFixed(2) + ' MB/s',
          download: bandwidth.toFixed(2) + ' MB/s'
        });
      };

      worker.postMessage({});

      // Timeout
      setTimeout(() => {
        worker.terminate();
        resolve({
          upload: 'timeout',
          download: 'timeout'
        });
      }, 5000);
    });
  }

  /**
   * Measure latency to server
   */
  async measureLatency(serverUrl = 'https://www.google.com') {
    const samples = [];
    const sampleCount = 5;

    for (let i = 0; i < sampleCount; i++) {
      const start = performance.now();
      try {
        await fetch(serverUrl, { method: 'HEAD', mode: 'no-cors' });
        const end = performance.now();
        const latency = end - start;
        samples.push(latency);
      } catch (e) {
        // Network error
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (samples.length > 0) {
      const min = Math.min(...samples);
      const max = Math.max(...samples);
      const average = samples.reduce((a, b) => a + b) / samples.length;
      const variance = samples.reduce((sum, s) => sum + Math.pow(s - average, 2), 0) / samples.length;

      this.diagnostics.latency = {
        min: min.toFixed(2) + ' ms',
        max: max.toFixed(2) + ' ms',
        average: average.toFixed(2) + ' ms',
        variance: variance.toFixed(2),
        samples
      };

      return this.diagnostics.latency;
    }

    return { error: 'No samples collected' };
  }

  /**
   * Detect connection type (WiFi, 4G, 5G, etc.)
   */
  async detectConnectionType() {
    try {
      if (navigator.connection) {
        const conn = navigator.connection;
        this.diagnostics.connectionType = {
          type: conn.type,
          effectiveType: conn.effectiveType,
          downlink: conn.downlink + ' Mbps',
          rtt: conn.rtt + ' ms',
          saveData: conn.saveData
        };
      }
    } catch (e) {
      console.error('[NetworkDiagnostics] Connection type detection error:', e);
    }

    return this.diagnostics.connectionType;
  }

  /**
   * Run full diagnostics
   */
  async runFullDiagnostics() {
    console.log('[NetworkDiagnostics] Starting full network diagnostics...');

    const results = {
      timestamp: Date.now(),
      checks: {}
    };

    // Check 1: STUN/TURN
    results.checks.servers = await this.detectSTUNTURNServers();

    // Check 2: NAT Type
    results.checks.nat = await this.detectNATType();

    // Check 3: Bandwidth
    results.checks.bandwidth = await this.measureBandwidth();

    // Check 4: Latency
    results.checks.latency = await this.measureLatency();

    // Check 5: Connection Type
    results.checks.connectionType = await this.detectConnectionType();

    console.log('[NetworkDiagnostics] Diagnostics complete:', results);
    return results;
  }

  /**
   * Get current diagnostics
   */
  getDiagnostics() {
    return this.diagnostics;
  }

  /**
   * Get network quality score (0-100)
   */
  getNetworkQualityScore() {
    let score = 100;

    // Penalize high latency
    if (this.diagnostics.latency.average) {
      const latency = parseFloat(this.diagnostics.latency.average);
      if (latency > 100) score -= 20;
      if (latency > 200) score -= 20;
    }

    // Penalize low bandwidth
    if (this.diagnostics.bandwidth.download) {
      const bandwidth = parseFloat(this.diagnostics.bandwidth.download);
      if (bandwidth < 1) score -= 30;
      if (bandwidth < 5) score -= 15;
    }

    // Check NAT type
    if (this.diagnostics.natType === 'symmetric_nat_strict') {
      score -= 25;
    }

    return Math.max(0, score);
  }
}

export const networkDiagnosticsManager = new NetworkDiagnosticsManager();
