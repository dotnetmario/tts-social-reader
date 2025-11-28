import Defines from "./defines";
import Auth from "./auth";

const Api = {
    async generateAudio(content) {
        const token = await Auth.retreiveAuthToken();
        const creds = {
            content: content, // content is an array holding keys with values
            site: 'reddit' // site content
        };

        const response = await fetch(`${Defines.BASE_URL}/generate-audio`, {
            headers: {
                'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token
            },
            method: 'POST',
            body: JSON.stringify(creds)
        });

        const data = await response.json();

        return data;
    }
};

export default Api;
