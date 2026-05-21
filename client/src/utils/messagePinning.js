/**
 * Message Pinning Manager
 * 
 * Features:
 * - Pin important messages for session duration
 * - Auto-unpin on disconnect
 * - Show pinned messages at top
 */

class MessagePinningManager {
  constructor() {
    this.pinnedMessages = new Map(); // messageId -> pinned message data
    this.maxPinnedMessages = 5;
  }

  /**
   * Pin a message
   */
  pinMessage(messageId, messageData, priority = 0) {
    if (this.pinnedMessages.size >= this.maxPinnedMessages) {
      console.warn('[MessagePinning] Max pinned messages reached');
      return false;
    }

    this.pinnedMessages.set(messageId, {
      messageId,
      content: messageData.content,
      sender: messageData.sender,
      timestamp: messageData.timestamp || Date.now(),
      pinnedAt: Date.now(),
      priority
    });

    console.log('[MessagePinning] Message pinned:', messageId);
    return true;
  }

  /**
   * Unpin a message
   */
  unpinMessage(messageId) {
    const removed = this.pinnedMessages.delete(messageId);
    if (removed) {
      console.log('[MessagePinning] Message unpinned:', messageId);
    }
    return removed;
  }

  /**
   * Get all pinned messages (sorted by priority)
   */
  getPinnedMessages() {
    return Array.from(this.pinnedMessages.values())
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get pinned message by ID
   */
  getPinnedMessage(messageId) {
    return this.pinnedMessages.get(messageId);
  }

  /**
   * Check if message is pinned
   */
  isPinned(messageId) {
    return this.pinnedMessages.has(messageId);
  }

  /**
   * Toggle pin status
   */
  togglePin(messageId, messageData) {
    if (this.isPinned(messageId)) {
      return this.unpinMessage(messageId);
    } else {
      return this.pinMessage(messageId, messageData);
    }
  }

  /**
   * Clear all pinned messages
   */
  clearAll() {
    this.pinnedMessages.clear();
    console.log('[MessagePinning] All pinned messages cleared');
  }

  /**
   * Get pin count
   */
   getPinCount() {
    return this.pinnedMessages.size;
  }

  /**
   * Check if can pin more
   */
  canPin() {
    return this.pinnedMessages.size < this.maxPinnedMessages;
  }
}

export const messagePinningManager = new MessagePinningManager();
