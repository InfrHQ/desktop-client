const electronLog = require('electron-log')

function log(text, logType) {
    if (process.env.ENVIRONMENT === 'production' || !process.env.ENVIRONMENT) {
        console.log(text)
    } else {
        // Still log to console in production
        console.log(text)

        // Log to file
        if (logType === 'error') electronLog.error(text)
        else if (logType === 'warn') electronLog.warn(text)
        else electronLog.info(text)
    }
}

module.exports = log
