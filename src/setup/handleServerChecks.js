const storage_client = require('../connectors/storage')

async function verfiyAPIKey(host, apiKey) {
  let resp = await fetch(host + '/v1/apikey/query/verify', {
    method: 'GET',
    headers: {
      'Infr-API-Key': apiKey,
    },
  })
  if (resp.status === 200) {
    let data = await resp.json()
    return data
  }
  return false
}

async function getUser(host, apiKey) {
  let resp = await fetch(host + '/v1/user/query/apikey', {
    method: 'GET',
    headers: {
      'Infr-API-Key': apiKey,
    },
  })
  if (resp.status === 200) {
    let user = await resp.json()
    return user
  }
  return null
}

async function verifyDevice(host, apiKey, device) {
  let resp = await fetch(host + '/v1/device/query', {
    method: 'GET',
    headers: {
      'Infr-API-Key': apiKey,
    },
  })
  if (resp.status === 200) {
    let data = await resp.json()
    let devices = data['devices']

    for (let i = 0; i < devices.length; i++) {
      if (devices[i]['id'] === device) {
        return devices[i]
      }
    }
  }
  return false
}

async function handleServerChecks() {
  let host = storage_client.get('infr_server_uri')
  let apiKey = storage_client.get('infr_api_key')
  let device_id = storage_client.get('infr_device_id')

  if (host && apiKey && device_id) {
    let apikey = await verfiyAPIKey(host, apiKey)
    let user = await getUser(host, apiKey)
    let device = await verifyDevice(host, apiKey, device_id)

    if (apikey && user && device) {
      // Save the user to the store
      storage_client.set('user_data', user)
      storage_client.set('apikey_data', apikey)
      storage_client.set('setup_check__server', true)
      return true
    }
  }
  return false
}

module.exports = handleServerChecks
