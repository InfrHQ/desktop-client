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

function loadPage() {
    loadIncognitoKeywords()
}

loadPage()
