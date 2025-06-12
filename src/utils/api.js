// const fs = require('fs');
// const util = require('util');
// const path = require('path');
// const textToSpeech = require('@google-cloud/text-to-speech');
// import { TextToSpeechClient } from '@google-cloud/text-to-speech';
// import { writeFile } from 'node:fs/promises';  // Node.js file system module
// Optional: use keyFilename if not relying on env var
// const client = new TextToSpeechClient();

import Defines from "./defines";
import Auth from "./auth";

const Api = {
    // config: {
    //     input: { text: '' },
    //     voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
    //     audioConfig: { audioEncoding: 'MP3' },
    // },

    // /**
    //  * Set the text to convert to speech
    //  * @param {string} text
    //  */
    // setText(text) {
    //     this.config.input.text = text;
    //     return this;
    // },

    // /**
    //  * Set voice parameters
    //  * @param {object} voiceParams - { languageCode, ssmlGender, name }
    //  */
    // setVoice(voiceParams = {}) {
    //     this.config.voice = { ...this.config.voice, ...voiceParams };
    //     return this;
    // },

    // /**
    //  * Set audio configuration
    //  * @param {object} audioParams - { audioEncoding, speakingRate, pitch, volumeGainDb }
    //  */
    // setAudioConfig(audioParams = {}) {
    //     this.config.audioConfig = { ...this.config.audioConfig, ...audioParams };
    //     return this;
    // },

    // /**
    //  * Generate speech using current config
    //  * @returns {Promise<Buffer>}
    //  */
    // async generate() {
    //     const [response] = await client.synthesizeSpeech(this.config);
    //     return response.audioContent;
    // },


    // /**
    //  * Save audio content as a Blob and trigger download
    //  * @param {string} filename - file name for the download
    //  */
    // async saveToFile(filename) {
    //     const audio = await this.generate();

    //     // Create a Blob from the audio content
    //     const blob = new Blob([audio], { type: 'audio/mp3' }); // You can adjust the MIME type based on your content

    //     // Create a link element to trigger the download
    //     const link = document.createElement('a');
    //     link.href = URL.createObjectURL(blob);
    //     link.download = filename; // Set the filename for the downloaded file

    //     // Programmatically click the link to trigger the download
    //     link.click();

    //     console.log(`✅ Audio saved as: ${filename}`);
    // }


    async generateAudio(text) {
        const creds = JSON.stringify({ text: text });
        const token = await Auth.retreiveAuthToken();

        console.log(`${Defines.base_uri}/tts-reader/generate-audio`, {
            headers: {
                'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token
            },
            method: 'POST',
            body: creds
        });

        const response = await fetch(`${Defines.base_uri}/tts-reader/generate-audio`, {
            headers: {
                'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token
            },
            method: 'POST',
            body: creds
        });

        

        const data = await response.json();

        console.log({ "data": data, 'hehe' : data['hehe'] });

        // // check the response
        // if (!response.ok) {
        //     // Handle HTTP errors
        //     return { valid: false, errors: data };
        // }

        // const token = data.token
        // await Auth.storeAuthToken(token);

        // // Log and return the token
        // return { valid: true, token: token };
    }
};

export default Api;
