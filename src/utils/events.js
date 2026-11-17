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
            console.log('heere');
            await Utils.loadSiteContent('ttsoc-main-content');

            // display audio control when we get message from background.js
            chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
                if (msg.from === 'offscreen') {
                    if (msg.action === 'audioPlaybackUpdate') {
                        if (!AudioPlayback.isAudioControlHTMLExists()) {
                            AudioPlayback.displayAudioControlHTML();
                        }

                        // update the audio progress bar color (youtube style)
                        const percentage = (msg.currentTime / msg.duration) * 100;
                        $(document).find('.audio-progress-bar').css('--ttsoc-percentage', `${percentage}%`);

                        // get the playback speed setting
                        const speed = await Utils.getSetting('speakingRate');
                        // set playback speed
                        AudioPlayback.setPlaybackSpeed(speed ?? 1);
                    }
                }

                sendResponse(msg);
                return false;
            });
        }

        // innitializign tooltips
        $(document).find('[data-bs-toggle="tooltip"]')
            .each((idx, element) => {
                new bootstrap.Tooltip(element);
            });


        // AudioPlayback.displayAudioControlHTML('.ttsoc-audio-control-placeholder');
    });


    /**
     * ===========================================
     * ============== AUTHENTICATION =============
     * ===========================================
     */
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
            Logger.displayNotification('error', 'Soemthing went wrong, Try again later');
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
     * ===========================================
     * ============= \AUTHENTICATION =============
     * ===========================================
     */




    $(document).on('click', '#ttsoc-request-website-support', async function () {
        $(this).find('#ttsoc-request-website-support-spinner').removeClass('d-none');
        $(this).addClass('disabled btn-disabled bg-success');
        $(this).removeClass('bg-warning');


        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = tab.url;

            const response = await Api.requestWebsiteSupport(url);

            if (response.success === true) {
                Logger.displayNotification('success', 'Your request is well heard');
            }

            if (response.success === false) {
                Logger.displayNotification('error', 'Soemthing went wrong, Try again later');
            }
        } catch (error) {
            console.log(error);
        } finally {
            $(this).find('#ttsoc-request-website-support-spinner').addClass('d-none');
            $(this).removeClass('disabled btn-disabled bg-success');
            $(this).addClass('bg-warning');
        }
    });


    /**
     * display the truncated text "read more"
     */
    $(document).on('click', '.ttsoc-read-more', function () {
        const extraContent = $(this).parent().siblings('.ttsoc-extra-content');

        // content is hidden
        if (extraContent.hasClass('d-none')) {
            extraContent.removeClass('d-none');
            $(this).html('Read Less');
        } else {
            extraContent.addClass('d-none');
            $(this).html('Read More');
        }



        // const expanded = $(this).attr('expanded');
        // const text = Utils.decodeTextContent($(this).attr('data-text-content'));
        // // text is truncated
        // if (expanded === undefined) {
        //     // assign the attribute text the visible text
        //     $(this).text(text);
        //     // add an attribute to indicate if the text expanded
        //     $(this).attr('expanded', 'expanded');

        //     return;
        // }

        // // text is not truncated
        // const slicedText = Utils.sliceText(text);
        // $(this).text(slicedText);
        // // remove the attribute
        // $(this).removeAttr('expanded');
    });


    /**
     * check the checkbox input when the comment card is clicked
     */
    $(document).on('click', '.ttsoc-send-content-comment', function () {
        // ttsoc-send-content
        const checkbox = $(this).find('input.ttsoc-send-content');

        // input checked
        if (checkbox.is(':checked')) {
            $(this).removeClass('border border-success border-3');
            checkbox.removeAttr('checked');
        } else {
            $(this).addClass('border border-success border-3');
            checkbox.attr('checked', 'checked');
        }
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
            Logger.displayNotification('error', 'Soemthing went wrong');
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
        // return;
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
            });

            // load site module dynamically based on the URL
            const siteModule = await Utils.getSiteModule(url);
            ttsContent = siteModule.buildSelectedContent(content, selectedContentIds);

            // send call to generate content audio 
            const site = siteModule.getName();
            console.log({
                'site': site,
                'content': content,
                'ttsContent': ttsContent,
            });
            return;
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
            Logger.displayNotification('error', 'Soemthing went wrong, Try again later');
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
    $(document).on('click', '.ttsoc-settings-voice-name-audio', async function (e) {
        $(document).find('.ttsoc-settings-voice-name-audio').removeClass('border border-success border-3');
        $(document).find('.ttsoc-settings-voice-name-audio-volume-icon').remove();
        $(this).addClass('border border-success border-3');

        const radio = $(this).find('.ttsoc-settings-voice-name-audio-radio');
        radio.prop('checked', true);
        const voiceName = radio.val();
        const audio = $(this).find('audio')[0];

        $(document).find('.ttsoc-settings-voice-name-audio audio').each(function () {
            if (audio != this) {
                this.pause();
            }
        });

        // audio is paused
        if (audio.paused) {
            audio.play();
            $(this).find('.card-title').prepend('<i class="bi bi-volume-up-fill ttsoc-settings-voice-name-audio-volume-icon mx-2 text-success"></i>');
        } else { // audio is playing
            audio.pause();
        }

        await Utils.saveSettings('voiceName', voiceName);
    });

    /**
     * store the speed of speach in local storage
     */
    $(document).on('change', '#ttsoc-settings-speaking-rate', async function () {
        const speakingRate = $(this).val();

        $(document).find('#ttsoc-settings-speaking-rate-value').text(' x' + speakingRate);

        await Utils.saveSettings('speakingRate', speakingRate);

        // change the speeaking rate on the fly
        if (AudioPlayback.isAudioControlHTMLExists()) {
            AudioPlayback.setPlaybackSpeed(speakingRate);
        }
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
            Logger.displayNotification('error', Defines.ERROR_MESSAGES.generic);
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
    // $(document).on('focus', '#ttsoc-custom-text-value', function () {
    //     $(this).val('');
    // });

    // $(document).on('blur', '#ttsoc-custom-text-value', function () {
    //     $(this).val('Place your text here...');
    // });

    /**
     * API call to generate audio based on custom text the user provided
     */
    $(document).on('click', '#ttsoc-custom-text-generate', async function () {
        const text = $(document).find('#ttsoc-custom-text-value').val();

        if (text.length <= 0) {
            $(document).find('#ttsoc-custom-text-value').addClass('border-2 border border-danger');

            setTimeout(() => {
                $(document).find('#ttsoc-custom-text-value').removeClass('border-2 border border-danger');
            }, 500);
            return;
        }

        $(this).find('#ttsoc-custom-text-generate-spinner').removeClass('d-none');
        $(this).addClass('disabled');

        try {
            // send call to generate content audio 
            const response = {};//await Api.generateAudio(text, 'custom-text');

            if (response.success === true || true) {
                console.log('in the request response');
                // const audioUrl = await response.data.path_to_file;
                const audioUrl = 'C:/laragon/www/tts-social-reader-api/public/storage/tts/11/2025-12-14/audio_1765736449_cdbf308f-dd60-4f57-9f00-9cad33adb54c.mp3';

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
            Logger.displayNotification('error', 'Oops... Something Went Wrong :(');
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