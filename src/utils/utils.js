import AudioPlayback from "./audioplayback.js";
import Defines from "./defines";
import Storage from "./storage.js";
import View from "./view.js";
import psl from "psl";

const Utils = {
    /**
     * formats text into a human readable format
     * eg: 12345 karma => 12.4k karma
     * @param {string} text 
     * @returns {string}
     */
    formatHumanNumbers(text) {
        if (typeof text !== 'string') {
            // maybe it’s a number directly (e.g. 12332)
            if (typeof text === 'number') text = text.toString();
            else return ''; // or return text
        }
        // extract numeric part from a string like "12332 likes"
        const numberMatch = text.match(/\d+/);
        if (!numberMatch) return text;

        const num = parseInt(numberMatch[0], 10);

        const formatted = new Intl.NumberFormat('en', {
            notation: 'compact', // shortens large numbers
            maximumFractionDigits: 1
        }).format(num);

        // replace the number in the original text
        return text.replace(/\d+/, formatted);
    },

    /**
     * retrun a subtext from the original text
     * @param {string} text 
     * @returns 
     */
    sliceText(text) {
        if (typeof text !== 'string') {
            text = text.toString();
        }

        if (text.length <= Defines.TEXT_MAX_LENGTH) {
            return text;
        }

        text = text.slice(0, Defines.TEXT_MAX_LENGTH) + '...';

        return text;
    },

    /**
     * split text into two parts, without spliting words in the middle
     * 
     * @param {string} text
     * @returns {object}
     */
    splitText(text) {
        if (typeof text !== 'string') {
            text = text.toString();
        }

        const index = text.indexOf(" ", Defines.TEXT_MAX_LENGTH);

        const firstPart = index !== -1
            ? text.substring(0, index)
            : text;

        const secondPart = index !== -1
            ? text.substring(index + 1)
            : "";

        return { firstPart, secondPart };
    },

    /**
     * add breakline after a dot '.'
     * 
     * @param {string} text
     * @returns {string} 
     */
    breaklineText(text, breaklinesCount = 2) {
        if (typeof text !== 'string') {
            text = text.toString();
        }
        let breaklines = '';
        for (let i = 0; i < breaklinesCount; i++) {
            breaklines += '<br>';
        }

        return text.replaceAll('.', '.' + breaklines);
    },

    /**
     * encodes text to be stored in data attributes of html elements
     * eg: "
     * @param {string} text 
     * @returns {string}
     */
    encodeTextContent(text) {
        return encodeURIComponent(text);
    },

    /**
     * decodes encoded text
     * @param {string} text 
     * @returns {string}
     */
    decodeTextContent(text) {
        return decodeURIComponent(text);
    },

    /**
     * check if the website is supported
     * @param {string} url 
     * @returns {bool}
     */
    isSiteSupported(url) {
        const baseDomain = this.getSiteBaseDomain(url);
        const supportedSites = Defines.SUPPORTED_SITES;

        return baseDomain in supportedSites;
    },

    /**
     * uses the package PSL : https://www.npmjs.com/package/psl
     * to determine the domain name of the website
     * some websites like bbc.com have other domains like : bbc.co.uk
     * this method simplifies the process
     * 
     * @param {string} url 
     * @returns 
     */
    getSiteBaseDomain(url) {
        const hostname = new URL(url).hostname.toLowerCase();
        const parsed = psl.parse(hostname);

        return parsed.domain;
    },

    getSiteSubDomain(url) {
        const hostname = new URL(url).hostname.toLowerCase();
        const parsed = psl.parse(hostname);

        return parsed.subdomain;
    },

    async getUrlResource(url) {
        const resource = url.pathname.split('/').filter(Boolean)[0];

        return resource;
    },

    /**
     * loads the site module dynamically based on the url
     * @param {string} url 
     * @returns 
     */
    async getSiteModule(url) {
        const isSiteSupported = this.isSiteSupported(url);
        const domain = this.getSiteBaseDomain(url);
        const subdomain = this.getSiteSubDomain(url);

        if (isSiteSupported === false) {
            return null;
        }

        switch (domain) {
            case 'reddit.com':
                const { default: Reddit } = await import('./sites/reddit.js');
                return Reddit;
            case 'bbc.com':
                const { default: Bbc } = await import('./sites/bbc.js');
                return Bbc;
            case 'bbc.co.uk.com':
                const { default: Bbcuk } = await import('./sites/bbcuk.js');
                return Bbcuk;
            case 'cnn.com':
                const { default: Cnn } = await import('./sites/cnn.js');
                return Cnn;
            case 'nytimes.com':
                const { default: Nytimes } = await import('./sites/nytimes.js');
                return Nytimes;
            case 'theguardian.com':
                const { default: Theguardian } = await import('./sites/theguardian.js');
                return Theguardian;
            case 'foxnews.com':
            case 'foxbusiness.com':
                const { default: Foxnews } = await import('./sites/foxnews.js');
                return Foxnews;
            case 'dailymail.co.uk':
                const { default: Dailymail } = await import('./sites/dailymail.js');
                return Dailymail;
            case 'yahoo.com':
                if (subdomain === 'finance') {
                    const { default: Yahoofinance } = await import('./sites/yahoofinance.js');
                    return Yahoofinance;
                }
                if (subdomain === 'sports') {
                    const { default: Yahoosports } = await import('./sites/yahoosports.js');
                    return Yahoosports;
                }
                if (subdomain === 'health' || subdomain === 'shopping') {
                    const { default: Yahoosports } = await import('./sites/yahoohealth.js');
                    return Yahoosports;
                }
                if (subdomain === 'autos' || subdomain === 'tech') {
                    const { default: Yahooautos } = await import('./sites/yahooautos.js');
                    return Yahooautos;
                }

                const { default: Yahoo } = await import('./sites/yahoo.js');
                return Yahoo;


            default:
                break;
        }

        return null;
    },

    /**
     * calls website's module dynamically to extract content
     * @returns {string} html
     */
    async extractContentFromSite() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;
        const isSiteSupported = this.isSiteSupported(url);

        // check if the website is supported
        if (isSiteSupported === false) {
            return;
        }

        // load the site module
        const siteModule = await this.getSiteModule(url);

        if (!siteModule) {
            return;
        }

        // get content of the site
        const siteContent = await siteModule.getPageContent();

        // save content to local storage
        await Storage.storeContent(url, siteContent);

        // generate readable html to be displayed
        const html = await siteModule.generateContentHTML(siteContent);

        return html;
    },

    /**
     * extracts page content and save it to store
     * then displays the html
     * @param {string} targetClass 
     * @returns 
     */
    async displaySiteContent(targetClass) {
        // display loading spinner
        View.displayLodingSpinner(targetClass);

        // get the whole page content
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const isSiteSupported = this.isSiteSupported(tab.url)

        if (isSiteSupported === false) {
            View.displayUnsupportedSiteMessage(targetClass);
            return;
        }

        // get html of the site content 
        const content = await this.extractContentFromSite();

        // display the html in the desired placeholder element
        View.displayHTMLByClass(targetClass, content);
    },

    /**
     * loads page content from local storage
     * or generates the content
     * @param {string} targetClass 
     * @returns 
     */
    async loadSiteContent(targetClass) {
        // display loading spinner
        View.displayLodingSpinner(targetClass);

        // get the whole page content
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const isSiteSupported = this.isSiteSupported(tab.url)

        if (isSiteSupported === false) {
            View.displayUnsupportedSiteMessage(targetClass);
            return;
        }

        // site is supported
        // display the content contrils
        View.displayMainContentControls();

        const siteModule = await this.getSiteModule(tab.url);
        // get site content from local storage
        const siteContent = await Storage.getContent(tab.url);

        // site's content is not saved
        if (siteContent === undefined) {
            await this.displaySiteContent(targetClass);
            return;
        }

        // generate html content
        const content = await siteModule.generateContentHTML(siteContent);
        // paste the html content
        View.displayHTMLByClass(targetClass, content);
        // check is the page has an audio link key saved
        // user might have already generated audio content
        const hasAudioContent = await this.hasAudioContent(tab.url);

        // if the page has a generated audio content
        // we load the audio, only if its not loaded 
        // we check if the offscreen document is not loaded
        if (hasAudioContent !== false) {
            // display audio controls
            const exists = await chrome.offscreen.hasDocument();
            if (!AudioPlayback.isAudioControlHTMLExists() && !exists) {
                AudioPlayback.displayAudioControlHTML();
                // load audio url
                AudioPlayback.loadAudio(hasAudioContent);
            }
        }
    },

    /**
     * cheks if the page has generated audio content
     * if so we display load the audio and we display 
     * the audio controls
     * 
     * @param {string} url 
     * @returns {string}
     */
    async hasAudioContent(url) {
        const content = await Storage.getContent(url);

        if (content === undefined) {
            return false;
        }

        if (content.audioUrl === undefined || content.audioUrl === '') {
            return false;
        }

        return content.audioUrl;
    },

    /**
     * runs a callback function when an element is loaded 
     * @param {string} selector 
     * @param {callback} callback 
     * @returns 
     */
    onElementReady(selector, callback) {
        const el = document.querySelector(selector);
        // element already loaded
        if (el) {
            callback(el);
            return;
        }

        // element not yet loaded
        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                callback(el);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    },

    /**
     * save user's settings
     * @param {string} key 
     * @param {any} value 
     */
    async saveSettings(key, value) {
        await Storage.appendContent('settings', key, value);
    },

    /**
     * get setting value
     * @param {string} key
     * @returns {any} value
     */
    async getSetting(key) {
        const settings = await Storage.getContent('settings');

        return settings[key] ?? undefined;
    },

    /**
     * response checker, checks each API call response to see if the user is still authenticated
     * if not, delete the Auth key and redirect the user to the login page
     * @param {*} response API reponse
     */
    async checkAuthenticationStatus(response) {
        if (undefined === response) {
            return;
        }

        // user un-authenticated
        if (response.status === 401 && response.statusText === "Unauthorized") {
            await Storage.removeContent('ttsocAuthToken');

            // redirect to login page
            await View.renderFirstContent();
        }
    }
}


export default Utils;