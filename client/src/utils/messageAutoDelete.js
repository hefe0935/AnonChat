/**
 * Self-Destructing Messages with Configurable Burn Timer
 * 
 * Features:
 * - Configurable auto-delete timers (1s, 30s, 2min, 5min, custom)
 * - Visual countdown timer on messages
 * - Server-side enforcement
 * - Memory cleanup on deletion
 */

const BURN_TIMER_PRESETS = {
  immediate: 1000,      // 1 second
  quick: 30000,         // 30 seconds
  short: 2 * 60 * 1000, // 2 minutes
  medium: 5 * 60 * 1000,// 5 minutes
  custom: null          // User defined
};

class MessageAutoDeleteManager {
  constructor() {
    this.timers = new Map(); // messageId -> { timer, expireTime }
    this.callbacks = new Map(); // messageId -> callback
  }

  /**
   * Set auto-delete timer for a message
   * @param {string} messageId - Unique message identifier
   * @param {number} burnTime - Time in milliseconds (or 'preset' key)
   * @param {function} onDelete - Callback when message expires
   */
  setTimer(messageId, burnTime, onDelete) {
    // Clear existing timer if any
    this.clearTimer(messageId);

    // Resolve preset or use raw time
    const deleteTime = typeof burnTime === 'string' 
      ? BURN_TIMER_PRESETS[burnTime] 
      : burnTime;

    if (!deleteTime || deleteTime <= 0) {
      console.warn('Invalid burn time:', burnTime);
      return;
    }

    const expireTime = Date.now() + deleteTime;

    // Store callback
    if (onDelete) {
      this.callbacks.set(messageId, onDelete);
    }

    // Set timer
    const timer = setTimeout(() => {
      this.deleteMessage(messageId);
    }, deleteTime);

    this.timers.set(messageId, {
      timer,
      expireTime,
      burnTime: deleteTime
    });
  }

  /**
   * Get remaining time for a message (in ms)
   */
  getRemainingTime(messageId) {
    const timerData = this.timers.get(messageId);
    if (!timerData) return null;

    const remaining = timerData.expireTime - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Get formatted countdown (e.g., "2:35")
   */
  getCountdownDisplay(messageId) {
    const remaining = this.getRemainingTime(messageId);
    if (remaining === null) return null;

    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
    return `${seconds}s`;
  }

  /**
   * Check if message has expired
   */
  hasExpired(messageId) {
    const timerData = this.timers.get(messageId);
    if (!timerData) return false;
    return Date.now() >= timerData.expireTime;
  }

  /**
   * Clear timer without deleting message
   */
  clearTimer(messageId) {
    const timerData = this.timers.get(messageId);
    if (timerData) {
      clearTimeout(timerData.timer);
      this.timers.delete(messageId);
    }
  }

  /**
   * Delete message and call callback
   */
  deleteMessage(messageId) {
    const callback = this.callbacks.get(messageId);
    if (callback) {
      callback(messageId);
    }
    this.clearTimer(messageId);
    this.callbacks.delete(messageId);
  }

  /**
   * Clear all timers (on disconnect)
   */
  clearAll() {
    for (const [messageId, timerData] of this.timers) {
      clearTimeout(timerData.timer);
    }
    this.timers.clear();
    this.callbacks.clear();
  }

  /**
   * Get all active message timers
   */
  getActiveTimers() {
    return Array.from(this.timers.entries()).map(([id, data]) => ({
      messageId: id,
      expireTime: data.expireTime,
      remainingMs: this.getRemainingTime(id)
    }));
  }
}

export const messageAutoDeleteManager = new MessageAutoDeleteManager();
export { BURN_TIMER_PRESETS };
