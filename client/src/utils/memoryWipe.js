/**
 * Memory Wipe Manager
 * 
 * Securely clears sensitive data on disconnect:
 * - Zero-fill encryption keys
 * - Garbage collection forcing
 * - Clipboard clearing
 * - Local storage cleanup
 * - Session data wipeout
 */

class MemoryWipeManager {
  constructor() {
    this.sensitiveData = new Set();
    this.isWiping = false;
  }

  /**
   * Register sensitive data for secure cleanup
   * @param {object} dataObject - Object containing sensitive info
   * @param {string} identifier - Label for tracking
   */
  registerSensitiveData(dataObject, identifier) {
    this.sensitiveData.add({
      data: dataObject,
      identifier,
      timestamp: Date.now()
    });
  }

  /**
   * Zero-fill a string (overwrite with zeros)
   */
  zeroFill(str) {
    if (!str) return;
    try {
      const zeros = new Array(str.length + 1).join('\0');
      return zeros;
    } catch (e) {
      console.error('Zero-fill error:', e);
    }
  }

  /**
   * Deep clone object for overwriting
   */
  deepZeroFill(obj) {
    if (!obj) return null;

    try {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          
          if (typeof value === 'string') {
            obj[key] = this.zeroFill(value);
          } else if (typeof value === 'object' && value !== null) {
            this.deepZeroFill(value);
          } else if (typeof value === 'number') {
            obj[key] = 0;
          }
        }
      }
    } catch (e) {
      console.error('Deep zero-fill error:', e);
    }

    return obj;
  }

  /**
   * Clear clipboard of sensitive data
   */
  clearClipboard() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('')
          .catch(() => {
            // Clipboard API may not be available
            // Fallback: create hidden textarea and clear
            const textarea = document.createElement('textarea');
            textarea.value = '';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
          });
      }
    } catch (e) {
      console.error('Clipboard clear error:', e);
    }
  }

  /**
   * Clear local storage and session storage
   */
  clearStorage() {
    try {
      // Clear sensitive keys only
      const keysToDelete = [
        'sessionId',
        'roomCode',
        'encryptionKey',
        'peerKey',
        'rtcConfiguration'
      ];

      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Optional: Clear all (uncomment if desired)
      // localStorage.clear();
      // sessionStorage.clear();
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  }

  /**
   * Force garbage collection (browser dependent)
   */
  forceGarbageCollection() {
    try {
      // This only works with --expose-gc flag in Node.js/Electron
      if (window.gc) {
        window.gc();
        console.log('[Memory] Garbage collection forced');
      } else {
        // Fallback: create and discard large objects
        const dummy = new Array(1000000);
        dummy.length = 0;
      }
    } catch (e) {
      console.error('GC error:', e);
    }
  }

  /**
   * Wipe all registered sensitive data
   */
  wipeSensitiveData() {
    try {
      for (const entry of this.sensitiveData) {
        this.deepZeroFill(entry.data);
      }
      this.sensitiveData.clear();
      console.log('[Memory] Sensitive data wiped');
    } catch (e) {
      console.error('Sensitive data wipe error:', e);
    }
  }

  /**
   * Complete cleanup sequence
   * Call on disconnect/logout
   */
  async performFullWipe() {
    if (this.isWiping) return;
    this.isWiping = true;

    try {
      console.log('[Memory Wipe] Starting full cleanup sequence...');

      // Step 1: Wipe sensitive data
      this.wipeSensitiveData();

      // Step 2: Clear clipboard
      this.clearClipboard();

      // Step 3: Clear storage
      this.clearStorage();

      // Step 4: Force garbage collection
      this.forceGarbageCollection();

      // Step 5: Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[Memory Wipe] Cleanup complete');
    } catch (e) {
      console.error('Full wipe error:', e);
    } finally {
      this.isWiping = false;
    }
  }

  /**
   * Get memory wipe status
   */
  getStatus() {
    return {
      sensitiveDatabCount: this.sensitiveData.size,
      isWiping: this.isWiping,
      timestamp: Date.now()
    };
  }
}

export const memoryWipeManager = new MemoryWipeManager();
