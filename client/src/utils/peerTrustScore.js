/**
 * Peer Trust Score Manager
 * 
 * Features:
 * - Calculate trust based on connection stability
 * - Average message response time
 * - Call completion rate
 */

class PeerTrustScoreManager {
  constructor() {
    this.peerScores = new Map(); // peerId -> score data
  }

  /**
   * Initialize peer tracking
   */
  initializePeer(peerId) {
    if (!this.peerScores.has(peerId)) {
      this.peerScores.set(peerId, {
        peerId,
        connectionStability: {
          totalConnections: 0,
          successfulConnections: 0,
          avgConnectionDuration: 0,
          connectionHistory: []
        },
        messaging: {
          totalMessages: 0,
          avgResponseTime: 0,
          responseTimeHistory: [],
          messageReliability: 100
        },
        calling: {
          totalCalls: 0,
          completedCalls: 0,
          avgCallDuration: 0,
          callDropouts: 0,
          callHistory: []
        },
        trustScore: 50, // Start at neutral
        lastUpdated: Date.now()
      });
    }
  }

  /**
   * Record successful connection
   */
  recordConnection(peerId, durationMs, wasSuccessful = true) {
    this.initializePeer(peerId);
    const peer = this.peerScores.get(peerId);

    peer.connectionStability.totalConnections++;
    if (wasSuccessful) {
      peer.connectionStability.successfulConnections++;
    }

    peer.connectionStability.connectionHistory.push({
      timestamp: Date.now(),
      duration: durationMs,
      successful: wasSuccessful
    });

    // Keep only last 50
    if (peer.connectionStability.connectionHistory.length > 50) {
      peer.connectionStability.connectionHistory.shift();
    }

    // Update average
    const durations = peer.connectionStability.connectionHistory
      .filter(c => c.successful)
      .map(c => c.duration);
    
    if (durations.length > 0) {
      peer.connectionStability.avgConnectionDuration = 
        durations.reduce((a, b) => a + b) / durations.length;
    }

    this.updateTrustScore(peerId);
  }

  /**
   * Record message exchange
   */
  recordMessage(peerId, responseTimeMs) {
    this.initializePeer(peerId);
    const peer = this.peerScores.get(peerId);

    peer.messaging.totalMessages++;
    peer.messaging.responseTimeHistory.push({
      timestamp: Date.now(),
      responseTime: responseTimeMs
    });

    // Keep only last 100
    if (peer.messaging.responseTimeHistory.length > 100) {
      peer.messaging.responseTimeHistory.shift();
    }

    // Update average response time
    const responseTimes = peer.messaging.responseTimeHistory.map(r => r.responseTime);
    peer.messaging.avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;

    this.updateTrustScore(peerId);
  }

  /**
   * Record call
   */
  recordCall(peerId, durationMs, wasCompleted = true, droppedMidCall = false) {
    this.initializePeer(peerId);
    const peer = this.peerScores.get(peerId);

    peer.calling.totalCalls++;
    if (wasCompleted) {
      peer.calling.completedCalls++;
    }
    if (droppedMidCall) {
      peer.calling.callDropouts++;
    }

    peer.calling.callHistory.push({
      timestamp: Date.now(),
      duration: durationMs,
      completed: wasCompleted,
      dropped: droppedMidCall
    });

    // Keep only last 20
    if (peer.calling.callHistory.length > 20) {
      peer.calling.callHistory.shift();
    }

    // Update average call duration
    const completedCalls = peer.calling.callHistory.filter(c => c.completed);
    if (completedCalls.length > 0) {
      peer.calling.avgCallDuration = 
        completedCalls.reduce((sum, c) => sum + c.duration, 0) / completedCalls.length;
    }

    this.updateTrustScore(peerId);
  }

