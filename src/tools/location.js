'use strict'
const path = require('path')
const electronUtil = require('electron-util/node')
const util = require('util')
const execFile = util.promisify(require('child_process').execFile)

const binary = path.join(electronUtil.fixPathForAsarUnpack(__dirname), 'main')

module.exports = async () => {
    const { stderr, stdout } = await execFile(binary)

    if (stderr || !stdout || (stdout && stdout.includes('Error:'))) {
        throw new Error(error || stderr || stdout)
    }

    const answer = {
        latitude: undefined,
        longitude: undefined,
        city: undefined,
        country: undefined,
        timezone: undefined,
    }

    const keys = Object.keys(answer)
    const lines = stdout.split('\n')

    for (const line of lines) {
        for (const key of keys) {
            if (line.startsWith(key)) {
                let normalizedValue = line.split(':')[1]

                if (normalizedValue) {
                    normalizedValue = normalizedValue.trim()

                    // Swift includes weird " (current)" in timezone
                    if (key === 'timezone') {
                        normalizedValue = normalizedValue.replace(
                            ' (current)',
                            '',
                        )
                    }
                }

                answer[key] = normalizedValue
            }
        }
    }

    return answer
}
