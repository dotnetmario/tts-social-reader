import Defines from "./defines";
import Auth from "./auth";
import Storage from "./storage";
import Utils from "./utils";

const Api = {
    /**
     * 
     * @param {string|object} content content to be sent to the Bachend
     * @param {string} site name of the website, based on this the Backend wit=ll format the content
     * @returns response from Backend
     */
    async generateAudio(content, site) {
        const token = await Auth.retreiveAuthToken();
        const body = {
            content: content, // content is an array holding keys with values
            site: site // site content
        };

        const response = await fetch(`${Defines.BASE_API_URL}/generate-audio`, {
            headers: {
                'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token
            },
            method: 'POST',
            body: JSON.stringify(body)
        });

        // checks if the user is still logged in, if not we redirect to login page
        await Utils.checkAuthenticationStatus(response);

        const data = await response.json();

        return data;
    },

    /**
     * takes user's settings stored locally and commit's it to the Backend database
     */
    async saveSettings() {
        const token = await Auth.retreiveAuthToken();
        const settings = await Storage.getContent('settings');
        const body = {
            'voiceName': settings.voiceName,
            'speakingRate': settings.speakingRate
        }

        const response = await fetch(`${Defines.BASE_API_URL}/save-settings`, {
            headers: {
                'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token
            },
            method: 'POST',
            body: JSON.stringify(body)
        });

        // checks if the user is still logged in, if not we redirect to login page
        await Utils.checkAuthenticationStatus(response);

        const data = await response.json();

        return data;
    }
};

export default Api;
