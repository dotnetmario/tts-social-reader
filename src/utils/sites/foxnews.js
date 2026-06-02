import Utils from "../utils";

const Foxnews = {
    /**
     * returns an identifier name for the website, required in the Backend
     * @returns {string} site name
     */
    getName() {
        return 'foxnews';
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

        authors = $(htmlContent).find('div.author-byline').clone()
            .find('.article-source').remove().end().text();

        authors = authors.replace('By', '');

        return authors.trim();
    },

    async getPostTitle() {
        const htmlContent = await this.getHTML();

        return $(htmlContent).find('h1.headline').first().text().trim();
    },

    async getPostContent() {
        const htmlContent = await this.getHTML();
        const tab = await this.getTab();
        const resource = Utils.getUrlResource(tab.url);

        let paragraphs = '';

        if (resource !== 'live-news') {
            $(htmlContent).find('div.article-body')
                .find('p').each((idx, p) => {
                    let text = $(p).text();
                    paragraphs += `<p>${text}</p>`;
                });
        } else {
            let text = $(htmlContent).find('div.liveblog-content')
                .find('div.sidebar-content').first()
                .find('.title').text();

            let sidebarTitle = `<p>${text}</p>`;


            let sidebarText = '';
            $(htmlContent).find('div.liveblog-content')
                .find('div.sidebar-content').first()
                .find('div.content li').each((idx, li) => {
                    let text = $(li).text();
                    sidebarText += `<p>${text}</p>`;
                });

            let articles = '';
            $(htmlContent).find('div.main-content div.article-items article')
                .each((idx, art) => {
                    let title = $(art).find('.title').text();
                    articles += `<h2>${title}</h2>`;

                    $(art).find('div.article-item-content div.article-item-body p')
                        .each((idx2, p) => {
                            let text = $(p).text();
                            articles += `<p>${text}</p>`;
                        });
                });

            // combine the extracted content
            paragraphs = sidebarTitle + sidebarText + articles;
        }

        return paragraphs;
    },

    async getUrlResource() {
        const tab = await this.getTab();
        const url = new URL(tab.url);

        const resource = url.pathname.split('/').filter(Boolean)[0];

        return resource;
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

export default Foxnews;