// Update the progress bar every 5 seconds
async function handlePermissions() {
    try {
        // First get the current progress
        var status = await window.infrSetup.getStatus()

        // If the server is up, we can check the permissions
        // But only request them if they haven't been requested yet
        if (!status['permissions_status']) {
            await window.infrSetup.performCheckPermissions()
            status = await window.infrSetup.getStatus()
        }

        if (status['permissions_status']) {
            // Navigate to the main page
            window.infrWindow.show('pages/dashboard.html')
        } else {
            // Show the button
            document.getElementById('requestPermissionsButton').style.display =
                'block'
        }
    } catch (err) {
        console.error('Error making permission checks: ', err)
        document.getElementById('requestPermissionsButton').style.display =
            'block'
        throw err
    }
}

// This function is called when the user clicks the "Request Permissions" button
async function handleRequestPermissions() {
    // Set the button to loading
    setBtnAsLoading('requestPermissionsButton')

    await window.infrSetup.performCheckPermissions()
    let status = await window.infrSetup.getStatus()
    if (status['permissions_status']) {
        // Navigate to the main page
        window.infrWindow.show('pages/dashboard.html')
    }

    // If we get here, we failed to get the permissions
    // Set the button back to normal
    setBtnAsNormal(
        'requestPermissionsButton',
        'Request Permissions',
        'handleRequestPermissions()',
    )
}
