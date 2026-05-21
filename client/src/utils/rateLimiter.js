/**
 * Rate Limiting & Spam Prevention Manager
 * 
 * Features:
 * - Per-session message rate limits
 * - Rapid connection cycling detection
 * - Automated room pause on suspicious activity
 */

class RateLimiterManager {
  constructor() {
    this.limits = {
      messagesPerSecond: 5,
      messagesPerMinute: 100,
      connectionsPerMinute: 10,
      connectionCyclingThreshold: 5 // 5 rapid connects
    };

    this.sessionLimits = new Map(); // sessionId -> limit data
    this.blockedSessions = new Set();
    this.pausedRooms = new Set();
  }

  /**
   * Initialize session limits
   */
  initializeSession(sessionId) {
    if (!this.sessionLimits.has(sessionId)) {
      this.sessionLimits.set(sessionId, {
        sessionId,
        messages: [],
        connections: [],
        lastViolation: null,
        violationCount: 0,
        isThrottled: false
      });
    }
  }

  /**
   * Check message rate limit
   */
  checkMessageLimit(sessionId) {
    this.initializeSession(sessionId);
    const session = this.sessionLimits.get(sessionId);

    if (this.blockedSessions.has(sessionId)) {
      return { allowed: false, reason: 'session_blocked' };
    }

    const now = Date.now();

    // Add current message
    session.messages.push(now);

    // Remove messages older than 1 minute
    session.messages = session.messages.filter(t => now - t < 60000);

    // Check per-second limit
    const lastSecond = session.messages.filter(t => now - t < 1000);
    if (lastSecond.length > this.limits.messagesPerSecond) {
      this.recordViolation(sessionId, 'message_rate_second');
      return { allowed: false, reason: 'rate_limit_per_second' };
    }

    // Check per-minute limit
    if (session.messages.length > this.limits.messagesPerMinute) {
      this.recordViolation(sessionId, 'message_rate_minute');
      return { allowed: false, reason: 'rate_limit_per_minute' };
    }

    return { allowed: true };
  }

  /**
   * Check connection rate limit
   */
  checkConnectionLimit(sessionId) {
    this.initializeSession(sessionId);
    const session = this.sessionLimits.get(sessionId);

    const now = Date.now();
    session.connections.push(now);

    // Remove connections older than 1 minute
    session.connections = session.connections.filter(t => now - t < 60000);

    // Check per-minute limit
    if (session.connections.length > this.limits.connectionsPerMinute) {
      this.recordViolation(sessionId, 'connection_cycling');
      return { allowed: false, reason: 'connection_cycling_detected' };
    }

    // Check for rapid cycling (multiple connects in short time)
    const recentConnections = session.connections.filter(t => now - t < 10000);
    if (recentConnections.length >= this.limits.connectionCyclingThreshold) {
      this.recordViolation(sessionId, 'rapid_connection_cycling');
      return { allowed: false, reason: 'rapid_cycling' };
    }

    return { allowed: true };
  }

  /**
   * Record violation
   */
  recordViolation(sessionId, violationType) {
    const session = this.sessionLimits.get(sessionId);
    if (!session) return;

    session.violationCount++;
    session.lastViolation = {
      type: violationType,
      timestamp: Date.now()
    };

    console.warn('[RateLimiter] Violation detected:', {
      sessionId,
      violationType,
      violationCount: session.violationCount
    });

    // Block session after 3 violations
    if (session.violationCount >= 3) {
      this.blockSession(sessionId);
    }
  }

  /**
   * Block a session
   */
  blockSession(sessionId, durationMs = 300000) { // 5 minutes default
    this.blockedSessions.add(sessionId);

    console.warn('[RateLimiter] Session blocked:', sessionId);

    // Auto-unblock after duration
    setTimeout(() => {
      this.unblockSession(sessionId);
    }, durationMs);

    return { blocked: true, durationSeconds: (durationMs / 1000).toFixed(0) };
  }

  /**
   * Unblock a session
   */
  unblockSession(sessionId) {
    if (this.blockedSessions.has(sessionId)) {
      this.blockedSessions.delete(sessionId);
      console.log('[RateLimiter] Session unblocked:', sessionId);
      return true;
    }
    return false;
  }

  /**
   * Pause a room
   */
  pauseRoom(roomCode, durationMs = 600000) { // 10 minutes default
    this.pausedRooms.add(roomCode);

    console.warn('[RateLimiter] Room paused:', roomCode);

    setTimeout(() => {
      this.resumeRoom(roomCode);
    }, durationMs);

    return { paused: true, durationSeconds: (durationMs / 1000).toFixed(0) };
  }

  /**
   * Resume a room
   */
  resumeRoom(roomCode) {
    if (this.pausedRooms.has(roomCode)) {
      this.pausedRooms.delete(roomCode);
      console.log('[RateLimiter] Room resumed:', roomCode);
      return true;
    }
    return false;
  }

  /**
   * Check if room is paused
   */
  isRoomPaused(roomCode) {
    return this.pausedRooms.has(roomCode);
  }

  /**
   * Check if session is blocked
   */
  isSessionBlocked(sessionId) {
    return this.blockedSessions.has(sessionId);
  }

  /**
   * Throttle a session (reduce limits)
   */
  throttleSession(sessionId) {
    const session = this.sessionLimits.get(sessionId);
    if (session) {
      session.isThrottled = true;
      // Reduce limits by half
      console.log('[RateLimiter] Session throttled:', sessionId);
    }
  }

  /**
   * Get throttled limits for session
   */
  getSessionLimits(sessionId) {
    const session = this.sessionLimits.get(sessionId);
    if (!session) return this.limits;

    if (session.isThrottled) {
      return {
        messagesPerSecond: this.limits.messagesPerSecond / 2,
        messagesPerMinute: this.limits.messagesPerMinute / 2,
        connectionsPerMinute: this.limits.connectionsPerMinute / 2,
        connectionCyclingThreshold: this.limits.connectionCyclingThreshold
      };
    }

    return this.limits;
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId) {
    const session = this.sessionLimits.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      messageCount: session.messages.length,
      connectionCount: session.connections.length,
      violationCount: session.violationCount,
      isBlocked: this.blockedSessions.has(sessionId),
      isThrottled: session.isThrottled,
      lastViolation: session.lastViolation
    };
  }

  /**
   * Clear session limits
   */
  clearSession(sessionId) {
    this.sessionLimits.delete(sessionId);
    this.blockedSessions.delete(sessionId);
  }

  /**
   * Get rate limit report
   */
  getReport() {
    return {
      timestamp: Date.now(),
      blockedSessions: Array.from(this.blockedSessions),
      pausedRooms: Array.from(this.pausedRooms),
      activeSessions: this.sessionLimits.size
    };
  }
}

export const rateLimiterManager = new RateLimiterManager();
