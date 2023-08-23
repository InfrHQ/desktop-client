const {
    getMacAppName,
    getMacChromeCurrentTabURL,
    getMacAppWindowTitle,
} = require('../tools/systemCall')
const { desktopCapturer, nativeImage } = require('electron')
const storage_client = require('../connectors/storage')

async function takeScreenshot(windowHeight, windowWidth) {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: {
                height: windowHeight,
                width: windowWidth,
            },
        })

        // Select the first screen source
        const source = sources[0]

        // Create a thumbnail from the source and return it
        return source.thumbnail.toDataURL()
    } catch (error) {
        console.error('Error capturing screenshot:', error)
        throw error
    }
}

async function getAttributeData() {
    const data = {}
    const appName = getMacAppName()
    data.app_name = appName

    if (appName === 'Google Chrome') {
        const url = getMacChromeCurrentTabURL()
        data.current_url = url
    }

    const window_name = getMacAppWindowTitle()
    data.window_name = window_name

    return data
}

async function makeSegmentCall(
    image,
    date_generated,
    data,
    infr_server_uri,
    infr_api_key,
    infr_device_id,
) {
    try {
        // Convert native image to b64
        const buffer = image.toJPEG(100)
        const base64Image = buffer.toString('base64')
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

            if (!resp.ok) {
                throw new Error('Error making segment call')
            }
        } catch (error) {
            // Handle a failed request by storing it locally & try again later
            console.error('Error making segment call:', error)

            // Get existing failed requests
            var failed_requests = storage_client.get('failed_requests') || []
            let new_failed_request = {
                url,
                json_data,
                error,
                api_key: infr_api_key,
                sent_at: Math.floor(Date.now() / 1000),
            }
            failed_requests.push(new_failed_request)
            storage_client.set('failed_requests', failed_requests)

            throw error
        }
    } catch (err) {
        console.error('Error making segment call: ', err)
        throw err
    }
}

async function getRelevantData() {
    let data = {}
    data['windowHeight'] = storage_client.get('windowHeight')
    data['windowWidth'] = storage_client.get('windowWidth')
    data['infr_server_uri'] = storage_client.get('infr_server_uri')
    data['infr_api_key'] = storage_client.get('infr_api_key')
    data['infr_device_id'] = storage_client.get('infr_device_id')
    data['setup_check__permissions'] = storage_client.get(
        'setup_check__permissions',
    )
    data['setup_check__server'] = storage_client.get('setup_check__server')
    return data
}

async function storeData() {
    console.log('Storing data...')

    try {
        const setup_data = await getRelevantData()

        // If any of the setup data is missing, we can't continue
        if (
            !setup_data['windowHeight'] ||
            !setup_data['windowWidth'] ||
            !setup_data['infr_server_uri'] ||
            !setup_data['infr_api_key'] ||
            !setup_data['infr_device_id']
        ) {
            console.log('Missing setup data, aborting...')
            return
        }
        if (!setup_data['setup_check__permissions']) {
            console.log('Missing permissions, aborting...')
            return
        }
        if (!setup_data['setup_check__server']) {
            console.log('Missing server, aborting...')
            return
        }

        const imageDataURL = await takeScreenshot(
            setup_data['windowHeight'],
            setup_data['windowWidth'],
        )
        const data = await getAttributeData()
        const date_generated = Math.floor(Date.now() / 1000)
        const image = nativeImage.createFromDataURL(imageDataURL)

        makeSegmentCall(
            image,
            date_generated,
            data,
            setup_data['infr_server_uri'],
            setup_data['infr_api_key'],
            setup_data['infr_device_id'],
        )
    } catch (error) {
        console.error('Error in storeData function:', error)
    }
}

async function handleFailedRequests() {
    try {
        // Fetch the stored failed requests
        const failedRequests = storage_client.get('failed_requests') || []

        if (failedRequests.length === 0) {
            console.log('No failed requests to handle.')
            return
        }

        console.log(`Handling ${failedRequests.length} failed requests...`)

        // Create an array to hold any requests that still fail
        let stillFailedRequests = []

        for (let request of failedRequests) {
            const { url, json_data, api_key, device_id } = request

            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Infr-API-Key': api_key,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(json_data),
                })

                if (!resp.ok) {
                    throw new Error('Error retrying segment call')
                }

                console.log(
                    `Successfully resent failed request for ${request.request_for}`,
                )
            } catch (error) {
                console.error(
                    `Failed to resend request for ${request.request_for}:`,
                    error,
                )
                stillFailedRequests.push(request)
            }
        }

        // Update the storage with any requests that still failed
        storage_client.set('failed_requests', stillFailedRequests)
    } catch (error) {
        console.error('Error in handleFailedRequests function:', error)
    }
}

module.exports = { storeData, handleFailedRequests }
