const { app, BrowserWindow, ipcMain, clipboard, nativeImage, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

let mainWindow
let clipboardTimer = null
let lastClipboardText = ''
let lastImageHash = ''

let lastFilePath = ''
const isMac = process.platform === 'darwin'

const STORAGE_DIR = path.join(app.getPath('userData'), 'data')
const MD_DIR = path.join(app.getPath('userData'), 'markdown')
const IMG_DIR = path.join(app.getPath('userData'), 'clipboard-images')

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

ipcMain.handle('storage:dirs', () => ({
  data: STORAGE_DIR,
  markdown: MD_DIR,
}))

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

// ── Clipboard ──

ipcMain.handle('clipboard:write', (_event, text) => {
  clipboard.writeText(text)
})

ipcMain.handle('clipboard:copyImage', (_event, imagePath) => {
  try {
    const img = nativeImage.createFromPath(imagePath)
    if (!img.isEmpty()) {
      clipboard.writeImage(img)
      return true
    }
  } catch { /* ignore */ }
  return false
})

function saveClipboardImage() {
  const img = clipboard.readImage()
  if (img.isEmpty()) return null
  ensureDir(IMG_DIR)
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const filePath = path.join(IMG_DIR, `${id}.png`)
  fs.writeFileSync(filePath, img.toPNG())
  const thumbBuf = img.resize({ width: 150 }).toJPEG(75)
  const thumbBase64 = `data:image/jpeg;base64,${thumbBuf.toString('base64')}`
  const size = img.getSize()
  return { id, imagePath: filePath, thumbnail: thumbBase64, width: size.width, height: size.height }
}

function readFileUrl() {
  if (isMac) {
    try {
      const plist = clipboard.read('NSFilenamesPboardType')
      if (plist) {
        if (plist.startsWith('<?xml') || plist.startsWith('<')) {
          const match = plist.match(/<string>(.*?)<\/string>/g)
          if (match) {
            const paths = match.map(s => s.replace(/<\/?string>/g, '')).filter(Boolean)
            if (paths.length > 0) return paths[0]
          }
        } else {
          const lines = plist.split('\n').map(l => l.trim()).filter(Boolean)
          if (lines.length > 0) return lines[0]
        }
      }
    } catch { /* ignore */ }
    try {
      const path = execSync(
        `osascript -e 'try' -e 'POSIX path of (item 1 of (get the clipboard as «class furl»))' -e 'end try' 2>/dev/null || echo ""`,
        { encoding: 'utf-8', timeout: 3000 }
      ).trim()
      if (path) return path
    } catch { /* ignore */ }
    return ''
  }
  try {
    const name = clipboard.read('FileNameW')
    if (name) return name
  } catch { /* ignore */ }
  try {
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      $files = [System.Windows.Forms.Clipboard]::GetFileDropList()
      if ($files.Count -gt 0) { Write-Output $files[0] }
    `
    const result = execSync(
      `powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`,
      { encoding: 'utf-8', timeout: 3000 }
    ).trim()
    if (result) return result
  } catch { /* ignore */ }
  return ''
}

ipcMain.handle('clipboard:startWatch', () => {
  if (clipboardTimer) return
  lastClipboardText = clipboard.readText()
  const img = clipboard.readImage()
  lastImageHash = img.isEmpty() ? '' : img.resize({ width: 20 }).toDataURL()
  lastFilePath = readFileUrl()
  clipboardTimer = setInterval(() => {
    const currentText = clipboard.readText()
    const currentImage = clipboard.readImage()
    const filePath = readFileUrl()

    if (filePath && filePath !== lastFilePath) {
      lastFilePath = filePath
      lastImageHash = currentImage.isEmpty() ? '' : currentImage.resize({ width: 20 }).toDataURL()
      lastClipboardText = currentText
      const data = saveClipboardImage() || {}
      mainWindow?.webContents.send('clipboard:changed', { type: 'file', content: currentText || path.basename(filePath), filePath, ...data })
      return
    }

    if (!currentImage.isEmpty()) {
      const hash = currentImage.resize({ width: 20 }).toDataURL()
      if (hash !== lastImageHash) {
        lastImageHash = hash
        lastClipboardText = currentText
        const data = saveClipboardImage()
        if (data) {
          mainWindow?.webContents.send('clipboard:changed', { type: 'image', ...data })
        }
        return
      }
    }

    if (currentText && currentText !== lastClipboardText) {
      lastClipboardText = currentText
      mainWindow?.webContents.send('clipboard:changed', { type: 'text', content: currentText })
    }
  }, 500)
})

ipcMain.handle('clipboard:stopWatch', () => {
  if (clipboardTimer) {
    clearInterval(clipboardTimer)
    clipboardTimer = null
  }
})

ipcMain.handle('clipboard:readImageFull', (_event, imagePath) => {
  try {
    const img = nativeImage.createFromPath(imagePath)
    if (!img.isEmpty()) {
      const buf = img.toJPEG(85)
      return `data:image/jpeg;base64,${buf.toString('base64')}`
    }
  } catch { /* ignore */ }
  return null
})

ipcMain.handle('clipboard:paste', () => {
  if (isMac) {
    execSync(`osascript -e 'tell application "System Events" to keystroke "v" using command down'`)
  } else {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("^v")
    `
    execSync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`)
  }
})

ipcMain.handle('clipboard:openFileLocation', (_event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath)
      return true
    }
    const dir = path.dirname(filePath)
    if (fs.existsSync(dir)) {
      shell.openPath(dir)
      return true
    }
  } catch (e) {
    console.error('[clipboard] openFileLocation error:', e)
  }
  return false
})

ipcMain.handle('clipboard:deleteImage', (_event, imagePath) => {
  try {
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }
    const thumbPath = imagePath.replace(/\.png$/, '-thumb.png')
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath)
    }
    return true
  } catch { return false }
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