const Defines = {
    // Backend URL
    BASE_URL: "https://tts-social-reader-api.test",
    BASE_API_URL: "https://tts-social-reader-api.test/api/v1",

    // text max length to display before we truncate the content
    TEXT_MAX_LENGTH: 100,

    // supported websites with their module
    SUPPORTED_SITES: {
        'reddit.com'                : `./sites/reddit.js`,
        'bbc.com'                   : `./sites/bbc.js`,
        'bbc.co.uk'                 : `./sites/bbcuk.js`,
        'cnn.com'                   : `./sites/cnn.js`,
        'nytimes.com'               : `./sites/nytimes.js`,
        'theguardian.com'           : `./sites/theguardian.js`,
        'foxnews.com'               : `./sites/foxnews.js`,
        'foxbusiness.com'           : `./sites/foxnews.js`,
        'dailymail.co.uk'           : `./sites/dailymail.js`,
        'dailymail.co.uk'           : `./sites/dailymail.js`,
        'yahoo.com'                 : `./sites/yahoo.js`
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