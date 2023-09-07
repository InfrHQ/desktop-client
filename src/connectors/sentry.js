const Sentry = require('@sentry/electron')

function initSentry() {
    Sentry.init({
        dsn: 'https://ab3915a4a611734eca369236f57a5dc8@o4505051351089152.ingest.sentry.io/4505840541696000',
    })
}

module.exports = initSentry
