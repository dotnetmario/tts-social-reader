// main elements that plays the audio track
const audio = document.getElementById("ttsoc-audio-palyer");

// this translates the messages comming from audio playback controls into actions 
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

        case "speed":
            audio.playbackRate = msg.speed;

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

// sends a status update of the audio track each 200 ms
setInterval(() => {
    chrome.runtime.sendMessage({
        action: "audioPlaybackUpdate",
        from: "offscreen",
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
        paused: audio.paused
    });
}, 200);
