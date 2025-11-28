import AudioPlayback from "./audioplayback";
import Utils from "./utils";


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.from === 'offscreen') {
        if (msg.action === 'audioPlaybackUpdate') {
            const pct = (msg.currentTime / msg.duration) * 100;

            Utils.onElementReady('#ttsoc-audio-control', function () {
                document.getElementById("ttsoc-audio-control-progressbar").value = pct;
                document.getElementById("ttsoc-audio-control-timestamp-current-time").textContent = AudioPlayback.formatTime(msg.currentTime);
                document.getElementById("ttsoc-audio-control-timestamp-duration").textContent = AudioPlayback.formatTime(msg.duration);
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
