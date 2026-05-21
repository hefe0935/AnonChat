/**
 * Read Receipts Manager
 * Tracks message read status (sent/delivered/read)
 * Privacy-respecting: Only tracks if enabled by user
 * Does NOT persist read status or create history
 */

class ReadReceiptsManager {
  constructor() {
    this.receipts = new Map(); // messageId -> { status, readAt, readBy: [] }
    this.listeners = new Set();
    this.enabled = true; // User can disable
  }

  /**
   * Set read receipt enablement
   * @param {boolean} enabled - Whether to track read receipts
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.receipts.clear(); // Clear on disable
      this.notify();
    }
  }

  /**
   * Mark message as sent (initial state)
   * @param {string} messageId - Message ID
   * @returns {Object} Receipt status
   */
  markSent(messageId) {
    if (!this.enabled) return null;

    const receipt = {
      status: 'sent',
      sentAt: Date.now(),
      deliveredAt: null,
      readAt: null,
      readBy: []
    };
    this.receipts.set(messageId, receipt);
    this.notify();
    return receipt;
  }

  /**
   * Mark message as delivered to recipient
   * @param {string} messageId - Message ID
   * @returns {Object} Updated receipt status
   */
  markDelivered(messageId) {
    if (!this.enabled) return null;

    const receipt = this.receipts.get(messageId);
    if (receipt) {
      receipt.status = 'delivered';
      receipt.deliveredAt = Date.now();
      this.notify();
    }
    return receipt;
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   * @param {string} userId - User who read it (anonymous: use session ID)
   * @returns {Object} Updated receipt status
   */
  markRead(messageId, userId = 'self') {
    if (!this.enabled) return null;

    const receipt = this.receipts.get(messageId);
    if (receipt) {
      if (receipt.status !== 'read') {
        receipt.status = 'read';
        receipt.readAt = Date.now();
      }
      // Track who read it (privacy: only session IDs, not user info)
      if (!receipt.readBy.includes(userId)) {
        receipt.readBy.push(userId);
      }
      this.notify();
    }
    return receipt;
  }

  /**
   * Get receipt status for a message
   * @param {string} messageId - Message ID
   * @returns {Object|null} Receipt status or null
   */
  getReceipt(messageId) {
    if (!this.enabled) return null;
    return this.receipts.get(messageId) || null;
  }

  /**
   * Get status string for UI display
   * @param {string} messageId - Message ID
   * @returns {string} Status string ("Sent", "Delivered", "Read", etc)
   */
  getStatusString(messageId) {
    const receipt = this.getReceipt(messageId);
    if (!receipt) return 'Pending';

    switch (receipt.status) {
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return receipt.readBy.length > 0 ? `Read (${receipt.readBy.length})` : 'Read';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get status icon for UI display
   * @param {string} messageId - Message ID
   * @returns {string} Emoji icon
   */
  getStatusIcon(messageId) {
    const receipt = this.getReceipt(messageId);
    if (!receipt) return '⏱️'; // Clock for pending

    switch (receipt.status) {
      case 'sent':
        return '✓'; // Single check
      case 'delivered':
        return '✓✓'; // Double check
      case 'read':
        return '✓✓'; // Double check (could also use 👁️)
      default:
        return '?';
    }
  }

  /**
   * Subscribe to receipt changes
   * @param {Function} callback - Called when receipts change
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
        console.error('Read receipts listener error:', error);
      }
    });
  }

  /**
   * Clear all receipts (on logout or reset)
   * Privacy: Remove all tracking data
   */
  clear() {
    this.receipts.clear();
    this.notify();
  }

  /**
   * Clear old receipts (privacy: auto-cleanup on disconnect)
   * @param {number} maxAgeMs - Max age in milliseconds (default: 24 hours)
   */
  clearOldReceipts(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    for (const [messageId, receipt] of this.receipts.entries()) {
      if (now - receipt.sentAt > maxAgeMs) {
        this.receipts.delete(messageId);
      }
    }
    this.notify();
  }

  /**
   * Get debug info (for development only)
   */
  getDebugInfo() {
    return {
      enabled: this.enabled,
      totalMessages: this.receipts.size,
      receipts: Array.from(this.receipts.entries()).map(([id, receipt]) => ({
        id,
        ...receipt
      }))
    };
  }
}

// Export singleton instance
export default new ReadReceiptsManager();
