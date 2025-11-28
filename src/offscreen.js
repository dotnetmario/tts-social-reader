const audio = document.getElementById("ttsoc-audio-palyer");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.action) {
        case "load":
            audio.src = msg.url;
            break;
        case "play":
            audio.play();
            break;

        case "pause":
            audio.pause();
            break;

        case "resume":
            audio.play();
            break;

        case "seek":
            const newTime = audio.duration * msg.position;
            audio.currentTime = newTime;
            break;

        case "getState":
            sendResponse({
                currentTime: audio.currentTime,
                duration: audio.duration,
                paused: audio.paused
            });
            break;
    }

    sendResponse(msg);
    return true;
});

setInterval(() => {
    chrome.runtime.sendMessage({
        action: "audioPlaybackUpdate",
        from: "offscreen",
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
        paused: audio.paused
    });
}, 200);
