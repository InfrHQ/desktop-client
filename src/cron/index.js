const storage_client = require('../connectors/storage')
const {
    getMacAppNameAndBundleID,
    getMacChromeCurrentTabURL,
    getMacAppWindowTitle,
} = require('../tools/systemCall')
const { desktopCapturer, nativeImage } = require('electron')
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

    async _storeData() {
        if (!(await this._checkDataValidity())) return

        const imageDataURL = await this._takeScreenshot()
        const data = await this._getAttributeData()
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
