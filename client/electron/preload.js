import { contextBridge, ipcMain } from 'electron';

/**
 * SECURITY: Preload script uses contextBridge to safely expose limited API
 * to the renderer process. No full Node.js access is given.
 */

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * IPC: Get application version
   */
  getAppVersion: () => ipcMain.invoke('get-app-version'),

  /**
   * IPC: Log events to main process (minimal, development only)
   */
  log: (level, message) => ipcMain.invoke('log-event', level, message),

  /**
   * IPC: Submit abuse report
   * Sends minimal data: room code, timestamp, hashed snippet
   */
  submitReport: (reportData) => ipcMain.invoke('submit-report', reportData),

  /**
   * Platform info for conditional rendering
   */
  platform: process.platform,
  isDev: process.env.NODE_ENV === 'development',
});
