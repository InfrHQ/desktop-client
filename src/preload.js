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

contextBridge.exposeInMainWorld('infrDashboard', {
    getIncognitoKeywords: async function () {
        let resp = await ipcRenderer.invoke('dashboard-get-incognito-keywords')
        return resp
    },
    setIncognitoKeywords: async function (keywords) {
        let resp = await ipcRenderer.invoke(
            'dashboard-set-incognito-keywords',
            keywords,
        )
        return resp
    },
    getCodeStorageEnabled: async function () {
        let resp = await ipcRenderer.invoke(
            'dashboard-get-code-storage-enabled',
        )
        return resp
    },
    setCodeStorageEnabled: async function (enabled) {
        let resp = await ipcRenderer.invoke(
            'dashboard-set-code-storage-enabled',
            enabled,
        )
        return resp
    },
})

contextBridge.exposeInMainWorld('infrWindow', {
    show: async function (window) {
        await ipcRenderer.invoke('show-window', window)
    },
    getCurrentPage: async function () {
        let resp = await ipcRenderer.invoke('get-window')
        return resp
    },
})

contextBridge.exposeInMainWorld('infrLogout', {
    logout: async function () {
        await ipcRenderer.invoke('logout')
    },
})
