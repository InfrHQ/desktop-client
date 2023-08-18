const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('appStorage', {
  set: function (key, value) {
    ipcRenderer.send('appstorage-set', { key, value })
  },
  get: async function (key) {
    let val = await ipcRenderer.invoke('appstorage-get', key)
    return val
  },
})

contextBridge.exposeInMainWorld('infrSetup', {
  performCheckServer: async function () {
    let resp = await ipcRenderer.invoke('setup-perform-server-checks')
    return resp
  },
  performCheckPermissions: async function () {
    let resp = await ipcRenderer.invoke('setup-request-permissions')
    return resp
  },
  getStatus: async function () {
    let resp = await ipcRenderer.invoke('setup-get-status')
    return resp
  },
})

contextBridge.exposeInMainWorld('infrWindow', {
  show: async function (window) {
    await ipcRenderer.invoke('show-window', window)
  },
})

contextBridge.exposeInMainWorld('infrLogout', {
  logout: async function () {
    await ipcRenderer.invoke('logout')
  },
})
