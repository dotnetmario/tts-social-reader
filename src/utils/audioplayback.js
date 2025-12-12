const AudioPlayback = {

    /**
     * check if the audio player is displayed
     * @returns {bool} audio controls exists
     */
    isAudioControlHTMLExists() {
        const exists = $(document).find('.ttsoc-audio-control').length;

        return exists !== 0;
    },

    /**
     * displays the audio playback controls 
     * @param {string} placeholder jQuery selector for the element where the audio player controls will be appended
     */
    displayAudioControlHTML(placeholder = '.ttsoc-audio-control-placeholder') {
        const html = `<div id="" class="my-3 py-3 px-5 shadow-lg ttsoc-audio-control">
                        <div>
                            <button id=""
                                class="ttsoc-audio-control-play btn btn-success rounded-pill shadow-lg mx-2">Play</button>
                            <button id=""
                                class="ttsoc-audio-control-pause btn btn-warning rounded-pill shadow-lg mx-2">Pause</button>

                            <button id="" class="ttsoc-audio-control-close btn btn-danger rounded-pill shadow-lg float-end">
                                <i class="bi bi-x-lg text-light"></i>
                            </button>
                        </div>

                        <div class="my-3">
                            <input id="" type="range" class="ttsoc-audio-control-progressbar form-range" min="0" max="100" value="0">
                        </div>

                        <div class="ttsoc-audio-control-timestamp">
                            <span class="ttsoc-audio-control-timestamp-current-time">00:00</span> /
                            <span class="ttsoc-audio-control-timestamp-duration">00:00</span>
                        </div>
                    </div>`;

        $(document).find(placeholder).html(html);
    },

    /**
     * loads the offscreen dom where the audio is played
     * @param {string} url url to the audio track
     */
    loadAudio(url) {
        chrome.runtime.sendMessage({
            from: "audioPlayback",
            action: "load",
            url: url
        });
    },

    playAudio() {
        chrome.runtime.sendMessage({
            from: "audioPlayback",
            action: "play"
        });
    },

    pauseAudio() {
        chrome.runtime.sendMessage({
            from: "audioPlayback",
            action: "pause"
        });
    },

    resumeAudio() {
        chrome.runtime.sendMessage({
            from: "audioPlayback",
            action: "resume"
        });
    },

    seekAudio(time) {
        chrome.runtime.sendMessage({
            from: "audioPlayback",
            action: "seek",
            time
        });
    },

    /**
     * formats time into xx:xx
     * @param {string} seconds 
     * @returns {string} timestamp
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) {
            return "00:00";
        }

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) {
            return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}


export default AudioPlayback;