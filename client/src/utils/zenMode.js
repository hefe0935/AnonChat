/**
 * Zen Mode Manager
 * 
 * Features:
 * - Minimal UI mode (hide non-essential elements)
 * - Distraction-free calling/messaging
 * - Customizable hotkeys for hidden functions
 */

class ZenModeManager {
  constructor() {
    this.isZenMode = false;
    this.hiddenElements = [];
    this.hotkeys = {
      toggleZen: 'Z',      // Press Z to toggle
      showChat: 'C',       // Press C to show/hide chat
      showStats: 'S',      // Press S to show/hide stats
      callMenu: 'V',       // Press V for call controls
      settings: 'Ctrl+E'   // Press Ctrl+E for settings
    };
    this.visibilityStates = {
      chat: true,
      stats: false,
      callControls: true,
      settings: false,
      banner: true
    };
  }

  /**
   * Enable Zen Mode
   */
  enableZenMode() {
    this.isZenMode = true;
    this.applyZenCSS();
    this.setupHotkeys();
    console.log('[ZenMode] Enabled');
    return { enabled: true };
  }

  /**
   * Disable Zen Mode
   */
  disableZenMode() {
    this.isZenMode = false;
    this.removeZenCSS();
    this.removeHotkeys();
    console.log('[ZenMode] Disabled');
    return { enabled: false };
  }

  /**
   * Toggle Zen Mode
   */
  toggleZenMode() {
    if (this.isZenMode) {
      return this.disableZenMode();
    } else {
      return this.enableZenMode();
    }
  }

  /**
   * Apply Zen CSS styles
   */
  applyZenCSS() {
    const style = document.createElement('style');
    style.id = 'zen-mode-styles';
    style.innerHTML = `
      /* Zen Mode CSS */
      
      body.zen-mode {
        background: #1a1a1a;
        color: #ffffff;
      }

      body.zen-mode .zen-hidden {
        display: none !important;
      }

      body.zen-mode .chat-container {
        width: 100%;
        max-height: 200px;
        opacity: 0.7;
      }

      body.zen-mode .stats-panel {
        position: fixed;
        bottom: 10px;
        right: 10px;
        opacity: 0.5;
        transition: opacity 0.2s;
      }

      body.zen-mode .stats-panel:hover {
        opacity: 1;
      }

      body.zen-mode .call-controls {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        padding: 10px 20px;
        border-radius: 50px;
        border: 1px solid #444;
      }

      body.zen-mode .call-timer {
        font-size: 2.5rem;
        text-align: center;
        color: #4ade80;
        font-weight: bold;
        font-family: 'Courier New', monospace;
      }

      body.zen-mode .header {
        opacity: 0.5;
        background: transparent;
      }

      body.zen-mode .logo {
        font-size: 0.8rem;
      }

      body.zen-mode .watermark {
        opacity: 0.2;
      }

      /* Zen Mode Hints */
      body.zen-mode .zen-hints {
        position: fixed;
        top: 10px;
        right: 10px;
        font-size: 0.8rem;
        color: #666;
        opacity: 0;
        transition: opacity 0.2s;
      }

      body.zen-mode:hover .zen-hints {
        opacity: 1;
      }

      /* Zen Mode Focus */
      body.zen-mode video,
      body.zen-mode audio {
        width: 100%;
        height: 100%;
      }

      body.zen-mode .main-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 0;
      }
    `;

    document.head.appendChild(style);
    document.body.classList.add('zen-mode');
  }

  /**
   * Remove Zen CSS styles
   */
  removeZenCSS() {
    const style = document.getElementById('zen-mode-styles');
    if (style) {
      style.remove();
    }
    document.body.classList.remove('zen-mode');
  }

  /**
   * Setup Zen Mode hotkeys
   */
  setupHotkeys() {
    document.addEventListener('keydown', this.handleZenHotkey.bind(this));
  }

  /**
   * Remove Zen Mode hotkeys
   */
  removeHotkeys() {
    document.removeEventListener('keydown', this.handleZenHotkey.bind(this));
  }

  /**
   * Handle Zen Mode hotkey
   */
  handleZenHotkey(event) {
    if (!this.isZenMode) return;

    // Check for hotkey combinations
    const key = event.key.toUpperCase();
    const isCtrl = event.ctrlKey;

    if (key === this.hotkeys.toggleZen) {
      event.preventDefault();
      this.toggleZenMode();
    } else if (key === this.hotkeys.showChat) {
      event.preventDefault();
      this.toggleVisibility('chat');
    } else if (key === this.hotkeys.showStats) {
      event.preventDefault();
      this.toggleVisibility('stats');
    } else if (key === this.hotkeys.callMenu) {
      event.preventDefault();
      this.toggleVisibility('callControls');
    }
  }

  /**
   * Toggle element visibility
   */
  toggleVisibility(element) {
    this.visibilityStates[element] = !this.visibilityStates[element];

    const selector = this.getElementSelector(element);
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
      if (this.visibilityStates[element]) {
        el.classList.remove('zen-hidden');
      } else {
        el.classList.add('zen-hidden');
      }
    });

    console.log(`[ZenMode] ${element} visibility:`, this.visibilityStates[element]);
  }

  /**
   * Get element selector
   */
  getElementSelector(element) {
    const selectors = {
      chat: '.chat-container',
      stats: '.stats-panel',
      callControls: '.call-controls',
      settings: '.settings-panel',
      banner: '.header'
    };
    return selectors[element] || '.zen-hidden';
  }

  /**
   * Get hotkey hints
   */
  getHotkeyHints() {
    return `
      Zen Mode Hotkeys:
      Z - Toggle Zen Mode
      C - Show/Hide Chat
      S - Show/Hide Stats
      V - Call Controls
      Ctrl+E - Settings
    `;
  }

  /**
   * Customize hotkey
   */
  setHotkey(action, key) {
    if (this.hotkeys.hasOwnProperty(action)) {
      this.hotkeys[action] = key;
      console.log(`[ZenMode] Hotkey updated: ${action} -> ${key}`);
      return true;
    }
    return false;
  }

  /**
   * Get Zen Mode status
   */
  getStatus() {
    return {
      isZenMode: this.isZenMode,
      visibilityStates: { ...this.visibilityStates },
      hotkeys: { ...this.hotkeys }
    };
  }

  /**
   * Export Zen Mode settings
   */
  exportSettings() {
    return {
      hotkeys: { ...this.hotkeys },
      visibilityStates: { ...this.visibilityStates },
      exportedAt: Date.now()
    };
  }

  /**
   * Import Zen Mode settings
   */
  importSettings(settings) {
    if (settings.hotkeys) {
      Object.assign(this.hotkeys, settings.hotkeys);
    }
    if (settings.visibilityStates) {
      Object.assign(this.visibilityStates, settings.visibilityStates);
    }
    console.log('[ZenMode] Settings imported');
  }
}

export const zenModeManager = new ZenModeManager();
