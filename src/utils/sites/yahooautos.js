const Yahooautos = {
    /**
     * returns an identifier name for the website, required in the Backend
     * @returns {string} site name
     */
    getName() {
        return 'yahoo';
    },

    /**
     * returns the current active tab
     * @returns {object} active tab
     */
    async getTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        return tab;
    },

    /**
     * return the active tab's page HTML
     * @returns {string}
     */
    async getHTML() {
        const tab = await this.getTab();

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                return document.documentElement.outerHTML;
            }
        });

        return results[0].result;
    },

    async getPostAuthor() {
        const htmlContent = await this.getHTML();

        let authors = '';

        $(htmlContent).find('article').first().find('header').first().find('div.inline-block').first()
            .clone().find('time').remove().end()
            .each((idx, ele) => {
                authors += $(ele).text() + " ";
            });


        return authors.trim();
    },

    async getPostTitle() {
        const htmlContent = await this.getHTML();

        return $(htmlContent).find('article').first().find('h1').first().text();
    },

    async getPostContent() {
        const htmlContent = await this.getHTML();

        let paragraphs = '';

        const $articleBody = $(htmlContent)
            .find('article').first()
            .find('div[data-article-body]').first()
            .clone();

        // now safely read content
        $articleBody.find('p, h1, h2, h3, h4, h5, h6').each((idx, el) => {
            const $el = $(el);
            const text = $el.text();
            const nodeName = el.localName;

            paragraphs += `<${nodeName}>${text}</${nodeName}>`;
        });

        return paragraphs;
    },

    /**
     * returns an object containing all of the page contents
     * @returns {object} page content
     */
    async getPageContent() {
        return {
            author: await this.getPostAuthor(),
            title: await this.getPostTitle(),
            postContent: await this.getPostContent()
        };
    },

    /**
 * displays the content extracted from the page into a redable format
 * @param {object} content content of page
 * @returns 
 */
    async generateContentHTML(content) {
        const author = content.author;
        const title = content.title;
        const post = content.postContent;


        let html = `<p class="fs-2">${title}</p>`;
        html += `<p class="fs-5 fw-bold">By: ${author}</p>`;
        html += `<p class="fs-6 ttsoc-read-more">${post}</p>`;

        return html;
    },

    /**
     * builds a final object, based on what the user has selected from the list of contents
     * @param {object} content content of the page
     * @param {array[string]} selectedContentIds list of the selected comments and replies by the user
     * @returns {object}
     */
    buildSelectedContent(content, selectedContentIds = []) {
        let ttsContent = {};

        if (content === undefined) {
            return;
        }

        // remove html elements from the post content
        const postContent = $('<div>').html(content['postContent']).text();

        ttsContent['postContent'] = postContent;
        ttsContent['title'] = content['title'];
        ttsContent['author'] = content['author'];

        return ttsContent;
    }
}

export default Yahooautos;