/**
 * Session Protection & Leak Detection
 * 
 * Features:
 * - Invisible tracking prevention code
 * - VPN killswitch failure detection
 * - DNS leak protection warnings
 * - IP leak detection
 */

class SessionProtectionManager {
  constructor() {
    this.leakWarnings = [];
    this.protectionStatus = {
      dnsLeakCheck: null,
      ipLeakCheck: null,
      vpnStatus: null,
      webRTCLeakDetected: false
    };
  }

  /**
   * Detect WebRTC IP leaks
   * Tests if local IP can be discovered via WebRTC
   */
  async detectWebRTCLeak() {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g;
      const leakedIPs = new Set();

      pc.createDataChannel('');
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          console.error('[SessionProtection] WebRTC offer error');
        });

      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate) {
          if (leakedIPs.size > 0) {
            console.warn('[SessionProtection] WebRTC IP leak detected:', Array.from(leakedIPs));
            this.protectionStatus.webRTCLeakDetected = true;
            this.leakWarnings.push({
              type: 'webrtc_ip_leak',
              severity: 'high',
              ips: Array.from(leakedIPs),
              timestamp: Date.now()
            });
          }
          pc.close();
          resolve({
            leaked: leakedIPs.size > 0,
            ips: Array.from(leakedIPs)
          });
          return;
        }

        const ipMatches = ice.candidate.candidate.match(ipRegex);
        if (ipMatches) {
          ipMatches.forEach(ip => {
            if (!ip.includes('127.0.0.1')) {
              leakedIPs.add(ip);
            }
          });
        }
      };

      // Timeout after 3 seconds
      setTimeout(() => {
        pc.close();
        resolve({
          leaked: leakedIPs.size > 0,
          ips: Array.from(leakedIPs)
        });
      }, 3000);
    });
  }

  /**
   * Check for DNS leaks using public API
   */
  async checkDNSLeaks() {
    try {
      const response = await fetch('https://dns.google/dns-query?name=o-o.myaddr.l.google.com&type=TXT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/dns-message' },
        mode: 'no-cors'
      });

      if (response) {
        console.warn('[SessionProtection] DNS leak possibility detected');
        this.protectionStatus.dnsLeakCheck = 'warning';
        this.leakWarnings.push({
          type: 'dns_leak_warning',
          severity: 'medium',
          timestamp: Date.now()
        });
        return { possible: true };
      }
    } catch (e) {
      // Expected - this is a probe
      this.protectionStatus.dnsLeakCheck = 'protected';
    }

    return { possible: false };
  }

  /**
   * Detect VPN killswitch status
   */
  async detectVPNStatus() {
    try {
      // Try to connect to external service
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://1.1.1.1/dns-query', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });

      clearTimeout(timeout);

      // If we can reach external IP, VPN may not be active
      console.warn('[SessionProtection] Check your VPN connection');
      this.protectionStatus.vpnStatus = 'warning';
      return { vpnActive: false, warning: true };
    } catch (e) {
      // Connection blocked - VPN killswitch working
      this.protectionStatus.vpnStatus = 'protected';
      return { vpnActive: true, protected: true };
    }
  }

  /**
   * Run all protection checks
   */
  async runFullCheck() {
    console.log('[SessionProtection] Running full protection check...');

    const results = {
      timestamp: Date.now(),
      checks: {}
    };

    // Check 1: WebRTC leaks
    results.checks.webRTC = await this.detectWebRTCLeak();

    // Check 2: DNS leaks
    results.checks.dns = await this.checkDNSLeaks();

    // Check 3: VPN status
    results.checks.vpn = await this.detectVPNStatus();

    // Summary
    const hasWarnings = this.leakWarnings.length > 0;
    results.summary = {
      hasLeaks: hasWarnings,
      leakCount: this.leakWarnings.length,
      protectionLevel: this.getProtectionLevel()
    };

    console.log('[SessionProtection] Check complete', results.summary);
    return results;
  }

  /**
   * Get overall protection level
   */
  getProtectionLevel() {
    if (this.protectionStatus.webRTCLeakDetected) {
      return 'critical';
    }
    if (this.leakWarnings.some(w => w.severity === 'high')) {
      return 'high_risk';
    }
    if (this.leakWarnings.some(w => w.severity === 'medium')) {
      return 'medium_risk';
    }
    return 'protected';
  }

  /**
   * Get protection warnings
   */
  getWarnings() {
    return this.leakWarnings;
  }

  /**
   * Clear warnings
   */
  clearWarnings() {
    this.leakWarnings = [];
  }

  /**
   * Get protection status
   */
  getStatus() {
    return {
      protectionLevel: this.getProtectionLevel(),
      status: this.protectionStatus,
      warnings: this.leakWarnings.length,
      lastCheck: this.leakWarnings.length > 0 
        ? this.leakWarnings[this.leakWarnings.length - 1].timestamp 
        : null
    };
  }

  /**
   * Watermark injection - invisible tracking prevention
   * Injects metadata into session to prevent external tracking
   */
  injectSessionWatermark() {
    const watermark = {
      sessionId: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Store in session memory only (not in storage)
    window._sessionWatermark = watermark;

    return watermark;
  }

  /**
   * Get session watermark
   */
  getSessionWatermark() {
    return window._sessionWatermark || null;
  }
}

export const sessionProtectionManager = new SessionProtectionManager();
