const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;
let isDockMode = false;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the React app
  const startUrl = process.env.ELECTRON_START_URL || 
    url.format({
      pathname: path.join(__dirname, '../client/build/index.html'),
      protocol: 'file:',
      slashes: true
    });
    
  mainWindow.loadURL(startUrl);

  // Handle window closing
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle dock mode toggle
ipcMain.on('toggle-dock-mode', (event, enabled) => {
  isDockMode = enabled;
  
  if (isDockMode) {
    // Switch to dock mode (compact & always on top)
    mainWindow.setSize(320, 600);
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setResizable(false);
    mainWindow.setMinimizable(true);
  } else {
    // Switch back to standard mode
    mainWindow.setSize(1200, 800);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
  }
});

// App lifecycle events
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});