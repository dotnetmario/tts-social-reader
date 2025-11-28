import $ from 'jquery';
import Auth from './auth.js';
import View from './view.js';
import Storage from './storage.js';
import Utils from './utils.js';
import Api from './api.js';
import AudioPlayback from './audioplayback.js';
import './listener.js';



$(function () {
    /**
     * when the document is ready and '.ttsoc-main-content'
     * we check if the user is authenticated anddisplay either 
     * page content or the login screen
     */
    Utils.onElementReady('.ttsoc-main-content', async function () {
        const isUserAuthenticated = await Auth.isUserAuthenticated();

        if (isUserAuthenticated === true) {
            await Utils.loadSiteContent('ttsoc-main-content');

            // display audio control when we get message from background.js
            chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
                if (msg.from === 'offscreen') {
                    if (msg.action === 'audioPlaybackUpdate') {
                        if (!AudioPlayback.isAudioControlHTMLExists()) {
                            AudioPlayback.displayAudioControlHTML();
                        }
                    }
                }

                sendResponse(msg);
                return false;
            });
        }
    });

    // login event
    $(document).on('click', '#ttsoc-performlogin', async function () {
        const email = $(document).find('#ttsoc-loginemail').val();
        const pass = $(document).find('#ttsoc-loginpassword').val();

        $(this).find('#ttsoc-loginspinner').removeClass('d-none');
        $(this).addClass('disabled');

        try {
            const token = await Auth.performlogin(email, pass);
            // redering the first content (either login or home page)
            await View.renderFirstContent();
        } catch (error) {
            console.log(error);
        } finally {
            $(this).find('#ttsoc-loginspinner').addClass('d-none');
            $(this).removeClass('disabled');
        }
    });

    /**
     * extract and display content from the page
     * 
     */
    $(document).on('click', '#ttsoc-extract-text', async function () {
        await Utils.displaySiteContent('ttsoc-main-content');
    });

    /**
     * takes content from store and constructs a request based
     * on what content the user has selected for audio generation
     */
    $(document).on('click', '#ttsoc-generate-audio', async function () {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;
        const content = await Storage.getContent(url);
        let ttsContent = {};

        // extract content selected by the user
        const selectedContentIds = [];
        $(document).find('input.ttsoc-send-content:checked').each((idx, ele) => {
            selectedContentIds.push($(ele).attr('id'));
        })

        const siteModule = await Utils.getSiteModule(url);
        ttsContent = siteModule.buildSelectedContent(content, selectedContentIds);

        // send call to generate content audio 
        const response = await Api.generateAudio(ttsContent);

        if (response.success === true) {
            const audioUrl = await response.data.path_to_file;

            // save audio file to page content store
            await Storage.appendContent(url, 'audioUrl', audioUrl);

            // display audion interface control
            AudioPlayback.displayAudioControlHTML();

            // load the audio url into 
            AudioPlayback.loadAudio(audioUrl);
        }
    });

    /**
     * ===========================================
     * ============== AUDIO CONTROL ==============
     * ===========================================
     */
    $(document).on('click', '#ttsoc-audio-control-play', function () {
        AudioPlayback.playAudio();
    });

    $(document).on('click', '#ttsoc-audio-control-pause', function () {
        AudioPlayback.pauseAudio();
    });

    $(document).on('input', '#ttsoc-audio-control-progressbar', async function (e) {
        // Slider value: 0–100 percentage
        const pct = e.target.value / 100;

        // Ask offscreen page to seek a time line
        chrome.runtime.sendMessage({
            from: "events",
            action: "seek",
            position: pct
        });
    });

    $(document).on('click', '#ttsoc-audio-control-close', async function () {
        const exists = await chrome.offscreen.hasDocument();

        if (exists) {
            await chrome.offscreen.closeDocument();
        }

        // remove audio control player
        $(document).find('#ttsoc-audio-control').remove();
    });
    /**
     * ===========================================
     * ============== AUDIO CONTROL ==============
     * ===========================================
     */

    // event for "read more" functionality
    $(document).on('click', '.ttsoc-read-more', function () {
        const expanded = $(this).attr('expanded');
        const text = Utils.decodeTextContent($(this).attr('data-text-content'));
        // text is truncated
        if (expanded === undefined) {
            // assign the attribute text the visible text
            $(this).text(text);
            // add an attribute to indicate if the text expanded
            $(this).attr('expanded', 'expanded');

            return;
        }

        // text is not truncated
        const slicedText = Utils.sliceText(text);
        $(this).text(slicedText);
        // remove the attribute
        $(this).removeAttr('expanded');

        // scroll into view
        // this.scrollIntoView({ behavior: 'smooth' })
    });
});