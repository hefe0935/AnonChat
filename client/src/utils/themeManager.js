/**
 * Theme Manager
 * Handles dark/light mode toggle with persistence
 * Uses localStorage to save user preference
 * Auto-detects system theme preference
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'dark'; // default
    this.listeners = [];
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  init() {
    const savedTheme = localStorage.getItem('app-theme');

    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      // Auto-detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }

    this.applyTheme();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('app-theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Set theme and save preference
   */
  setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') {
      console.warn('Invalid theme:', theme);
      return;
    }

    this.currentTheme = theme;
    localStorage.setItem('app-theme', theme);
    this.applyTheme();

    // Notify all listeners
    this.listeners.forEach((callback) => callback(theme));
  }

  /**
   * Toggle between dark and light
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Apply theme to DOM
   */
  applyTheme() {
    const root = document.documentElement;

    if (this.currentTheme === 'dark') {
      root.style.colorScheme = 'dark';
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
      document.body.style.backgroundColor = '#0f172a'; // slate-900
      document.body.style.color = '#f1f5f9'; // slate-100
    } else {
      root.style.colorScheme = 'light';
      root.classList.remove('dark-mode');
      root.classList.add('light-mode');
      document.body.style.backgroundColor = '#f8fafc'; // slate-50
      document.body.style.color = '#1e293b'; // slate-800
    }
  }

  /**
   * Subscribe to theme changes
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Check if dark mode
   */
  isDark() {
    return this.currentTheme === 'dark';
  }

  /**
   * Get theme colors
   */
  getColors() {
    return this.currentTheme === 'dark'
      ? {
          bg: '#0f172a',
          bgSecondary: '#1e293b',
          text: '#f1f5f9',
          textSecondary: '#cbd5e1',
          border: '#334155',
          accent: '#3b82f6',
        }
      : {
          bg: '#f8fafc',
          bgSecondary: '#f1f5f9',
          text: '#1e293b',
          textSecondary: '#64748b',
          border: '#e2e8f0',
          accent: '#3b82f6',
        };
  }
}

export default new ThemeManager();
