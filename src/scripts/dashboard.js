function showNoSendTags() {
    const noSendTags = document.querySelector('.no-send-tags')
    noSendTags.classList.remove('hidden')
}

var inputElm = document.getElementById('incognito_input')
console.log(inputElm)
var tagify = new Tagify(inputElm)

inputElm.addEventListener('change', onChange)

function onChange(e) {
    // outputs a String
    console.log(e.target.value)

    let tags = getAllTags()

    // Ensure is a list of strings, lowercase all strings,
    // remove duplicates & each string must be at least 2 characters long
    tags = tags.filter((tag) => typeof tag === 'string' && tag.length >= 2)
    tags = tags.map((tag) => tag.toLowerCase())
    tags = [...new Set(tags)]

    if (tags.length === 0) {
        return
    }

    // Save to storage async
    try {
        ;(async () => {
            window.infrDashboard.setIncognitoKeywords(tags)
        })()
    } catch (err) {}
}

function getAllTags() {
    let tags = tagify.value.map((tag) => tag.value)
    return tags
}

function loadIncognitoKeywords() {
    var keywords = []

    try {
        window.infrDashboard.getIncognitoKeywords().then((keywords) => {
            console.log('keywords: ', keywords)
            if (keywords) {
                keywords.forEach((keyword) => {
                    keywords.push(keyword)
                })
            }
        })

        // Add the tags to the tagify input
        tagify.addTags(keywords)
    } catch (err) {}
}

function addTagOnClick(tag_name) {
    tagify.addTags(tag_name)
}

function handleChangeInCodeStorage() {
    let btn = document.getElementById('btn_is_code_storage_enabled')
    let label = document.getElementById('btn_is_code_storage_enabled_label')

    if (btn.checked) {
        window.infrDashboard.setCodeStorageEnabled(true)

        // Update text & class
        label.classList.remove('btn-outline-danger')
        label.classList.add('btn-outline-success')
        label.innerHTML = 'Code Storage Enabled'
    } else {
        window.infrDashboard.setCodeStorageEnabled(false)

        // Update text
        label.classList.remove('btn-outline-success')
        label.classList.add('btn-outline-danger')
        label.innerHTML = 'Code Storage Disabled'
    }
}

function loadCodeStorageEnabled() {
    try {
        window.infrDashboard.getCodeStorageEnabled().then((enabled) => {
            let btn = document.getElementById('btn_is_code_storage_enabled')
            let label = document.getElementById(
                'btn_is_code_storage_enabled_label',
            )

            // Null is considered true
            if (enabled === false) {
                btn.checked = false

                // Update text
                label.classList.remove('btn-outline-success')
                label.classList.add('btn-outline-danger')
                label.innerHTML = 'Code Storage Disabled'
            } else {
                btn.checked = true

                // Update text & class
                label.classList.remove('btn-outline-danger')
                label.classList.add('btn-outline-success')
                label.innerHTML = 'Code Storage Enabled'
            }
        })
    } catch (err) {}
}

function handlePause() {
    let btnPause = document.getElementById('pause_button')

    if (btnPause.state === 'paused') {
        //window.infrDashboard.setPause(false)
        btnPause.state = 'run'
        btnPause.innerHTML = `<i class="bi bi-pause"></i>Pause`
        btnPause.classList.remove('btn-outline-success')
        btnPause.classList.add('btn-outline-warning')

        // Update main card text, spinner & title
        let mainCardTitle = document.getElementById('main_card_title')
        mainCardTitle.innerHTML = `Background processes are hard at work`

        let mainCardSpinner = document.getElementById('main_card_spinner')
        mainCardSpinner.style.display = 'block'
        mainCardSpinner.classList.remove('bg-warning')
        mainCardSpinner.classList.add('bg-success')

        let mainCardSpinnerSpan = document.getElementById(
            'main_card_spinner_span',
        )
        mainCardSpinnerSpan.classList.add('spinner-grow')
        mainCardSpinnerSpan.classList.add('spinner-grow-m')

        let mainCardText = document.getElementById('main_card_text')
        mainCardText.innerHTML = `
        Background screen capture is in progress. Feel free to
        close this window & continue working. To stop data
        collection, simply use the "Pause" button above.
        `
    } else {
        //window.infrDashboard.setPause(true)
        btnPause.state = 'paused'
        btnPause.innerHTML = `<i class="bi bi-play"></i>Run`
        btnPause.classList.remove('btn-outline-warning')
        btnPause.classList.add('btn-outline-success')

        // Update main card text, spinner & title
        let mainCardTitle = document.getElementById('main_card_title')
        mainCardTitle.innerHTML = 'Background processes are paused'

        let mainCardSpinner = document.getElementById('main_card_spinner')
        mainCardSpinner.style.display = 'none'
        mainCardSpinner.classList.remove('bg-success')
        mainCardSpinner.classList.add('bg-warning')

        let mainCardSpinnerSpan = document.getElementById(
            'main_card_spinner_span',
        )
        mainCardSpinnerSpan.classList.remove('spinner-grow')
        mainCardSpinnerSpan.classList.remove('spinner-grow-m')

        let mainCardText = document.getElementById('main_card_text')
        mainCardText.innerHTML = `
        Background screen capture is paused. 
        No data will be captured while Infr is paused. 
        Please click the "Run" button to resume.
        `
    }
}

function loadPage() {
    loadIncognitoKeywords()
    loadCodeStorageEnabled()
}

loadPage()
