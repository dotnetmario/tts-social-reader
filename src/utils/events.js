import $ from 'jquery';
import Auth from './auth.js';
import View from './view.js';
import Storage from './storage.js';
import Utils from './utils.js';
import Api from './api.js';
import AudioPlayback from './audioplayback.js';
import Logger from './logger.js';
import Defines from './defines.js';
import './listener.js';



$(function () {
    /**
     * when the document is ready and '.ttsoc-main-content'
     * we check if the user is authenticated and display either 
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

    /**
     * login event
     */
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
     * register event 
     */
    $(document).on('click', '#ttsoc-performregister', function (e) {
        e.preventDefault();
        const register = `${Defines.BASE_URL}/register`;
        window.open(register, "_blank");
    });

    /**
     * display the truncated text "read more"
     */
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
    });

    /**
     * extract and display content from the page
     * 
     */
    $(document).on('click', '#ttsoc-extract-text', async function () {
        $(this).find('#ttsoc-extract-text-spinner').removeClass('d-none');
        $(this).addClass('disabled');

        try {
            await Utils.displaySiteContent('ttsoc-main-content');
        } catch (error) {
            console.log(error);
        } finally {
            $(this).find('#ttsoc-extract-text-spinner').addClass('d-none');
            $(this).removeClass('disabled');
        }
    });

    /**
     * takes content from store and constructs a request based
     * on what content the user has selected for audio generation
     */
    $(document).on('click', '#ttsoc-generate-audio', async function () {
        $(this).find('#ttsoc-generate-audio-spinner').removeClass('d-none');
        $(this).addClass('disabled');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = tab.url;

            const isSiteSupported = Utils.isSiteSupported(url);
            // display error message if site is not supported
            if (isSiteSupported === false) {
                Logger.displayNotification('error', 'Site is not supported');
                return;
            }
            const content = await Storage.getContent(url);
            let ttsContent = {};

            // extract content selected by the user
            const selectedContentIds = [];
            $(document).find('input.ttsoc-send-content:checked').each((idx, ele) => {
                selectedContentIds.push($(ele).attr('id'));
            })

            // load site module dynamically based on the URL
            const siteModule = await Utils.getSiteModule(url);
            ttsContent = siteModule.buildSelectedContent(content, selectedContentIds);

            // send call to generate content audio 
            const site = siteModule.getName();
            // API call to generate the audio
            const response = await Api.generateAudio(ttsContent, site);

            if (response.success === true) {
                const audioUrl = await response.data.path_to_file;

                // save audio file to page content store
                await Storage.appendContent(url, 'audioUrl', audioUrl);

                // display audion control interface 
                AudioPlayback.displayAudioControlHTML();

                // load the audio url into the offcreen document
                AudioPlayback.loadAudio(audioUrl);
            }

            if (response.success === false) {
                Logger.displayNotification('error', response.message);
            }
        } catch (error) {
            console.log(error);
        } finally {
            $(this).find('#ttsoc-generate-audio-spinner').addClass('d-none');
            $(this).removeClass('disabled');
        }
    });

    /**
     * ===========================================
     * ============== AUDIO CONTROL ==============
     * ===========================================
     */
    /**
     * press play
     */
    $(document).on('click', '.ttsoc-audio-control-play', function () {
        AudioPlayback.playAudio();
    });

    /**
     * press pause
     */
    $(document).on('click', '.ttsoc-audio-control-pause', function () {
        AudioPlayback.pauseAudio();
    });

    /**
     * fast forward to a specific point in the audio track
     */
    $(document).on('input', '.ttsoc-audio-control-progressbar', async function (e) {
        // Slider value: 0–100 percentage
        const pct = e.target.value / 100;

        // Ask offscreen page to seek a time line
        chrome.runtime.sendMessage({
            from: "events",
            action: "seek",
            position: pct
        });
    });

    /**
     * remove the offscreen document and audio playback controls
     */
    $(document).on('click', '.ttsoc-audio-control-close', async function () {
        const exists = await chrome.offscreen.hasDocument();

        if (exists) {
            await chrome.offscreen.closeDocument();
        }

        // remove audio control player
        $(document).find('.ttsoc-audio-control').remove();
    });
    /**
     * ============================================
     * ============== /AUDIO CONTROL ==============
     * ============================================
     */


    /**
     * ============================================
     * ================= SETTINGS =================
     * ============================================
     */
    /**
     * waits when the setting page is loaded, then preselects 
     * the user prefered settings located in local storage
     */
    Utils.onElementReady('#ttsoc-settings-content', async function () {
        const settings = await Storage.getContent('settings');

        if (settings !== undefined) {
            if (settings.voiceName !== undefined) {
                $(document).find('.ttsoc-settings-voice-name-audio').removeClass('border border-success border-3');
                $(document).find(`#ttsoc-settings-voice-name input[value="${settings.voiceName}"]`)
                    .parents('.ttsoc-settings-voice-name-audio').addClass('border border-success border-3');
            }

            if (settings.speakingRate !== undefined) {
                $(document).find('#ttsoc-settings-speaking-rate').val(settings.speakingRate);
            }
        }

        $(document).find('#ttsoc-settings-speaking-rate').trigger('change');
    });

    /**
     * when a voice choice is clicked, plays the audio sample for the voice type
     * and stores the voice name value in local storage
     */
    $(document).on('click', '.ttsoc-settings-voice-name-audio', async function () {
        $(document).find('.ttsoc-settings-voice-name-audio').removeClass('border border-success border-3');
        $(this).find('.ttsoc-settings-voice-name-audio-radio')[0].click();
        $(this).addClass('border border-success border-3');

        const voiceName = $(this).find('.ttsoc-settings-voice-name-audio-radio').val();

        const audio = $(this).find('audio');
        $(document).find('.ttsoc-settings-voice-name-audio audio').each(function () {
            this.pause();
        });
        audio[0].play();

        await Utils.saveSettings('voiceName', voiceName);

    });

    /**
     * store the speed of speach in local storage
     */
    $(document).on('change', '#ttsoc-settings-speaking-rate', async function () {
        const speakingRate = $(this).val();

        $(document).find('#ttsoc-settings-speaking-rate-value').text(' x' + speakingRate);

        await Utils.saveSettings('speakingRate', speakingRate);
    });

    /**
     * API call to pressist the user's setting in the Backend
     */
    $(document).on('click', '#ttsoc-settings-save', async function () {
        $(this).find('#ttsoc-settings-save-spinner').removeClass('d-none');
        $(this).addClass('disabled');

        try {
            const response = await Api.saveSettings();

            if (response.success === true) {
                Logger.displayNotification('success', Defines.SUCCESS_MESSAGES.settings);
            }
            if (response.success === false) {
                Logger.displayNotification('error', Defines.ERROR_MESSAGES.generic);
            }
        } catch (error) {
            console.log(error);
        } finally {
            $(this).find('#ttsoc-settings-save-spinner').addClass('d-none');
            $(this).removeClass('disabled');
        }
    });
    /**
     * =============================================
     * ================= /SETTINGS =================
     * =============================================
     */


    /**
     * =============================================
     * ================ CUSTOM TEXT ================
     * =============================================
     */
    $(document).on('focus', '#ttsoc-custom-text-value', function () {
        $(this).val('');
    });

    // $(document).on('blur', '#ttsoc-custom-text-value', function () {
    //     $(this).val('Place your text here...');
    // });

    /**
     * API call to generate audio based on custom text the user provided
     */
    $(document).on('click', '#ttsoc-custom-text-generate', async function () {
        const text = $(document).find('#ttsoc-custom-text-value').val();
        console.log(text);

        if (text.length <= 0) {
            return;
        }

        $(this).find('#ttsoc-custom-text-generate-spinner').removeClass('d-none');
        $(this).addClass('disabled');

        try {
            // send call to generate content audio 
            const response = await Api.generateAudio(text, 'custom-text');

            if (response.success === true) {
                const audioUrl = await response.data.path_to_file;

                // save audio file to page content store
                // await Storage.appendContent(url, 'audioUrl', audioUrl);

                // display audio interface control
                AudioPlayback.displayAudioControlHTML('.ttsoc-audio-control-placeholder');

                // load the audio url into 
                AudioPlayback.loadAudio(audioUrl);
            }

            if (response.success === false) {
                Logger.displayNotification('error', response.message);
            }
        } catch (error) {
            console.log(error);
        } finally {
            $(this).find('#ttsoc-custom-text-generate-spinner').addClass('d-none');
            $(this).removeClass('disabled');
        }
    });
    /**
     * ==============================================
     * ================ /CUSTOM TEXT ================
     * ==============================================
     */



});