const { execSync } = require('child_process')

function getMacAppWindowTitle() {
    try {
        const appleScriptCommand = `
        tell application "System Events"
            set frontmostProcess to first process where it is frontmost
            if (count of (windows of frontmostProcess)) > 0 then
                return name of front window of frontmostProcess
            else
                return "No Active Window"
            end if
        end tell
    `
        const windowTitle = execSync(
            'osascript -e \'tell app "System Events" to get the name of the front window of (first application process whose frontmost is true)\'',
        )
            .toString()
            .trim()

        console.log('Window Title: ' + windowTitle)
        return windowTitle
    } catch (err) {
        return null
    }
}

function getMacBrowserCurrentTabURL(browserName) {
    try {
        const url = execSync(
            `osascript -e \'tell app "${browserName}" to get the URL of the active tab of its first window\'`,
        )
            .toString()
            .trim()

        return url
    } catch (err) {
        console.error("Error fetching Chrome's active tab URL:", err)
        return null
    }
}

function getMacAppName() {
    let appName
    try {
        // Fetch the name of the frontmost application using the updated AppleScript command.
        appName = execSync(
            'osascript -e \'tell application "System Events" to name of (first process where it is frontmost) as string\'',
        )
            .toString()
            .trim()

        console.log('appName: ' + appName)
    } catch (err) {
        appName = null
    }
    return appName
}

function getMacBundleId() {
    let bundleId
    try {
        // Get bundle ID of the frontmost application.
        bundleId = execSync(
            'osascript -e \'tell application "System Events" to get the bundle identifier of (first process where it is frontmost) as string\'',
        )
            .toString()
            .trim()

        console.log('bundleId: ' + bundleId)
    } catch (err) {
        bundleId = null
    }
    return bundleId
}

function getMacAppNameAndBundleID() {
    // This function handles the case where the app name is not available ro is incorect (e.g. VSCode)
    // In this case, we try to extract the name from the bundle ID.

    var appName = getMacAppName()
    var bundleId = getMacBundleId()

    // Handle special naming for Electron in dev environment.
    if (appName === 'Electron') {
        // If com.microsoft.VSCode
        if (bundleId === 'com.microsoft.VSCode') {
            appName = 'Visual Studio Code'
        }
    }

    return {
        appName,
        bundleId,
    }
}

function getMacBrowserWindowHTML(browserName) {
    var script = ``
    if (browserName === 'Google Chrome') {
        script = `
tell application "Google Chrome"
    set activeTab to active tab of window 1
    set pageHTML to execute activeTab javascript "document.documentElement.outerHTML"
    return pageHTML
end tell
    `
    } else if (browserName === 'Safari') {
        script = `
tell application "Safari"
    set pageHTML to do JavaScript "document.documentElement.outerHTML" in current tab of window 1
    return pageHTML
end tell
    `
    } else if (browserName === 'Brave Browser') {
        script = `
tell application "Brave Browser"
    set activeTab to active tab of window 1
    set pageHTML to execute activeTab javascript "document.documentElement.outerHTML"
    return pageHTML
end tell
`
    }
    try {
        const html = execSync(`osascript -e '${script}'`).toString().trim()

        return html
    } catch (err) {
        console.error("Error fetching browser's active tab HTML:", err)
        return null
    }
}

module.exports = {
    getMacAppWindowTitle,
    getMacAppName,
    getMacBundleId,
    getMacAppNameAndBundleID,
    getMacBrowserCurrentTabURL,
    getMacBrowserWindowHTML,
}
