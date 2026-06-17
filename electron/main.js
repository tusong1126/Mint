const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

let mainWindow

const isMac = process.platform === 'darwin'

const STORAGE_DIR = path.join(app.getPath('userData'), 'data')
const MD_DIR = path.join(app.getPath('userData'), 'markdown')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    ...(isMac
      ? { titleBarStyle: 'hiddenInset' }
      : { frame: false }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized', false)
  })
}

ipcMain.handle('storage:read', (_event, filename) => {
  ensureDir(STORAGE_DIR)
  const filePath = path.join(STORAGE_DIR, `${filename}.json`)
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(raw)
    }
  } catch { /* ignore corrupt file */ }
  return null
})

ipcMain.handle('storage:write', (_event, filename, data) => {
  ensureDir(STORAGE_DIR)
  const filePath = path.join(STORAGE_DIR, `${filename}.json`)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
})

ipcMain.handle('markdown:list', () => {
  ensureDir(MD_DIR)
  try {
    const files = fs.readdirSync(MD_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const stat = fs.statSync(path.join(MD_DIR, f))
        return { name: f.replace(/\.md$/, ''), filename: f, mtime: stat.mtimeMs }
      })
      .sort((a, b) => b.mtime - a.mtime)
    return files
  } catch {
    return []
  }
})

ipcMain.handle('markdown:read', (_event, filename) => {
  ensureDir(MD_DIR)
  const filePath = path.join(MD_DIR, filename)
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8')
    }
  } catch { /* ignore */ }
  return ''
})

ipcMain.handle('markdown:write', (_event, filename, content) => {
  ensureDir(MD_DIR)
  const filePath = path.join(MD_DIR, filename)
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return true
  } catch {
    return false
  }
})

ipcMain.handle('markdown:delete', (_event, filename) => {
  const filePath = path.join(MD_DIR, filename)
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
  } catch { /* ignore */ }
  return false
})

ipcMain.handle('system:cpu', () => {
  try {
    if (process.platform === 'darwin') {
      const brand = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf-8' }).trim()
      return brand
    }
    if (process.platform === 'win32') {
      const brand = execSync('wmic cpu get name /format:value', { encoding: 'utf-8' })
        .split('\r\n')
        .find((l) => l.startsWith('Name='))
        ?.replace('Name=', '')
        .trim()
      return brand || 'Unknown CPU'
    }
  } catch { /* ignore */ }
  return ''
})

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})