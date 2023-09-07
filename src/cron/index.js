const storage_client = require('../connectors/storage')
const {
    getMacAppNameAndBundleID,
    getMacChromeCurrentTabURL,
    getMacAppWindowTitle,
} = require('../tools/systemCall')
const { desktopCapturer, nativeImage } = require('electron')
const { getIncognitoKeywords } = require('../tools/incognitoKeywords')
const telemetry = require('../utils/telemetry')

class DataStore {
    constructor() {
        this.setupData = {}
        this.isRunning = false
        this.dataLastUpdated = null
        this.shouldStop = false
    }

    async _takeScreenshot() {
        try {
            const { windowHeight, windowWidth } = this.setupData
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { height: windowHeight, width: windowWidth },
            })

            return sources[0].thumbnail.toDataURL()
        } catch (error) {
            console.error('Error capturing screenshot:', error)
            throw error
        }
    }

    async _getAttributeData() {
        const { appName, bundleId } = getMacAppNameAndBundleID()
        const data = {
            app_name: appName,
            bundle_id: bundleId,
            window_name: getMacAppWindowTitle(),
        }

        if (appName === 'Google Chrome') {
            data.current_url = getMacChromeCurrentTabURL()
        }

        return data
    }

    async _makeSegmentCall(image, date_generated, data) {
        const { infr_server_uri, infr_api_key, infr_device_id } = this.setupData
        const segment_id = 'seg_' + Math.random().toString(36).substring(2)
        telemetry('segment_call__start', { segment_id })
        const base64Image = image.toJPEG(100).toString('base64')
        const url = `${infr_server_uri}/v1/segment/create?device_id=${infr_device_id}&type=screenshot`
        const json_data = {
            date_generated,
            json_metadata: data,
            screenshot: base64Image,
        }

        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Infr-API-Key': infr_api_key,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(json_data),
            })

            if (resp.ok) {
                telemetry('segment_call__success', { segment_id })
            } else {
                throw new Error('Error making segment call')
            }
        } catch (error) {
            telemetry('segment_call__error', { segment_id })
            console.error('Error making segment call:', error)

            /*
            Failure handling for future use
            const failed_requests = storage_client.get('failed_requests') || []
            failed_requests.push({
                url,
                json_data,
                error,
                api_key: infr_api_key,
                sent_at: Math.floor(Date.now() / 1000),
            })
            storage_client.set('failed_requests', failed_requests)
            */
            throw error
        }
    }

    async _getRelevantData() {
        return {
            windowHeight: storage_client.get('windowHeight'),
            windowWidth: storage_client.get('windowWidth'),
            infr_server_uri: storage_client.get('infr_server_uri'),
            infr_api_key: storage_client.get('infr_api_key'),
            infr_device_id: storage_client.get('infr_device_id'),
            setup_check__permissions: storage_client.get(
                'setup_check__permissions',
            ),
            setup_check__server: storage_client.get('setup_check__server'),
            manual_stop: false,
            incognito_keywords: getIncognitoKeywords(),
        }
    }

    async _checkDataValidity(getFromStorage = false) {
        if (
            Object.keys(this.setupData).length === 0 ||
            Math.random() < 0.01 ||
            getFromStorage
        ) {
            this.setupData = await this._getRelevantData()
        }

        const requiredFields = [
            'windowHeight',
            'windowWidth',
            'infr_server_uri',
            'infr_api_key',
            'infr_device_id',
        ]
        const isValid = requiredFields.every((field) => this.setupData[field])

        if (!isValid) {
            console.log('Missing setup data, aborting...')
            return false
        }
        if (!this.setupData['setup_check__permissions']) {
            console.log('Missing permissions, aborting...')
            return false
        }
        if (!this.setupData['setup_check__server']) {
            console.log('Missing server, aborting...')
            return false
        }
        return true
    }

    async _checkForIncognito(window_name, app_name, current_url, bundle_id) {
        const { incognito_keywords } = this.setupData
        if (!incognito_keywords) return false
        if (typeof incognito_keywords !== 'object') return false
        if (incognito_keywords.length === 0) return false

        // The lowercase versions of the strings are used for comparison
        // The incognito_keywords array should be lowercase
        // None of the words in array should be in the window_name, app_name, or current_url
        // either of the window name, app name, or current url can be null
        var window_name_lower = window_name
        var app_name_lower = app_name
        var current_url_lower = current_url
        var bundle_id_lower = bundle_id

        if (typeof window_name_lower === 'string')
            window_name_lower = window_name_lower.toLowerCase()
        else window_name_lower = ''

        if (typeof app_name_lower === 'string')
            app_name_lower = app_name_lower.toLowerCase()
        else app_name_lower = ''

        if (typeof current_url_lower === 'string')
            current_url_lower = current_url_lower.toLowerCase()
        else current_url_lower = ''

        if (typeof bundle_id_lower === 'string')
            bundle_id_lower = bundle_id_lower.toLowerCase()
        else bundle_id_lower = ''

        var isIncognito = false
        for (var i = 0; i < incognito_keywords.length; i++) {
            var keyword = incognito_keywords[i]

            // Must be string and at least 2 characters long
            if (typeof keyword !== 'string') continue
            if (keyword.length < 2) continue
            keyword = keyword.toLowerCase()

            // Split the keyword into words, & check if all words are in the string
            // Each sub-keyword must appear in at least one of the strings
            var keyword_words = keyword.split(' ')
            var all_words_included = keyword_words.map(() => false)
            for (var j = 0; j < keyword_words.length; j++) {
                var keyword_word = keyword_words[j]
                if (window_name_lower.includes(keyword_word))
                    all_words_included[j] = true
                if (app_name_lower.includes(keyword_word))
                    all_words_included[j] = true
                if (current_url_lower.includes(keyword_word))
                    all_words_included[j] = true
                if (bundle_id_lower.includes(keyword_word))
                    all_words_included[j] = true
            }

            // If all words are included, then the keyword is in the string
            var all_words_included = all_words_included.every((word) => word)
            if (all_words_included) {
                isIncognito = true
                break
            }
        }

        return isIncognito
    }

    async _storeData() {
        console.log('\n\n')
        console.log('Storing data...')
        if (!(await this._checkDataValidity())) return

        const imageDataURL = await this._takeScreenshot()
        const data = await this._getAttributeData()

        // Check if the data is incognito
        const isIncognito = await this._checkForIncognito(
            data.window_name,
            data.app_name,
            data.current_url,
            data.bundle_id,
        )
        if (isIncognito) {
            console.log('Incognito detected, not storing data.')
            return
        }

        const date_generated = Math.floor(Date.now() / 1000)
        const image = nativeImage.createFromDataURL(imageDataURL)

        await this._makeSegmentCall(image, date_generated, data)
        this.dataLastUpdated = new Date()
    }

    run() {
        if (this.isRunning) {
            console.log('Data storing process is already running.')
            return
        }

        this.isRunning = true
        this.shouldStop = false // Reset the stop flag in case it was previously set

        const runner = async () => {
            if (this.shouldStop) {
                this.isRunning = false
                console.log('Manual stop triggered. Stopping data storing.')
                return
            }
            try {
                this._storeData()
                setTimeout(runner, 3000)
            } catch (error) {
                console.error('Error in storeData:', error)
                setTimeout(runner, 3000)
            }
        }
        runner()
    }

    stop() {
        this.shouldStop = true
    }

    updateData() {
        return this._checkDataValidity(true)
    }
}

module.exports = DataStore
