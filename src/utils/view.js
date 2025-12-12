import Auth from "./auth";

const View = {
    /**
     * renders the first splash content, either the login page 
     * or the home page if the user is already authenticated
     * @returns 
     */
    async renderFirstContent() {
        const loggedin = await Auth.isUserAuthenticated();

        if (!loggedin) {
            await View.displayContent('login');
            return;
        }

        await View.displayContent('home');
    },

    /**
     * prints an HTML file content inside the main div
     * @param {string} page 
     * @param {string} container 
     * @returns string HTML content
     */
    async displayContent(page, container = "#ttsoc-content") {
        try {
            // Fetch the HTML file
            const response = await fetch(`../pages/${page}.html`);

            // Check if the request was successful
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

            // Get the text content of the response
            const text = await response.text();

            // Create a temporary DOM element to parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            // Extract the desired content from the parsed HTML
            const content = doc.body;//getElementById('ttsoc-content').innerHTML; // Adjust the selector as needed

            // Insert the content into the target div
            $(document).find(container).html(content);

            // scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            return content;
        } catch (error) {
            console.error('Error fetching or parsing HTML:', error);
        }
    },

    /**
     * displays a lodign spinner inside a container
     * @param {string} targetClass 
     */
    displayLodingSpinner(targetClass) {
        const spinnerHTML = `<div class="spinner-border ttsoc-loadingstatus mx-2 my-5" style="width: 5em; height: 5em;" role="status"></div>`;

        $(document).find(`div.${targetClass}`).html(spinnerHTML);
    },

    /**
     * parses html content inside a container
     * @param {string} targetClass 
     * @param {string} HTML 
     */
    displayHTMLByClass(targetClass, HTML) {
        $(document).find(`div.${targetClass}`).html(HTML);
    },

    /**
     * displays the message "Site is not supported" inside a container
     * @param {string} targetClass 
     */
    displayUnsupportedSiteMessage(targetClass) {
        const html = `<p class="fs-2 my-5 text-danger">Site is not supported</p>`;

        $(document).find(`div.${targetClass}`).html(html);
    }
}


export default View;