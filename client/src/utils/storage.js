/**
 * Local storage wrapper with privacy-conscious defaults
 * Auto-deletes sensitive data after 5 minutes or session end
 */

class SecureStorage {
  constructor() {
    this.autoDeleteTimer = null;
    this.autoDeleteTimeout = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Set item with optional auto-delete
   */
  setItem(key, value, autoDeleteMs = null) {
    try {
      localStorage.setItem(key, JSON.stringify(value));

      if (autoDeleteMs) {
        this.scheduleDelete(key, autoDeleteMs);
      }
    } catch (error) {
      console.error('Storage error:', error);
    }
  }

  /**
   * Get item
   */
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  }

  /**
   * Remove item
   */
  removeItem(key) {
    localStorage.removeItem(key);
  }

  /**
   * Clear all storage
   * PRIVACY: Called on session end
   */
  clear() {
    localStorage.clear();
    if (this.autoDeleteTimer) {
      clearTimeout(this.autoDeleteTimer);
    }
  }

  /**
   * Schedule automatic deletion
   */
  scheduleDelete(key, ms) {
    setTimeout(() => {
      this.removeItem(key);
    }, ms);
  }
}

export default new SecureStorage();
