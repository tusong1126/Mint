const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  arch: process.arch,
  systemVersion: process.getSystemVersion(),
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  storage: {
    read: (filename) => ipcRenderer.invoke('storage:read', filename),
    write: (filename, data) => ipcRenderer.invoke('storage:write', filename, data),
    dirs: () => ipcRenderer.invoke('storage:dirs'),
  },
  markdown: {
    list: () => ipcRenderer.invoke('markdown:list'),
    read: (filename) => ipcRenderer.invoke('markdown:read', filename),
    write: (filename, content) => ipcRenderer.invoke('markdown:write', filename, content),
    delete: (filename) => ipcRenderer.invoke('markdown:delete', filename),
  },
  system: {
    getCpu: () => ipcRenderer.invoke('system:cpu'),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximized: (callback) => {
      ipcRenderer.on('window:maximized', (_event, maximized) => callback(maximized))
    },
  },
  clipboard: {
    write: (text) => ipcRenderer.invoke('clipboard:write', text),
    copyImage: (imagePath) => ipcRenderer.invoke('clipboard:copyImage', imagePath),
    readImageFull: (imagePath) => ipcRenderer.invoke('clipboard:readImageFull', imagePath),
    deleteImage: (imagePath) => ipcRenderer.invoke('clipboard:deleteImage', imagePath),
    openFileLocation: (filePath) => ipcRenderer.invoke('clipboard:openFileLocation', filePath),
    paste: () => ipcRenderer.invoke('clipboard:paste'),
    startWatch: () => ipcRenderer.invoke('clipboard:startWatch'),
    stopWatch: () => ipcRenderer.invoke('clipboard:stopWatch'),
    onChanged: (callback) => {
      ipcRenderer.on('clipboard:changed', (_event, data) => callback(data))
    },
    removeChanged: () => {
      ipcRenderer.removeAllListeners('clipboard:changed')
    },
  },
})