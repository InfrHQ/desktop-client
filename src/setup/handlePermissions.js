const { systemPreferences } = require('electron')
const storage_client = require('../connectors/storage')

async function handlePermissions() {
  // string - Can be not-determined, granted, denied, restricted or unknown.
  var is_granted = await systemPreferences.getMediaAccessStatus('screen')
  if (is_granted !== 'granted') {
    let resp = await systemPreferences.askForMediaAccess('screen')
    is_granted = await systemPreferences.getMediaAccessStatus('screen')
  }
  is_granted = is_granted === 'granted' ? true : false
  storage_client.set('setup_check__permissions', is_granted)
  return is_granted
}

module.exports = handlePermissions
