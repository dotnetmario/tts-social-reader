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
        const html = `<div class="ttsoc-audio-control card-custom my-3 py-3 px-5 border border-3 border-success">
                        <div>
                            <button class="ttsoc-audio-control-play btn-dna2 btn-primary-dna text-dark mx-2 bg-success">
                                <i class="bi bi-play-fill"></i>
                                Play
                            </button>
                            <button class="ttsoc-audio-control-pause btn-dna2 btn-primary-dna text-dark mx-2 bg-warning">
                                <i class="bi bi-pause-fill"></i>
                                Pause
                            </button>

                            <button class="ttsoc-audio-control-close btn-dna2 btn-primary-dna text-dark mx-2 bg-danger float-end">
                                <i class="bi bi-x-lg text-dark"></i>
                            </button>
                        </div>

                        <div class="my-3">
                            <input type="range" class="ttsoc-audio-control-progressbar audio-progress-bar  form-range" min="0" max="100" value="0">
                        </div>

                        <div class="ttsoc-audio-control-timestamp fs-1 fw-bold">
                            <span class="ttsoc-audio-control-timestamp-current-time">00:00</span> /
                            <span class="ttsoc-audio-control-timestamp-duration">00:00</span>
                        </div>
                    </div>`;

        $(document).find(placeholder).html(html);
    },
    // displayAudioControlHTML(placeholder = '.ttsoc-audio-control-placeholder') {
    //     // <div class="player">

    //     //     <!-- PLAY -->
    //     //     <button class="btn-dna play" id="play">▶</button>

    //     //     <!-- META -->
    //     //     <div class="meta">
    //     //         <div class="title">Focus Audio</div>
    //     //         <div class="time" id="time">1:12 / 3:45</div>
    //     //     </div>

    //     //     <!-- SEEK -->
    //         // <div class="seek">
    //         //     <div class="track-seek">
    //         //         <div class="fill" id="fill"></div>
    //         //     </div>

    //         //     <input type="range" id="seek" min="0" max="100" value="35">

    //         //     <div class="mini-marks">
    //         //         <span class="mark" data="0">0:00</span>
    //         //         <span class="mark" data="25">0:56</span>
    //         //         <span class="mark" data="50">1:52</span>
    //         //         <span class="mark" data="75">2:48</span>
    //         //     </div>
    //         // </div>

    //     //     <!-- CLOSE -->
    //     //     <button class="btn-dna close" id="close">✕</button>

    //     // </div>
    //     const html = `<div class="player ttsoc-audio-control">

    //                     <button class="ttsoc-audio-control-play btn-dna play">
    //                         <i class="bi bi-play-fill"></i>
    //                     </button>

    //                     <div class="meta">
    //                         <div class="time ttsoc-audio-control-timestamp">
    //                             <span class="ttsoc-audio-control-timestamp-current-time">00:00</span> / 
    //                             <span class="ttsoc-audio-control-timestamp-duration">00:00</span>
    //                         </div>
    //                     </div>

    //                     <div class="seek">
    //                         <div class="track-seek">
    //                             <div class="fill"></div>
    //                         </div>

    //                         <input type="range" class="ttsoc-audio-control-progressbar seek-input" min="0" max="100" value="0">
    //                     </div>

    //                     <button class="btn-dna close ttsoc-audio-control-close">
    //                         <i class="bi bi-x-lg"></i>
    //                     </button>
    //                 </div>`;

    //     $(document).find(placeholder).html(html);
    // },

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

    setPlaybackSpeed(speed) {
        chrome.runtime.sendMessage({
            from: "audioPlayback",
            action: "speed",
            speed
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