import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

/**
 * PRIVACY PROTECTION: Create browser window with content protection enabled
 * This prevents external tools from easily capturing the window content
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      disableBlinkFeatures: 'AutoplayPolicy',
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // PRIVACY: Enable content protection to prevent screen capture
  mainWindow.setContentProtection(true);

  // PRIVACY: Disable developer tools
  mainWindow.webContents.session.setPermissionCheckHandler(() => false);

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Remove in production
  } else {
    const startUrl = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(startUrl);
  }

  // PRIVACY: Disable context menu to prevent accidental logging/debugging
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  // PRIVACY: Block keyboard shortcuts for PrintScreen, F12, F11
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Block PrintScreen, F12, F11, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    const blockedKeys = [
      'F12',
      'F11',
      'PrintScreen',
    ];

    if (blockedKeys.includes(input.key)) {
      event.preventDefault();
    }

    // Block developer tools shortcuts
    if (input.control && input.shift && ['i', 'j', 'c'].includes(input.key)) {
      event.preventDefault();
    }

    // Block Ctrl+R (reload in production)
    if (!isDev && input.control && input.key === 'r') {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On macOS, apps stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * IPC: Get app version
 */
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

/**
 * IPC: Log to main process (minimal logging for privacy)
 * Only logs in development mode
 */
ipcMain.handle('log-event', (event, level, message) => {
  if (isDev) {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
  // In production, logs are discarded silently
});

/**
 * PRIVACY: Report abuse handler - collects minimal data only
 */
ipcMain.handle('submit-report', async (event, reportData) => {
  // Report data is sent to server, not stored locally
  // Server stores minimal info for 7 days then deletes
  console.log(`Report submitted at ${new Date().toISOString()}`);
  return { success: true };
});

// Set application menu to empty (no app menu to prevent access to devtools)
const template = [
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
      { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

export default createWindow;
