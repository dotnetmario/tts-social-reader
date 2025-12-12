const Defines = {
    // Backend URL
    BASE_URL: "https://tts-social-reader-api.test",
    BASE_API_URL: "https://tts-social-reader-api.test/api/v1",

    // text max length to display before we truncate the content
    TEXT_MAX_LENGTH: 100,

    // supported websites with their module
    SUPPORTED_SITES: {
        'www.reddit.com': `./reddit.js`
    },

    // error messages
    ERROR_MESSAGES: {
        generic: 'Something went wrong, please try again later!'
    },

    // success messages
    SUCCESS_MESSAGES: {
        settings: 'Settings saved successfuly'
    }
}



export default Defines;