/**
 * Notification Manager
 * Handles browser notifications for messages and events
 * Respects privacy settings - no message content shown when privacy mode enabled
 */

class NotificationManager {
  constructor() {
    this.permissionGranted = false;
    this.isVisible = true;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        this.permissionGranted = permission === 'granted';
        return this.permissionGranted;
      } catch (err) {
        console.error('Error requesting notification permission:', err);
        return false;
      }
    }

    return false;
  }

  /**
   * Check if browser is visible/focused
   */
  checkVisibility() {
    this.isVisible = !document.hidden;
  }

  /**
   * Show notification for new message
   * Privacy: Can hide message content if privacy mode enabled
   */
  notifyMessage(message, privacyMode = false) {
    if (!this.permissionGranted || this.isVisible) return;

    const title = privacyMode ? '📬 New Message' : '💬 New Message';
    const body = privacyMode ? 'You have a new message' : message;
    const options = {
      icon: '💬',
      tag: 'message-notification',
      requireInteraction: false,
      badge: '💬',
      vibrate: [200, 100, 200],
    };

    try {
      new Notification(title, {
        ...options,
        body: body.substring(0, 100), // Limit to 100 chars for privacy
      });
    } catch (err) {
      console.error('Error showing notification:', err);
    }
  }

  /**
   * Show notification for incoming call
   */
  notifyIncomingCall() {
    if (!this.permissionGranted) return;

    const options = {
      icon: '📞',
      tag: 'call-notification',
      requireInteraction: true,
      badge: '📞',
      vibrate: [500, 200, 500],
    };

    try {
      new Notification('📞 Incoming Call', {
        ...options,
        body: 'Someone is calling you. Click to answer.',
      });
    } catch (err) {
      console.error('Error showing call notification:', err);
    }
  }

  /**
   * Show generic notification
   */
  notify(title, options = {}) {
    if (!this.permissionGranted || this.isVisible) return;

    try {
      new Notification(title, {
        icon: '🔔',
        badge: '🔔',
        ...options,
      });
    } catch (err) {
      console.error('Error showing notification:', err);
    }
  }

  /**
   * Close all notifications
   */
  closeAll() {
    if ('Notification' in window) {
      const notifications = Notification.get ? Notification.get() : [];
      notifications.forEach((notif) => notif.close());
    }
  }
}

// Setup visibility listener
if (typeof window !== 'undefined') {
  const notificationManager = new NotificationManager();

  document.addEventListener('visibilitychange', () => {
    notificationManager.checkVisibility();
  });

  window.addEventListener('focus', () => {
    notificationManager.isVisible = true;
  });

  window.addEventListener('blur', () => {
    notificationManager.isVisible = false;
  });

  window.notificationManager = notificationManager;
}

export default new NotificationManager();
