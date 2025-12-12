import Toastify from 'toastify-js';



const Logger = {
    // logConsole(message, level) {
    //     // ....
    // },

    /**
     * returns a color associated with the notification
     * @param {string} type 
     * @returns 
     */
    getNotificationColor(type = 'success') {
        const levels = {
            'primary': '#0d6efd',
            'success': '#198754',
            'error': '#dc3545',
            'info': '#0dcaf0',
            'warning': '#ffc107'

        };

        return levels[type] ?? levels['primary'];
    },

    /**
     * displays a flash toast notification with a close button
     * @param {string} type primary, success, error
     * @param {string} message 
     * @returns 
     */
    displayNotification(type, message) {
        const color = this.getNotificationColor(type);

        if(undefined === message || message.length <= 0){
            return;
        }

        Toastify({
            text: message,
            duration: 5000,
            close: true,
            backgroundColor: color,
        }).showToast();
    }
}

export default Logger;