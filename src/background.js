// background service worker

async function ensureOffscreenDocument() {
    const exists = await chrome.offscreen.hasDocument();

    if (!exists) {
        await chrome.offscreen.createDocument({
            url: "pages/offscreen.html",
            reasons: ["AUDIO_PLAYBACK", "IFRAME_SCRIPTING"],
            justification: "Need to play audio without UI"
        });

        chrome.runtime.sendMessage({ from: 'background', action: 'offscreenDocumentLoaded' });
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // event comming from audioplayback.js or events.js
    // data will be sent to offscreen.js
    if (msg.from === 'audioPlayback') {
        ensureOffscreenDocument()
            .then(() => {
                chrome.runtime.sendMessage(msg);
            });
    }

    if (msg.from === 'offscreen') {
        if (msg.action === 'audioPlaybackUpdate') {
            chrome.runtime.sendMessage(msg);
        }
    }

    if (msg.from === 'events') {
        chrome.runtime.sendMessage(msg);
    }

    sendResponse(msg);
    return false;
});