/**
 * User Status Manager
 * Tracks and broadcasts user online/offline/away status
 * Maintains privacy by not storing persistent status data
 */

class UserStatusManager {
  constructor() {
    this.status = 'online'; // online, away, offline
    this.lastActivity = Date.now();
    this.inactivityTimeout = 5 * 60 * 1000; // 5 minutes until away
    this.listeners = [];
    this.inactivityTimer = null;
  }

  /**
   * Initialize status tracking
   */
  init() {
    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach((event) => {
      document.addEventListener(event, () => this.recordActivity(), { passive: true });
    });

    // Set away timer
    this.setAwayTimer();

    // Listen for page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.setStatus('away');
      } else {
        this.setStatus('online');
        this.recordActivity();
      }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.setStatus('offline');
    });
  }

  /**
   * Record user activity
   */
  recordActivity() {
    this.lastActivity = Date.now();
    if (this.status === 'away') {
      this.setStatus('online');
    }
    this.resetAwayTimer();
  }

  /**
   * Set away timer
   */
  setAwayTimer() {
    this.inactivityTimer = setTimeout(() => {
      if (this.status === 'online') {
        this.setStatus('away');
      }
    }, this.inactivityTimeout);
  }

  /**
   * Reset away timer
   */
  resetAwayTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.setAwayTimer();
  }

  /**
   * Set status
   */
  setStatus(status) {
    if (!['online', 'away', 'offline'].includes(status)) {
      console.warn('Invalid status:', status);
      return;
    }

    if (this.status === status) return;

    this.status = status;
    console.log('Status changed:', status);

    // Notify all listeners
    this.listeners.forEach((callback) => callback(status));
  }

  /**
   * Get current status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Get status with emoji
   */
  getStatusEmoji() {
    switch (this.status) {
      case 'online':
        return '🟢';
      case 'away':
        return '🟡';
      case 'offline':
        return '⚫';
      default:
        return '❓';
    }
  }

  /**
   * Get status text
   */
  getStatusText() {
    switch (this.status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  }

  /**
   * Subscribe to status changes
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Broadcast status to peer (via Socket.IO)
   */
  broadcastStatus(signalingClient) {
    if (signalingClient && signalingClient.socket) {
      signalingClient.socket.emit('user-status', {
        status: this.status,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
  }
}

export default new UserStatusManager();
