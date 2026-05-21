/**
 * Screen Mirroring Detection Manager
 * 
 * Features:
 * - Detect screen sharing/mirroring
 * - Detect remote access tools (TeamViewer, RDP)
 * - Prevent video calls if detected
 */

class ScreenMirrorDetectionManager {
  constructor() {
    this.detectedThreats = [];
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.indicators = {
      isRemoteDesktopActive: false,
      isScreenSharing: false,
      suspiciousToolsDetected: []
    };
  }

  /**
   * Detect Remote Desktop (RDP) access
   */
  detectRemoteDesktop() {
    try {
      // Check for RDP-related environment indicators
      const ua = navigator.userAgent.toLowerCase();

      // Check for common RDP client patterns
      const rdpIndicators = [
        'rdwebserver',
        'rdgateway',
        'remoteapp',
        'rdp'
      ];

      for (const indicator of rdpIndicators) {
        if (ua.includes(indicator)) {
          console.warn('[ScreenDetection] RDP indicators detected');
          this.indicators.isRemoteDesktopActive = true;
          return true;
        }
      }

      // Check for Hyper-V, VirtualBox, VMware
      const virtualIndicators = [
        'hyperv',
        'virtualbox',
        'vmware',
        'xen',
        'vbox'
      ];

      for (const indicator of virtualIndicators) {
        if (ua.includes(indicator)) {
          console.warn('[ScreenDetection] Virtualization detected');
          this.indicators.suspiciousToolsDetected.push(indicator);
          return true;
        }
      }
    } catch (e) {
      console.error('[ScreenDetection] RDP detection error:', e);
    }

    return false;
  }

  /**
   * Detect screen sharing via WebRTC
   */
  async detectScreenSharing() {
    try {
      // Check if user is sharing screen
      const displays = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = displays.filter(device => device.kind === 'videoinput');

      // If there's a display capture device, screen sharing might be active
      for (const device of videoDevices) {
        if (device.label.toLowerCase().includes('screen') || 
            device.label.toLowerCase().includes('display')) {
          console.warn('[ScreenDetection] Screen capture device detected');
          this.indicators.isScreenSharing = true;
          return true;
        }
      }
    } catch (e) {
      console.error('[ScreenDetection] Screen sharing detection error:', e);
    }

    return false;
  }

  /**
   * Detect TeamViewer and other remote access tools
   */
  detectRemoteAccessTools() {
    const detected = [];

    // Check for TeamViewer
    try {
      const tvIndicators = ['teamviewer', 'tvnserver'];
      const ua = navigator.userAgent.toLowerCase();
      
      for (const indicator of tvIndicators) {
        if (ua.includes(indicator)) {
          detected.push('TeamViewer');
        }
      }
    } catch (e) {}

    // Check for AnyDesk
    try {
      if (window.anyDeskDetected || navigator.userAgent.includes('anydesk')) {
        detected.push('AnyDesk');
      }
    } catch (e) {}

    // Check for Chrome Remote Desktop
    try {
      if (window.chromeRemoteDesktop) {
        detected.push('Chrome Remote Desktop');
      }
    } catch (e) {}

    // Check for Microsoft Remote Desktop
    try {
      if (navigator.userAgent.includes('ms-rdpc') || navigator.userAgent.includes('mstsc')) {
        detected.push('Microsoft Remote Desktop');
      }
    } catch (e) {}

    if (detected.length > 0) {
      console.warn('[ScreenDetection] Remote tools detected:', detected);
      this.indicators.suspiciousToolsDetected = detected;
      return detected;
    }

    return [];
  }

  /**
   * Check screen resolution anomalies
   * High-res displays in unusual resolutions may indicate mirroring
   */
  detectResolutionAnomalies() {
    const screen = window.screen;
    const anomalies = [];

    // Check for odd resolutions (often seen in VM/remote setups)
    const oddResolutions = [
      [1152, 864],   // Old standard
      [1024, 768],   // Old standard
      [640, 480],    // Very old
      [800, 600]     // Old standard
    ];

    const currentRes = `${screen.width}x${screen.height}`;
    const currentPixelRatio = window.devicePixelRatio;

    // If physical resolution doesn't match CSS pixels (high ratio), could indicate scaling
    if (currentPixelRatio > 2) {
      anomalies.push({
        type: 'high_dpi_scaling',
        value: currentPixelRatio,
        indicator: 'May indicate remote desktop or VM'
      });
    }

    // Check if unusual resolution
    oddResolutions.forEach(res => {
      if (screen.width === res[0] && screen.height === res[1]) {
        anomalies.push({
          type: 'unusual_resolution',
          value: currentRes,
          indicator: 'Legacy or virtualized display detected'
        });
      }
    });

    return anomalies;
  }

  /**
   * Run full screen mirroring detection
   */
  async runFullDetection() {
    console.log('[ScreenDetection] Starting comprehensive screen detection...');

    const results = {
      timestamp: Date.now(),
      threats: [],
      indicators: {}
    };

    // Check 1: Remote Desktop
    const rdpDetected = this.detectRemoteDesktop();
    if (rdpDetected) {
      results.threats.push({
        type: 'remote_desktop_active',
        severity: 'critical',
        message: 'Remote Desktop (RDP) indicators detected'
      });
    }

    // Check 2: Screen Sharing
    const screenSharingDetected = await this.detectScreenSharing();
    if (screenSharingDetected) {
      results.threats.push({
        type: 'screen_sharing',
        severity: 'high',
        message: 'Screen sharing/capture device detected'
      });
    }

    // Check 3: Remote Access Tools
    const tools = this.detectRemoteAccessTools();
    if (tools.length > 0) {
      results.threats.push({
        type: 'remote_access_tools',
        severity: 'critical',
        message: `Detected: ${tools.join(', ')}`
      });
    }

    // Check 4: Resolution Anomalies
    const resAnomalies = this.detectResolutionAnomalies();
    if (resAnomalies.length > 0) {
      results.threats.push({
        type: 'resolution_anomaly',
        severity: 'medium',
        anomalies: resAnomalies
      });
    }

    results.indicators = this.indicators;
    this.detectedThreats = results.threats;

    console.log('[ScreenDetection] Detection complete:', results);
    return results;
  }

  /**
   * Check if video calls should be blocked
   */
  shouldBlockVideoCalls() {
    return (
      this.indicators.isRemoteDesktopActive ||
      this.indicators.isScreenSharing ||
      this.indicators.suspiciousToolsDetected.length > 0
    );
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorInterval = setInterval(async () => {
      await this.runFullDetection();
    }, 30000); // Check every 30 seconds

    console.log('[ScreenDetection] Monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('[ScreenDetection] Monitoring stopped');
  }

  /**
   * Get threat report
   */
  getThreatReport() {
    return {
      timestamp: Date.now(),
      threats: this.detectedThreats,
      indicators: this.indicators,
      blocksVideoCalls: this.shouldBlockVideoCalls(),
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Clear detected threats
   */
  clear() {
    this.detectedThreats = [];
    this.indicators = {
      isRemoteDesktopActive: false,
      isScreenSharing: false,
      suspiciousToolsDetected: []
    };
  }
}

export const screenMirrorDetectionManager = new ScreenMirrorDetectionManager();
