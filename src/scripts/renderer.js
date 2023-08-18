document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded')

  // Load initial values
  const serverUri = await window.appStorage.get('infr_server_uri')
  const apiKey = await window.appStorage.get('infr_api_key')
  const deviceId = await window.appStorage.get('infr_device_id')

  if (serverUri) {
    document.getElementById('serverUriInput').value = serverUri
  }
  if (apiKey) {
    document.getElementById('apiKeyInput').value = apiKey
  }
  if (deviceId) {
    document.getElementById('deviceIdInput').value = deviceId
  }

  // Check if we have a serverUri and apiKey
  if (serverUri && apiKey && deviceId) {
    let status = await window.infrSetup.getStatus()
    if (status['server_status'] && status['permissions_status']) {
      // Navigate to the main page
      window.infrWindow.show('pages/dashboard.html')
    } else if (status['server_status']) {
      // Navigate to the permissions page
      window.infrWindow.show('pages/permission.html')
    }
  }
})

async function saveSettings() {
  // Make button disabled & spinner
  setBtnAsLoading('signUpSaveBtn')

  // Hide the error card
  document.getElementById('signUpErrorCardHolder').style.display = 'none'

  const serverUri = document.getElementById('serverUriInput').value
  const apiKey = document.getElementById('apiKeyInput').value
  const deviceId = document.getElementById('deviceIdInput').value

  var success = false

  try {
    // Save to the store
    window.appStorage.set('infr_server_uri', serverUri)
    window.appStorage.set('infr_api_key', apiKey)
    window.appStorage.set('infr_device_id', deviceId)

    // Check if the server is up
    success = await doServerCheck()
  } catch (err) {
    console.error('Error saving settings: ', err)
  }

  if (success) {
    // Hide the error card
    document.getElementById('signUpErrorCardHolder').style.display = 'none'

    // Navigate to the permissions page
    window.infrWindow.show('pages/permission.html')
  } else {
    // Show the error card
    document.getElementById('signUpErrorCardHolder').style.display = 'block'
  }

  // Make button enabled
  setBtnAsEnabled('signUpSaveBtn', 'Save', 'saveSettings()')
}

async function doServerCheck() {
  let resp = await window.infrSetup.performCheckServer()
  return resp
}
