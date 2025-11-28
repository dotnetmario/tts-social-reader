const AudioPlayback = {

    isAudioControlHTMLExists() {
        const exists = $(document).find('#ttsoc-audio-control').length;

        return exists !== 0;
    },

    displayAudioControlHTML() {
        const html = `<div id="ttsoc-audio-control" class="my-3 py-3 px-5 shadow-lg">
                        <div>
                            <button id="ttsoc-audio-control-play"
                                class="btn btn-success rounded-pill shadow-lg mx-2">Play</button>
                            <button id="ttsoc-audio-control-pause"
                                class="btn btn-warning rounded-pill shadow-lg mx-2">Pause</button>

                            <button id="ttsoc-audio-control-close" class="btn btn-danger rounded-pill shadow-lg float-end">
                                <i class="bi bi-x-lg text-light"></i>
                            </button>
                        </div>

                        <div class="my-3">
                            <input id="ttsoc-audio-control-progressbar" type="range" class="form-range" min="0" max="100" value="0">
                        </div>

                        <div id="ttsoc-audio-control-timestamp">
                            <span id="ttsoc-audio-control-timestamp-current-time">00:00</span> /
                            <span id="ttsoc-audio-control-timestamp-duration">00:00</span>
                        </div>
                    </div>`;

        $(document).find('#ttsoc-audio-control-placeholder').html(html);
    },

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
     * @returns 
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