/**
 * Message Search Manager
 * Provides search functionality for chat history
 * Privacy-respecting: Search is local-only, no server sync
 * Clears on disconnect
 */

class MessageSearchManager {
  constructor() {
    this.messages = []; // Only stores messages from current session
    this.searchHistory = []; // Search queries (not message content)
    this.listeners = new Set();
  }

  /**
   * Add a message to searchable index
   * @param {Object} message - Message object { id, text, sender, timestamp }
   */
  addMessage(message) {
    // Only store essential fields for search
    this.messages.push({
      id: message.id,
      text: message.text || '',
      sender: message.sender || 'Unknown',
      timestamp: message.timestamp || Date.now(),
      type: message.type || 'text'
    });

    // Keep only last 500 messages in memory (privacy: don't accumulate)
    if (this.messages.length > 500) {
      this.messages.shift();
    }

    this.notify();
  }

  /**
   * Search messages by keyword
   * @param {string} query - Search query
   * @param {Object} options - Search options { caseSensitive, wholeWords, regex }
   * @returns {Array} Matching messages
   */
  search(query, options = {}) {
    const {
      caseSensitive = false,
      wholeWords = false,
      regex = false
    } = options;

    if (!query || query.trim().length === 0) {
      return [];
    }

    // Add to search history (not the results, just the query)
    this.searchHistory.push({
      query,
      timestamp: Date.now()
    });
    // Keep last 50 searches
    if (this.searchHistory.length > 50) {
      this.searchHistory.shift();
    }

    try {
      let pattern;

      if (regex) {
        // Regex search
        const flags = caseSensitive ? 'g' : 'gi';
        pattern = new RegExp(query, flags);
      } else {
        // Regular text search
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const flags = caseSensitive ? 'g' : 'gi';
        if (wholeWords) {
          pattern = new RegExp(`\\b${escapedQuery}\\b`, flags);
        } else {
          pattern = new RegExp(escapedQuery, flags);
        }
      }

      // Search messages
      return this.messages.filter(msg => {
        return pattern.test(msg.text);
      }).map(msg => ({
        ...msg,
        // Include a snippet with the match highlighted
        snippet: this.getSnippet(msg.text, query)
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Search by sender/user
   * @param {string} sender - Sender identifier
   * @returns {Array} Messages from that sender
   */
  searchBySender(sender) {
    return this.messages.filter(msg => msg.sender === sender);
  }

  /**
   * Search by date range
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {Array} Messages in time range
   */
  searchByDate(startTime, endTime) {
    return this.messages.filter(msg =>
      msg.timestamp >= startTime && msg.timestamp <= endTime
    );
  }

  /**
   * Search by type (text, file, voice, etc)
   * @param {string} type - Message type
   * @returns {Array} Messages of that type
   */
  searchByType(type) {
    return this.messages.filter(msg => msg.type === type);
  }

  /**
   * Combined search with multiple filters
   * @param {Object} filters - { query, sender, startTime, endTime, type }
   * @returns {Array} Filtered messages
   */
  advancedSearch(filters) {
    let results = [...this.messages];

    if (filters.query) {
      const queryResults = this.search(filters.query);
      results = results.filter(msg =>
        queryResults.some(r => r.id === msg.id)
      );
    }

    if (filters.sender) {
      results = results.filter(msg => msg.sender === filters.sender);
    }

    if (filters.startTime) {
      results = results.filter(msg => msg.timestamp >= filters.startTime);
    }

    if (filters.endTime) {
      results = results.filter(msg => msg.timestamp <= filters.endTime);
    }

    if (filters.type) {
      results = results.filter(msg => msg.type === filters.type);
    }

    return results.map(msg => ({
      ...msg,
      snippet: filters.query ? this.getSnippet(msg.text, filters.query) : msg.text
    }));
  }

  /**
   * Get a snippet of text with match highlighted
   * @param {string} text - Full text
   * @param {string} query - Search query
   * @returns {string} Snippet with ... ellipsis
   */
  getSnippet(text, query, contextLength = 50) {
    if (!query || !text) return text.substring(0, 100);

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }

    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + query.length + contextLength);

    const before = start > 0 ? '...' : '';
    const after = end < text.length ? '...' : '';
    const snippet = text.substring(start, end);

    return `${before}${snippet}${after}`;
  }

  /**
   * Get message by ID
   * @param {string} messageId - Message ID
   * @returns {Object} Message or null
   */
  getMessageById(messageId) {
    return this.messages.find(msg => msg.id === messageId) || null;
  }

  /**
   * Get all messages (privacy warning)
   * @returns {Array} All messages in current session
   */
  getAllMessages() {
    return [...this.messages];
  }

  /**
   * Get stats about indexed messages
   */
  getStats() {
    return {
      totalMessages: this.messages.length,
      oldestMessage: this.messages.length > 0 ? this.messages[0].timestamp : null,
      newestMessage: this.messages.length > 0 ? this.messages[this.messages.length - 1].timestamp : null,
      byType: this.getCountByType(),
      bySender: this.getCountBySender()
    };
  }

  /**
   * Helper: Get message count by type
   */
  getCountByType() {
    const counts = {};
    this.messages.forEach(msg => {
      counts[msg.type] = (counts[msg.type] || 0) + 1;
    });
    return counts;
  }

  /**
   * Helper: Get message count by sender
   */
  getCountBySender() {
    const counts = {};
    this.messages.forEach(msg => {
      counts[msg.sender] = (counts[msg.sender] || 0) + 1;
    });
    return counts;
  }

  /**
   * Subscribe to changes
   * @param {Function} callback - Called when messages change
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  notify() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Message search listener error:', error);
      }
    });
  }

  /**
   * Clear all messages (privacy: on disconnect)
   */
  clear() {
    this.messages = [];
    this.searchHistory = [];
    this.notify();
  }

  /**
   * Clear search history only
   */
  clearSearchHistory() {
    this.searchHistory = [];
  }

  /**
   * Get search history
   * @returns {Array} Recent searches
   */
  getSearchHistory() {
    return [...this.searchHistory];
  }

  /**
   * Export current messages (privacy note: contains all current session data)
   * @returns {string} JSON export
   */
  exportMessages() {
    return JSON.stringify(this.messages, null, 2);
  }
}

// Export singleton instance
export default new MessageSearchManager();
