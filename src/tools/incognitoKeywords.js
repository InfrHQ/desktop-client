const storage_client = require('../connectors/storage')

function setIncognitoKeywords(listOfItems) {
    /*
    @dev - This function is handled from index.js & consumes the list of keywords from the IPC event
    */

    // Ensure the list is an array
    if (!Array.isArray(listOfItems)) {
        console.log('incognitoKeywords: not an array')
        return []
    }

    // Ensure the list is not empty
    if (listOfItems.length === 0) {
        console.log('incognitoKeywords: empty array')
        return []
    }

    // Ensure all words are strings and at least 2 characters long
    const invalidItems = listOfItems.filter(
        (item) => typeof item !== 'string' || item.length < 2,
    )
    if (invalidItems.length > 0) {
        console.log('incognitoKeywords: invalid items')
        return []
    }

    // Lowercase all items in the list
    const lowerCaseList = listOfItems.map((item) => item.toLowerCase())

    // Set the list to storage
    storage_client.set('incognito_keywords', lowerCaseList)

    console.log('incognitoKeywords: set successful - ', lowerCaseList)
}

function getIncognitoKeywords() {
    /*
    @dev - This function is handled from index.js & returns the list of keywords from the storage
    */

    // Get the list from storage
    const listOfItems = storage_client.get('incognito_keywords')

    // Ensure the list is an array
    if (!Array.isArray(listOfItems)) {
        console.log('incognitoKeywords: not an array')
        return []
    }

    // Ensure the list is not empty
    if (listOfItems.length === 0) {
        console.log('incognitoKeywords: empty array')
        return []
    }

    // Ensure all words are strings and at least 2 characters long
    const invalidItems = listOfItems.filter(
        (item) => typeof item !== 'string' || item.length < 2,
    )
    if (invalidItems.length > 0) {
        console.log('incognitoKeywords: invalid items')
        return []
    }

    // Lowercase all items in the list
    const lowerCaseList = listOfItems.map((item) => item.toLowerCase())

    console.log('incognitoKeywords: get successful - ', lowerCaseList)

    return lowerCaseList
}

module.exports = {
    setIncognitoKeywords,
    getIncognitoKeywords,
}
