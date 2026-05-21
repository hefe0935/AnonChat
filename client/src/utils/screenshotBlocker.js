/**
 * Screenshot Blocker
 * Prevents users from taking screenshots or screen recordings
 * Makes the screen black when capture is attempted
 */

class ScreenshotBlocker {
  constructor() {
    this.isBlocked = false;
    this.overlay = null;
  }

  /**
   * Initialize screenshot blocking
   */
  init() {
    // Block keyboard shortcuts
    this.blockKeyboardShortcuts();
    
    // Block print screen
    this.blockPrintScreen();
    
    // Block right-click context menu
    this.blockContextMenu();
    
    // Block developer tools
    this.blockDevTools();
    
    // Detect screen recording attempts
    this.detectScreenRecording();
    
    console.log('Screenshot blocker initialized');
  }

  /**
   * Block keyboard shortcuts (Ctrl+Shift+S, Shift+F2, etc)
   */
  blockKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Windows Shift+S (screenshot)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        e.stopPropagation();
        this.showBlockMessage('Screenshots are disabled for privacy');
        return false;
      }

      // Windows Shift+F2 (screenshot tool)
      if (e.shiftKey && e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I (Developer tools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        this.showBlockMessage('Developer tools are disabled');
        return false;
      }

      // F12 (Developer tools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        this.showBlockMessage('Developer tools are disabled');
        return false;
      }

      // Ctrl+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+C (Element inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S (Save page) - prevent saving chat/data
      if ((e.shiftKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        this.showBlockMessage('Page saving is disabled for privacy');
        return false;
      }

      if ((e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        this.showBlockMessage('Page saving is disabled for privacy');
        return false;
      }


      // Right-click context menu
      if (e.key === 'Apps') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  /**
   * Block PrintScreen key
   */
  blockPrintScreen() {
    // Old method - still works in some browsers
    document.addEventListener('keyup', (e) => {
      if (e.keyCode === 44) { // PrintScreen
        e.preventDefault();
        e.stopPropagation();
        this.showBlockMessage('Screenshots are not allowed');
        this.blackoutScreen();
        return false;
      }
    }, true);

    // Also block PrintScreen with Alt
    document.addEventListener('keydown', (e) => {
      if (e.keyCode === 44) { // PrintScreen
        e.preventDefault();
        e.stopPropagation();
        this.showBlockMessage('Screenshots are not allowed');
        this.blackoutScreen();
        return false;
      }
    }, true);
  }

  /**
   * Block right-click context menu
   */
  blockContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showBlockMessage('Context menu is disabled');
      return false;
    }, true);
  }

  /**
   * Block developer tools access
   */
  blockDevTools() {
    // Detect DevTools opening
    const threshold = 160;
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        this.showBlockMessage('Developer tools are disabled');
        document.body.style.display = 'none';
        setTimeout(() => {
          window.location.href = 'about:blank';
        }, 1000);
      }
    }, 500);

    // Block console commands
    window.console.log = () => {};
    window.console.error = () => {};
    window.console.warn = () => {};
  }

  /**
   * Detect screen recording attempts (modern browsers)
   */
  detectScreenRecording() {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        // A new screen capture device was detected
        console.log('Screen recording activity detected');
      });
    }
  }

  /**
   * Make screen black when screenshot is attempted
   */
  blackoutScreen() {
    if (this.isBlocked) return;

    this.isBlocked = true;

    // Create full-screen black overlay
    const overlay = document.createElement('div');
    overlay.id = 'screenshot-blocker-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000000;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeOut 1s ease-in-out 2s forwards;
    `;

    // Add message
    const message = document.createElement('div');
    message.style.cssText = `
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
    `;
    message.textContent = '🔒 Screenshots are disabled for privacy';

    overlay.appendChild(message);
    document.body.appendChild(overlay);

    // Add fade-out animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      #screenshot-blocker-overlay {
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    // Remove overlay after 3 seconds
    setTimeout(() => {
      overlay.remove();
      this.isBlocked = false;
    }, 3000);
  }

  /**
   * Show block message to user
   */
  showBlockMessage(message) {
    console.log('🔒 ' + message);
    this.blackoutScreen();
  }

  /**
   * Disable copy/paste for security
   */
  disableCopyPaste() {
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      this.showBlockMessage('Copy is disabled');
      return false;
    });

    document.addEventListener('cut', (e) => {
      e.preventDefault();
      this.showBlockMessage('Cut is disabled');
      return false;
    });
  }

  /**
   * Prevent iframe embedding
   */
  preventEmbedding() {
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }
  }

  /**
   * Add watermark to screen
   */
  addWatermark() {
    // Remove existing watermark if present
    const old = document.getElementById('privacy-watermark');
    if (old) old.remove();

    const watermark = document.createElement('div');
    watermark.id = 'privacy-watermark';
    watermark.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.08);
      color: rgba(0, 0, 0, 0.18);
      padding: 10px 20px;
      border-radius: 5px;
      font-size: 13px;
      pointer-events: none;
      z-index: 1000000;
      font-family: monospace;
      user-select: none;
    `;
    // Generate a random anonymous session string
    const anonId = 'ANON-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = new Date().toLocaleTimeString();
    watermark.textContent = `🔒 Anonymous Session | ${anonId} | ${timestamp}`;
    document.body.appendChild(watermark);
    // Update watermark every minute to rotate timestamp
    if (!this._watermarkInterval) {
      this._watermarkInterval = setInterval(() => {
        this.addWatermark();
      }, 60000);
    }
  }

  /**
   * Show privacy overlay if session is idle for too long
   * (does not reveal user identity)
   */
  enableIdlePrivacyOverlay(timeoutMs = 300000) { // default 5 min
    if (this._idleHandler) return;
    let idleTimer;
    const showOverlay = () => {
      if (document.getElementById('idle-privacy-overlay')) return;
      const overlay = document.createElement('div');
      overlay.id = 'idle-privacy-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.95);
        z-index: 1000001;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 2rem;
        font-family: monospace;
      `;
      overlay.textContent = '🔒 Privacy Mode: Session Idle';
      document.body.appendChild(overlay);
    };
    const removeOverlay = () => {
      const overlay = document.getElementById('idle-privacy-overlay');
      if (overlay) overlay.remove();
    };
    const resetTimer = () => {
      clearTimeout(idleTimer);
      removeOverlay();
      idleTimer = setTimeout(showOverlay, timeoutMs);
    };
    ['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, resetTimer, true);
    });
    resetTimer();
    this._idleHandler = true;
  }

  /**
   * Obfuscate user-identifying elements (e.g., avatars, usernames)
   * Call this in privacy mode to blur/hide elements with specific classes
   * (Assumes .user-avatar, .user-name classes are used for such elements)
   */
  obfuscateUserElements() {
    // Blur avatars
    document.querySelectorAll('.user-avatar').forEach(el => {
      el.style.filter = 'blur(12px) grayscale(1)';
    });
    // Hide or blur usernames
    document.querySelectorAll('.user-name').forEach(el => {
      el.style.filter = 'blur(8px)';
      el.textContent = 'Anonymous';
    });
  }
}

// Export singleton instance
export default new ScreenshotBlocker();
