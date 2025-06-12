// import './global.js';
import $ from 'jquery';
import Auth from './auth.js';
import Api from './api.js';


$(function () {

    // login event
    $(document).on('click', '#ttsoc-performlogin', async function () {
        let email = $(document).find('#ttsoc-loginemail').val();
        let pass = $(document).find('#ttsoc-loginpassword').val();

        $(this).find('#ttsoc-loginspinner').removeClass('d-none');
        $(this).addClass('disabled');

        console.log({ email, pass });

        try {
            const token = await Auth.performlogin(email, pass);

        } catch (error) {

        } finally {
            $(this).find('#ttsoc-loginspinner').addClass('d-none');
            $(this).removeClass('disabled');
        }


        console.log({ token });
    });

    $(document).on('click', '#ttsoc-generate-audio', async function () {
        console.log('Generating audio...');

        // await Api
        //     .setText('Welcome to the future of speech synthesis.')
        //     .setVoice({ languageCode: 'en-GB', ssmlGender: 'FEMALE' })
        //     .setAudioConfig({ speakingRate: 1.0, pitch: 0.0 })
        //     .saveToFile('output.mp3');
        // .saveToFile(path.join(__dirname, 'output.mp3'));

        await Api.generateAudio("weeeeee");

        console.log('Done Generating audio...');
    });
});