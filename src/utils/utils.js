import AudioPlayback from "./audioplayback.js";
import Defines from "./defines";
import Storage from "./storage.js";
import View from "./view.js";

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
        const hostname = new URL(url).hostname.toLowerCase();
        const supportedSites = Defines.SUPPORTED_SITES;
        const match = Object.keys(supportedSites).find(domain => hostname == domain);

        if (!match) {
            return false;
        }

        return true;
    },

    /**
     * loads the site module dynamically based on the url
     * @param {string} url 
     * @returns 
     */
    async getSiteModule(url) {
        const isSiteSupported = this.isSiteSupported(url);
        const hostname = new URL(url).hostname.toLowerCase();

        if (isSiteSupported === false) {
            return null;
        }

        switch (hostname) {
            case 'www.reddit.com':
                const { default: Reddit } = await import('./reddit.js');
                return Reddit;

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