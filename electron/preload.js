const { contextBridge, ipcRenderer } = require('electron');

// Expose electron API to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Send messages to main process
  send: (channel, data) => {
    // Whitelist channels for security
    const validChannels = ['toggle-dock-mode'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  // Receive messages from main process
  receive: (channel, func) => {
    const validChannels = ['window-state-changed'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});