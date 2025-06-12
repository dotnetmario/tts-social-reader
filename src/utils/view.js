// await renderFirstContent();
import Auth from "./auth";


const Content = {
    /**
     * renders the first splash content
     * @returns renders the f
     */
    async renderFirstContent() {
        const loggedin = await Auth.is_user_authenticated();

        // console.log(loggedin, Auth.retreiveAuthToken());

        if (!loggedin) {
            await Content.displayContent('login');
            return;
        }

        await Content.displayContent('home');
    },

    /**
     * prints a file content inside the main div
     * @param {string} page 
     * @param {string} container 
     * @returns string HTML content
     */
    async displayContent(page, container = "#ttsoc-content") {
        try {
            // Fetch the HTML file
            const response = await fetch(`../pages/${page}.html`);

            console.log({response, path: `../pages/${page}.html`});

            // Check if the request was successful
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

            // Get the text content of the response
            const text = await response.text();

            // Create a temporary DOM element to parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            console.log(doc);

            // Extract the desired content from the parsed HTML
            const content = doc.body;//getElementById('ttsoc-content').innerHTML; // Adjust the selector as needed

            // Insert the content into the target div
            $(document).find(container).html(content);

            return content;
        } catch (error) {
            console.error('Error fetching or parsing HTML:', error);
        }
    },

    displayButtonLoadingStatus(class_name) {
        let loading_html = `<div class="spinner-border ttsoc-loadingstatus mx-2" style="width: 1em; height: 1em;" role="status"></div>`;

        $(document).find(`button.${class_name}`).prepend(loading_html);
        $(document).find(`button.${class_name}`).addClass('disabled');
    },

    removeButtonLoadingStatus(class_name) {
        $(document).find(`button.${class_name}`).find(`div.ttsoc-loadingstatus`).remove();
        $(document).find(`button.${class_name}`).removeClass('disabled');
    }
}


export default Content;