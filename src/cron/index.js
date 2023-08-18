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
    const form = new FormData()

    // Convert native image to buffer
    const buffer = image.toJPEG(100)
    const blob = new Blob([buffer], { type: 'image/jpg' })

    form.set('json_metadata', JSON.stringify(data))
    form.set('screenshot', blob, 'screenshot.png')

    const url = `${infr_server_uri}/v1/segment/create?date_generated=${date_generated}&device_id=${infr_device_id}&type=screenshot`

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Infr-API-Key': infr_api_key,
      },
      body: form,
    })

    return await resp.json()
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

    await makeSegmentCall(
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

module.exports = storeData
