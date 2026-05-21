/**
 * Keyboard Shortcuts Manager
 * Handles keyboard shortcuts for the app
 * Privacy: No shortcuts are logged or stored
 */

class KeyboardShortcutsManager {
  constructor() {
    this.shortcuts = new Map();
  }

  /**
   * Initialize keyboard shortcuts
   */
  init() {
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  /**
   * Register a keyboard shortcut
   */
  register(keys, callback, description) {
    const keyStr = keys.toLowerCase();
    this.shortcuts.set(keyStr, { callback, description });
    console.log(`Shortcut registered: ${keys} - ${description}`);
  }

  /**
   * Handle keydown event
   */
  handleKeydown(e) {
    // Don't trigger if user is typing in input
    if (
      document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA'
    ) {
      // Exception: Ctrl+Enter to send message
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === 'Enter' &&
        document.activeElement.tagName === 'INPUT'
      ) {
        const event = new Event('send-message', { bubbles: true });
        document.activeElement.dispatchEvent(event);
      }
      return;
    }

    // Build key combination string
    const keys = [];
    if (e.ctrlKey || e.metaKey) keys.push('ctrl');
    if (e.shiftKey) keys.push('shift');
    if (e.altKey) keys.push('alt');
    keys.push(e.key.toLowerCase());

    const keyStr = keys.join('+');

    // Check if shortcut exists
    if (this.shortcuts.has(keyStr)) {
      e.preventDefault();
      const { callback } = this.shortcuts.get(keyStr);
      callback();
    }
  }

  /**
   * Get all shortcuts
   */
  getShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([keys, { description }]) => ({
      keys,
      description,
    }));
  }

  /**
   * Unregister shortcut
   */
  unregister(keys) {
    this.shortcuts.delete(keys.toLowerCase());
  }
}

export default new KeyboardShortcutsManager();
