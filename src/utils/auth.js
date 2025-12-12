import Defines from "./defines";
import Storage from "./storage";
import Logger from "./logger";

const Auth = {
    /**
     * check response login validity
     * in case a token is expired we redirect to login view
     * 
     * @param {response} 
     * @return {boolean}
     */
    checkResponseAuthValidity(response) {
        if (!response.ok && response.status === 401) {
            // displayContent('login');
            // storeAuthToken('');
            // ... display error message if something is wrong
            return false;
        }

        return true;
    },

    /**
     * perform an API Auth call
     * 
     * @param {string} email 
     * @param {string} pass 
     */
    async performlogin(email, pass) {
        const creds = JSON.stringify({ email: email, password: pass });

        const response = await fetch(`${Defines.BASE_API_URL}/login`, {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: creds
        });

        const data = await response.json();

        // display error message
        if (data.success === false) {
            Logger.displayNotification('error', data.message);
            return;
        }

        const token = data.data.token
        await this.storeAuthToken(token);

        // Log and return the token
        return { valid: true, token: token };
    },

    /**
     * strores the auth token in browser storage
     * 
     * @param {string} token 
     */
    async storeAuthToken(token) {
        await Storage.storeContent('ttsocAuthToken', token);
    },

    /**
     * return Auth token from storage
     * @returns Auth token
     */
    async retreiveAuthToken() {
        const ttsocAuthToken = await Storage.getContent('ttsocAuthToken');

        return ttsocAuthToken !== null ? ttsocAuthToken : '';
    },

    /**
     * check if user is connected
     * @returns bool
     */
    async isUserAuthenticated() {
        const token = await this.retreiveAuthToken();

        return token !== undefined && token.length > 0;
    }
}


export default Auth;