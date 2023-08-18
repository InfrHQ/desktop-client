const { execSync } = require('child_process')

function getMacAppWindowTitle() {
  try {
    const windowTitle = execSync(
      'osascript -e \'tell app "System Events" to get the name of the front window of (first application process whose frontmost is true)\'',
    )
      .toString()
      .trim()

    console.log('Window Title: ' + windowTitle)
    return windowTitle
  } catch (err) {
    console.error('Error fetching active window title:', err)
    return null
  }
}

function getMacChromeCurrentTabURL() {
  try {
    const url = execSync(
      'osascript -e \'tell app "Google Chrome" to get the URL of the active tab of its first window\'',
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
  try {
    var appName = execSync(
      'osascript -e \'tell app "System Events" to get the name of every process whose frontmost is true\'',
    )
      .toString()
      .trim()

    if (process.env.ENVIRONMENT === 'dev') {
      if (appName === 'Electron') {
        appName = String(process.env.ELECTRON_REWRITE_APP_NAME).replace(
          /-/g,
          ' ',
        )
      }
    }
    console.log('appName: ' + appName)

    return appName
  } catch (err) {
    console.error('Error fetching active app name:', err)
    return null
  }
}

module.exports = {
  getMacAppWindowTitle,
  getMacChromeCurrentTabURL,
  getMacAppName,
}
