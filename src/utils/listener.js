import AudioPlayback from "./audioplayback";
import Utils from "./utils";


// runtime messages listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.from === 'offscreen') {
        // runtime message from the offscreen document,
        // this updates the audio payback control's timestamps
        if (msg.action === 'audioPlaybackUpdate') {
            const pct = (msg.currentTime / msg.duration) * 100;

            // wait till the audio playback controls is loaded
            Utils.onElementReady('.ttsoc-audio-control', function () {
                $(document).find('.ttsoc-audio-control-progressbar').each((idx, ele) => {
                    $(ele).val(pct);
                });
                $(document).find('.ttsoc-audio-control-timestamp-current-time').each((idx, ele) => {
                    $(ele).text(AudioPlayback.formatTime(msg.currentTime));
                });
                $(document).find('.ttsoc-audio-control-timestamp-duration').each((idx, ele) => {
                    $(ele).text(AudioPlayback.formatTime(msg.duration));
                });
            });

        }
    }

    // background js messages
    if (msg.from === 'background') {
        console.log('background message recieved', msg);
        if (msg.action === 'offscreenDocumentLoaded') {
            AudioPlayback.playAudio();
        }
    }

    sendResponse(msg);
    return false;
});
