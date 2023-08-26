'use strict'
const path = require('path')
const fs = require('fs')
const { isElectron } = require('electron-util/node')
const { isMacOSVersionGreaterThanOrEqualTo } = require('./macVersion')
const { execSync } = require('child_process')
const permissionExists = isMacOSVersionGreaterThanOrEqualTo('10.15')
const { systemPreferences } = require('electron')
let filePath

if (isElectron) {
    const { api, openSystemPreferences } = require('electron-util')

    exports.openSystemPreferences = () =>
        openSystemPreferences('security', 'Privacy_ScreenCapture')

    filePath =
        api.app &&
        path.join(
            api.app.getPath('userData'),
            '.has-app-requested-screen-capture-permissions',
        )
}

exports.hasScreenCapturePermission = () => {
    if (!permissionExists) {
        return true
    }
    const hasPermission =
        systemPreferences.getMediaAccessStatus('screen') === 'granted'
    return hasPermission
}

exports.hasPromptedForPermission = () => {
    if (!permissionExists) {
        return false
    }

    if (filePath && fs.existsSync(filePath)) {
        return true
    }

    return false
}

exports.resetPermissions = ({ bundleId = '' } = {}) => {
    try {
        const command = ['tccutil', 'reset', 'ScreenCapture', bundleId]
            .filter(Boolean)
            .join(' ')
        execSync(command)
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
        return true
    } catch (error) {
        return false
    }
}
