const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
require('dotenv').config()
const storage_client = require('./connectors/storage')
const telemetry = require('./utils/telemetry')
const DataStore = require('./cron')
const handleServerChecks = require('./setup/handleServerChecks')
const handlePermissions = require('./setup/handlePermissions')
const {
    setIncognitoKeywords,
    getIncognitoKeywords,
} = require('./tools/incognitoKeywords')
const initSentry = require('./connectors/sentry')

// Uncomment if you want to enable auto-updates
require('update-electron-app')()
initSentry()

let mainWindow
let dataStoreCron = new DataStore()

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit()
}

/**
 * Create the main browser window.
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'assets/icons/icon.png'),
    })
    telemetry('app__start')

    mainWindow.loadFile(path.join(__dirname, 'pages/index.html'))

    // Uncomment if you want to open DevTools by default
    // mainWindow.webContents.openDevTools()

    setWindowDimensionsToStorage()
    dataStoreCron.run()
}

/**
 * Set the screen's available work area dimensions to the storage client.
 */
function setWindowDimensionsToStorage() {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.size
    storage_client.set('windowWidth', width)
    storage_client.set('windowHeight', height)
}

// Event to be called when Electron is ready to create browser windows.
app.on('ready', createWindow)

// Quit the app when all windows are closed (except on macOS).
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// On macOS, recreate a window when the dock icon is clicked and no other windows are open.
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// IPC handlers
ipcMain.on('appstorage-set', (event, data) => {
    storage_client.set(data['key'], data['value'])
})

ipcMain.handle('appstorage-get', (event, key) => {
    return storage_client.get(key)
})

ipcMain.handle('setup-perform-server-checks', async (event) => {
    const resp = await handleServerChecks()
    dataStoreCron.updateData()
    return resp
})

ipcMain.handle('setup-request-permissions', async (event) => {
    const resp = await handlePermissions(dataStoreCron)
    return resp
})

ipcMain.handle('setup-get-status', async (event) => {
    return {
        server_status: storage_client.get('setup_check__server'),
        permissions_status: storage_client.get('setup_check__permissions'),
    }
})

ipcMain.handle('dashboard-get-incognito-keywords', async (event) => {
    return getIncognitoKeywords()
})

ipcMain.handle('dashboard-set-incognito-keywords', async (event, keywords) => {
    let resp = setIncognitoKeywords(keywords)
    dataStoreCron.updateData()
    return resp
})

ipcMain.handle('dashboard-get-code-storage-enabled', async (event) => {
    let val = storage_client.get('code_storage_enabled')
    return val
})

ipcMain.handle('dashboard-pause-cron', async (event) => {
    dataStoreCron.pause()
})

ipcMain.handle('dashboard-resume-cron', async (event) => {
    dataStoreCron.resume()
})

ipcMain.handle('dashboard-ispaused-cron', async (event) => {
    return dataStoreCron.isPaused()
})

ipcMain.handle('dashboard-set-code-storage-enabled', async (event, enabled) => {
    storage_client.set('code_storage_enabled', enabled)
    dataStoreCron.updateData()
})

ipcMain.handle('show-window', async (event, window) => {
    await mainWindow.loadFile(path.join(__dirname, window))
    mainWindow.show()
})

ipcMain.handle('get-window', async (event) => {
    return mainWindow.getURL()
})

ipcMain.handle('logout', async (event) => {
    storage_client.clear()
    dataStoreCron.stop()
    await mainWindow.loadFile(path.join(__dirname, 'pages/index.html'))
    mainWindow.show()
})
