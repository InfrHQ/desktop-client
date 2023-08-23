function setBtnAsLoading(btnID) {
    const btn = document.getElementById(btnID)

    btn.innerHTML = `
    <button class="btn btn-primary" type="button" disabled>
        <span class="spinner-grow spinner-grow-sm" aria-hidden="true"></span>
        <span role="status">Loading...</span>
    </button>
    `
}

function setBtnAsEnabled(btnID, btnText, onclick) {
    const btn = document.getElementById(btnID)

    btn.innerHTML =
        `
    <button class="btn btn-primary" type="button" onclick="` +
        onclick +
        `">` +
        btnText +
        `</button>`
}

function logout() {
    window.infrLogout.logout()

    // Navigate to the main page
    window.infrWindow.show('pages/index.html')
}

async function handleAutoLogout() {
    var currentPage = await window.infrWindow.getCurrentPage()
    var status = await window.infrSetup.getStatus()
    if (
        (!status['permissions_status'] || !status['server_status']) &&
        currentPage.includes('dashboard.html')
    ) {
        logout()
    }
}

setTimeout(handleAutoLogout, 3000)
