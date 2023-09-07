const storage_client = require('../connectors/storage')
const {
    hasScreenCapturePermission,
    hasPromptedForPermission,
    openSystemPreferences,
} = require('../tools/macScreenPermission')

async function handlePermissions() {
    // If permissions are already granted, return true
    if (hasScreenCapturePermission()) {
        storage_client.set('setup_check__permissions', true)
        console.log('Permissions already granted')
        return true
    }

    // If the permissions dialog has not been shown, it will be shown automatically when
    // `hasScreenCapturePermission` is called, so we check if it was prompted.
    if (!hasPromptedForPermission()) {
        // We just showed the prompt by calling `hasScreenCapturePermission`, so
        // we'll wait a bit to allow the user time to respond. This delay is arbitrary
        // and in a real-world scenario, you might want to use events or other signals.
        await new Promise((resolve) => setTimeout(resolve, 10000))
        let hasCapturePermissions = hasScreenCapturePermission()
        storage_client.set('setup_check__permissions', hasCapturePermissions)
        console.log('Permissions granted')
        return hasCapturePermissions
    }

    // If the permissions dialog has been shown before and we still don't have permission,
    // open the system preferences to let the user grant access.
    // We only do this once to avoid annoying the user.
    if (!hasScreenCapturePermission() && hasPromptedForPermission()) {
        await openSystemPreferences()
        // Note: After opening System Preferences, you might want to show a message or dialog
        // instructing the user on what to do next.
        await new Promise((resolve) => setTimeout(resolve, 10000))
        let hasCapturePermissions = hasScreenCapturePermission()
        storage_client.set('setup_check__permissions', hasCapturePermissions)
        console.log('Permissions granted')
        return hasCapturePermissions
    }

    return hasScreenCapturePermission()
}

setTimeout(handlePermissions, 3000)

module.exports = handlePermissions
