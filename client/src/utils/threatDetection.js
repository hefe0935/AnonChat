/**
 * Threat Detection & Honeypot Manager
 * 
 * Features:
 * - Detect bot-like connection patterns
 * - Flag suspicious join behaviors
 * - Automatic room blacklisting
 * - Session anomaly detection
 */

class ThreatDetectionManager {
  constructor() {
    this.connectionPatterns = new Map(); // sessionId -> pattern data
    this.suspiciousRooms = new Set();
    this.blockedSessions = new Set();
    this.thresholds = {
      rapidConnections: 5, // 5 connections in 30s
      rapidJoins: 3,       // 3 joins in 20s
      shortSessionTime: 5000, // Sessions < 5s are suspicious
      messageSpamRate: 10   // 10+ messages in 5s
    };
  }

  /**
   * Track a connection attempt
   */
  trackConnection(sessionId, roomCode) {
    const now = Date.now();

    if (!this.connectionPatterns.has(sessionId)) {
      this.connectionPatterns.set(sessionId, {
        connections: [],
        joins: [],
        messages: [],
        sessionStart: now,
        roomCode,
        suspicionScore: 0
      });
    }

    const pattern = this.connectionPatterns.get(sessionId);
    pattern.connections.push(now);

    // Clean up old entries (>1 minute)
    pattern.connections = pattern.connections.filter(t => now - t < 60000);

    this.evaluateThreat(sessionId);
  }

  /**
   * Track a room join
   */
  trackRoomJoin(sessionId, roomCode) {
    const now = Date.now();

    if (!this.connectionPatterns.has(sessionId)) {
      this.trackConnection(sessionId, roomCode);
    }

    const pattern = this.connectionPatterns.get(sessionId);
    pattern.joins.push(now);
    pattern.joins = pattern.joins.filter(t => now - t < 30000); // 30s window

    this.evaluateThreat(sessionId);
  }

  /**
   * Track message activity
   */
  trackMessage(sessionId) {
    const now = Date.now();

    if (!this.connectionPatterns.has(sessionId)) {
      return;
    }

    const pattern = this.connectionPatterns.get(sessionId);
    pattern.messages.push(now);
    pattern.messages = pattern.messages.filter(t => now - t < 5000); // 5s window

    this.evaluateThreat(sessionId);
  }

  /**
   * Evaluate threat level
   */
  evaluateThreat(sessionId) {
    const pattern = this.connectionPatterns.get(sessionId);
    if (!pattern) return;

    let suspicionScore = 0;

    // Check 1: Rapid connections (bot-like)
    if (pattern.connections.length >= this.thresholds.rapidConnections) {
      suspicionScore += 30;
    }

    // Check 2: Rapid room joins
    if (pattern.joins.length >= this.thresholds.rapidJoins) {
      suspicionScore += 25;
    }

    // Check 3: Very short session time
    const sessionDuration = Date.now() - pattern.sessionStart;
    if (sessionDuration > 5000 && sessionDuration < this.thresholds.shortSessionTime) {
      suspicionScore += 20;
    }

    // Check 4: Message spam rate
    if (pattern.messages.length >= this.thresholds.messageSpamRate) {
      suspicionScore += 35;
    }

    // Check 5: Same user joining multiple rooms rapidly
    if (pattern.joins.length > 2) {
      suspicionScore += 15;
    }

    pattern.suspicionScore = suspicionScore;

    // Log threat if score exceeds threshold
    if (suspicionScore >= 50) {
      this.flagSuspiciousSession(sessionId, suspicionScore);
    }
  }

  /**
   * Flag and block a suspicious session
   */
  flagSuspiciousSession(sessionId, suspicionScore) {
    const pattern = this.connectionPatterns.get(sessionId);
    
    console.warn('[ThreatDetection] Suspicious session detected', {
      sessionId,
      suspicionScore,
      roomCode: pattern?.roomCode,
      connections: pattern?.connections.length,
      joins: pattern?.joins.length
    });

    // Block this session
    this.blockedSessions.add(sessionId);

    // Add room to blacklist if score > 70
    if (suspicionScore > 70 && pattern?.roomCode) {
      this.suspiciousRooms.add(pattern.roomCode);
      console.warn('[ThreatDetection] Room blacklisted:', pattern.roomCode);
    }

    return {
      flagged: true,
      suspicionScore,
      actions: ['session_blocked', suspicionScore > 70 ? 'room_blacklisted' : null]
    };
  }

  /**
   * Check if session is blocked
   */
  isBlocked(sessionId) {
    return this.blockedSessions.has(sessionId);
  }

  /**
   * Check if room is blacklisted
   */
  isRoomBlacklisted(roomCode) {
    return this.suspiciousRooms.has(roomCode);
  }

  /**
   * Get suspicion score for a session
   */
  getSuspicionScore(sessionId) {
    const pattern = this.connectionPatterns.get(sessionId);
    return pattern ? pattern.suspicionScore : 0;
  }

  /**
   * Get threat analysis for a session
   */
  analyzeThreat(sessionId) {
    const pattern = this.connectionPatterns.get(sessionId);
    if (!pattern) return null;

    return {
      sessionId,
      suspicionScore: pattern.suspicionScore,
      connectionCount: pattern.connections.length,
      joinCount: pattern.joins.length,
      messageCount: pattern.messages.length,
      sessionDuration: Date.now() - pattern.sessionStart,
      isBlocked: this.isBlocked(sessionId),
      threats: this.identifyThreats(pattern)
    };
  }

  /**
   * Identify specific threats
   */
  identifyThreats(pattern) {
    const threats = [];

    if (pattern.connections.length >= this.thresholds.rapidConnections) {
      threats.push('rapid_connections');
    }
    if (pattern.joins.length >= this.thresholds.rapidJoins) {
      threats.push('rapid_room_joins');
    }
    if (pattern.messages.length >= this.thresholds.messageSpamRate) {
      threats.push('message_spam');
    }

    return threats;
  }

  /**
   * Clear old pattern data
   */
  cleanup() {
    const now = Date.now();
    for (const [sessionId, pattern] of this.connectionPatterns) {
      const sessionAge = now - pattern.sessionStart;
      if (sessionAge > 3600000) { // 1 hour
        this.connectionPatterns.delete(sessionId);
      }
    }
  }

  /**
   * Get threat report
   */
  getReport() {
    return {
      blockedSessions: Array.from(this.blockedSessions),
      blacklistedRooms: Array.from(this.suspiciousRooms),
      trackedSessions: this.connectionPatterns.size,
      timestamp: Date.now()
    };
  }
}

export const threatDetectionManager = new ThreatDetectionManager();
