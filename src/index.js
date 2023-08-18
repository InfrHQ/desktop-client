const { app, BrowserWindow } = require('electron')
require('dotenv').config()

// Auto-updates
// require('update-electron-app')()

const path = require('path')
const { ipcMain } = require('electron')
const storage_client = require('./connectors/storage')
const storeData = require('./cron')

const handleServerChecks = require('./setup/handleServerChecks')
const handlePermissions = require('./setup/handlePermissions')

let mainWindow

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets/icons/icon.png'),
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'pages/index.html'))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // We cannot require the screen module until the app is ready.
  const { screen } = require('electron')

  // Create a window that fills the screen's available work area.
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.size
  storage_client.set('windowWidth', width)
  storage_client.set('windowHeight', height)

  setInterval(storeData, 3000)
  //setTimeout(storeData, 3000);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.on('appstorage-set', (event, data) => {
  storage_client.set(data['key'], data['value'])
})

ipcMain.handle('appstorage-get', (event, key) => {
  return storage_client.get(key)
})

ipcMain.handle('setup-perform-server-checks', async (event) => {
  return await handleServerChecks()
})

ipcMain.handle('setup-request-permissions', async (event) => {
  return await handlePermissions()
})

ipcMain.handle('setup-get-status', async (event) => {
  let server_status = storage_client.get('setup_check__server')
  let permissions_status = storage_client.get('setup_check__permissions')
  return {
    server_status,
    permissions_status,
  }
})

ipcMain.handle('show-window', async (event, window) => {
  mainWindow.loadFile(path.join(__dirname, window)).then(() => {
    mainWindow.show()
  })
})

ipcMain.handle('logout', async (event) => {
  storage_client.clear()
  mainWindow.loadFile(path.join(__dirname, 'pages/index.html')).then(() => {
    mainWindow.show()
  })
})