  /**
   * Update overall trust score for peer
   */
  updateTrustScore(peerId) {
    const peer = this.peerScores.get(peerId);
    if (!peer) return;

    let score = 50; // Base score

    // Factor 1: Connection stability (weight: 30%)
    if (peer.connectionStability.totalConnections > 0) {
      const successRate = peer.connectionStability.successfulConnections / 
                         peer.connectionStability.totalConnections;
      score += successRate * 30;
    }

    // Factor 2: Message reliability (weight: 20%)
    // Lower response time = higher trust
    if (peer.messaging.avgResponseTime > 0) {
      const responseQuality = Math.max(0, 1 - (peer.messaging.avgResponseTime / 5000));
      score += responseQuality * 20;
    }

    // Factor 3: Call completion rate (weight: 30%)
    if (peer.calling.totalCalls > 0) {
      const completionRate = peer.calling.completedCalls / peer.calling.totalCalls;
      score += completionRate * 30;

      // Penalize for call dropouts
      const dropoutRate = peer.calling.callDropouts / peer.calling.totalCalls;
      score -= dropoutRate * 15;
    }

    // Factor 4: Interaction history (weight: 20%)
    const totalInteractions = peer.messaging.totalMessages + peer.calling.totalCalls;
    if (totalInteractions > 0) {
      const interactionBonus = Math.min(20, (totalInteractions / 100) * 20);
      score += interactionBonus;
    }

    // Clamp score between 0-100
    peer.trustScore = Math.max(0, Math.min(100, Math.round(score)));
    peer.lastUpdated = Date.now();
  }

  /**
   * Get trust score for peer
   */
  getTrustScore(peerId) {
    const peer = this.peerScores.get(peerId);
    return peer ? peer.trustScore : null;
  }

  /**
   * Get detailed peer profile
   */
  getPeerProfile(peerId) {
    const peer = this.peerScores.get(peerId);
    if (!peer) return null;

    return {
      peerId,
      trustScore: peer.trustScore,
      trustLevel: this.getTrustLevel(peer.trustScore),
      connections: {
        total: peer.connectionStability.totalConnections,
        successful: peer.connectionStability.successfulConnections,
        successRate: peer.connectionStability.totalConnections > 0 
          ? ((peer.connectionStability.successfulConnections / peer.connectionStability.totalConnections) * 100).toFixed(1) + '%'
          : 'N/A',
        avgDuration: peer.connectionStability.avgConnectionDuration.toFixed(0) + 'ms'
      },
      messaging: {
        total: peer.messaging.totalMessages,
        avgResponseTime: peer.messaging.avgResponseTime.toFixed(0) + 'ms',
        reliability: peer.messaging.messageReliability.toFixed(1) + '%'
      },
      calling: {
        total: peer.calling.totalCalls,
        completed: peer.calling.completedCalls,
        dropouts: peer.calling.callDropouts,
        completionRate: peer.calling.totalCalls > 0
          ? ((peer.calling.completedCalls / peer.calling.totalCalls) * 100).toFixed(1) + '%'
          : 'N/A',
        avgDuration: peer.calling.avgCallDuration.toFixed(0) + 'ms'
      },
      lastUpdated: new Date(peer.lastUpdated).toLocaleString()
    };
  }

  /**
   * Get trust level label
   */
  getTrustLevel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Untrusted';
  }

  /**
   * Get trust badge (visual representation)
   */
  getTrustBadge(peerId) {
    const score = this.getTrustScore(peerId);
    if (score === null) return { badge: '?', color: 'gray' };

    if (score >= 80) return { badge: '★★★★★', color: 'green' };
    if (score >= 60) return { badge: '★★★★☆', color: 'blue' };
    if (score >= 40) return { badge: '★★★☆☆', color: 'yellow' };
    if (score >= 20) return { badge: '★★☆☆☆', color: 'orange' };
    return { badge: '★☆☆☆☆', color: 'red' };
  }

  /**
   * Get peer comparison
   */
  comparePeers(peerIds) {
    return peerIds
      .map(id => ({
        peerId: id,
        score: this.getTrustScore(id),
        level: this.getTrustLevel(this.getTrustScore(id) || 0)
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Get all peer scores
   */
  getAllPeerScores() {
    return Array.from(this.peerScores.values()).map(peer => ({
      peerId: peer.peerId,
      trustScore: peer.trustScore,
      trustLevel: this.getTrustLevel(peer.trustScore),
      interactions: peer.messaging.totalMessages + peer.calling.totalCalls
    }));
  }

  /**
   * Clear peer history
   */
  clearPeer(peerId) {
    this.peerScores.delete(peerId);
  }

  /**
   * Clear all data
   */
  clearAll() {
    this.peerScores.clear();
  }
}

export const peerTrustScoreManager = new PeerTrustScoreManager();
