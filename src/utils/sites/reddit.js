import Utils from "../utils";

const Reddit = {
    /**
     * returns an identifier name for the website, required in the Backend
     * @returns {string} site name
     */
    getName() {
        return 'reddit';
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

    /**
     * returns a clean trimmed element inner text 
     * @param {documentElement} el 
     * @returns {string}
     */
    async cleanText(el) {
        return el?.innerText?.trim() || "";
    },

    /**
     * retunrs the post title
     * @returns {string}
     */
    async getPostTitle() {
        const htmlContent = await this.getHTML();

        return $(htmlContent).find('h1[id*="post-title"]').first().text().trim();
    },

    /**
     * retunrs the post author
     * @returns {string}
     */
    async getPostAuthor() {
        const htmlContent = await this.getHTML();

        return $(htmlContent).find('shreddit-post').first().attr('author').trim();
    },

    /**
     * retunrs the post karma
     * @returns {string}
     */
    async getPostKarma() {
        const htmlContent = await this.getHTML();
        const karma = $(htmlContent).find('shreddit-post').first().attr('score');

        return Utils.formatHumanNumbers(karma);
        // return $(htmlContent).find('shreddit-post').first().find(`faceplate-number[number="${karma}"]`).first().text().trim();
    },

    /**
     * retunrs the post content
     * @returns {string}
     */
    async getPostContent() {
        const htmlContent = await this.getHTML();

        return $(htmlContent).find('div[id*="post-rtjson-content"]').first().text().trim();
    },

    /**
     * returns a list of top comments for the post with their replies,
     * note that not all post's comments are processed, only the ones visible to the user (loded in the page)
     * ignores comments made by moderators, cuz they're gay
     * 
     * @param {int} max max number of comments to be processed, -1 to return all the comments
     * @returns {array} comments and replies
     */
    async getTopComments(max = -1) {
        const htmlContent = await this.getHTML();
        const commentsBlocks = $(htmlContent).find('shreddit-comment[depth="0"]');
        let commentsAndReplies = [];
        let i = 0;
        // loop the comments
        commentsBlocks.each((idx, comment) => {
            // condition for amount of extracted comments
            if (max !== -1 && i >= max) {
                return false;
            }
            // check if comment comming from a moderator
            const isModerator = $(comment).find('shreddit-comment-badges[distinguished-as="MODERATOR"]').length ? true : false;
            const author = $(comment).attr('author');
            const karma = $(comment).find('shreddit-comment-action-row').first().attr('score');
            const text = $(comment).find('div[id*="comment-rtjson-content"]').first().text().trim();

            // ignore moderator comments
            if (isModerator === true) {
                return;
            }

            // build comments + replies object
            commentsAndReplies[i] = {
                '_id': `comment-${i}`,
                'author': author,
                'karma': Utils.formatHumanNumbers(karma),
                'text': text,
                'replies': []
            };

            const replies = $(comment).find('shreddit-comment');
            // loop the replies
            replies.each((idx2, replie) => {
                const replieAuthor = $(replie).attr('author');
                const replieKarma = $(replie).find('shreddit-comment-action-row').first().attr('score');
                const replieText = $(replie).find('div[id*="comment-rtjson-content"]').first().text().trim();

                commentsAndReplies[i]['replies'][idx2] = {
                    '_id': `comment-${i}-replie-${idx2}`,
                    'author': replieAuthor,
                    'karma': Utils.formatHumanNumbers(replieKarma),
                    'text': replieText,
                };
            });

            i++;
        });

        return commentsAndReplies;
    },

    /**
     * returns an object containing all of the page contents
     * @returns {object} page content
     */
    async getPageContent() {
        return {
            author: await this.getPostAuthor(),
            title: await this.getPostTitle(),
            karma: await this.getPostKarma(),
            postContent: await this.getPostContent(),
            comments: await this.getTopComments()
        };
    },

    /**
     * displays the content extracted from the page into a redable format
     * @param {object} content content of page
     * @returns 
     */
    async generateContentHTML(content) {
        const author = content.author;
        const post = content.postContent;
        const title = content.title;
        const karma = content.karma;
        const comments = content.comments;

        const splitPost = Utils.splitText(post);

        let html = `<h2 class="fs-2 fw-bold">${title}</h2>`;
        html += `<h3 class="fs-5 fw-bold text-secondary d-inline">
                    <i class="bi bi-reddit text-danger"></i>
                    ${author} 
                </h3>
                <span class="badge bg-danger fs-6 align-top" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="top" data-bs-title="<p class='text-light align-middle fs-6 fw-bold'>Karma</p>">${karma}</span>`;
        html += `<hr>`;
        html += `<p class="text-start fs-4">${Utils.breaklineText(splitPost['firstPart'])}`;
        if (splitPost['secondPart'].toString().length > 0) {
            html += `<button class="btn-dna2 btn-primary-dna bg-warning fs-6 text-dark mx-4 ttsoc-read-more">Read More</button>`
        }
        html += `</p>`;
        html += `<p class="text-start fs-4 ttsoc-extra-content d-none">${Utils.breaklineText(splitPost['secondPart'])}</p>`;
        html += `<div class="row mb-4">`;

        comments.forEach((comment, idx) => {
            html += `<div class="card card-custom mb-3 ttsoc-send-content-comment" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="top" data-bs-title="<p class='text-light align-middle fs-6 fw-bold'>Click to select comment</p>">
                        <div class="card-body">
                            <h3 class="card-title fs-2 fw-bold">
                                <input class="form-check-input ttsoc-send-content d-none" type="checkbox" id="${comment._id}">
                                <i class="bi bi-reddit text-danger"></i>
                                ${comment.author} <span class="badge bg-danger" alt="Karma">${comment.karma}</span>
                            </h3>
                            <p class="ttsoc-extra-content text-start">${Utils.breaklineText(comment.text, 1)}</p>
                        </div>
                    </div>`;
        });

        html += `</div>`;


        return html;
    },
    // async generateContentHTML(content) {
    //     const author = content.author;
    //     const post = content.postContent;
    //     const title = content.title;
    //     const karma = content.karma;
    //     const comments = content.comments;

    //     let html = `<p class="fs-2">${title}</p>`;
    //     html += `<p class="fs-5">${author} <span class="badge bg-danger">${karma}</span></p>`;
    //     html += `<p class="fs-6 ttsoc-read-more" data-text-content="${Utils.encodeTextContent(post)}">${Utils.sliceText(post)}</p>`;
    //     html += `<div id="cardAccordion" class="accordion">`;

    //     comments.forEach((comment, idx) => {
    //         // const isCheckedComment = Math.random() > 0.4 ? 'checked="checked"' : ''; // for testing
    //         html += `<div class="card shadow-lg">
    //                     <div class="card-header" id="heading-${idx}" data-bs-toggle="collapse" 
    //                         data-bs-target="#collapse-${idx}" aria-expanded="false" aria-controls="collapse-${idx}" role="button"
    //                     >
    //                         <input type="checkbox" id="${comment._id}" class="form-check-input form-check-success form-check-glow ttsoc-send-content">
    //                         <p class="fs-5">${comment.author} <span class="badge bg-danger">${comment.karma}</span></p>
    //                         <span class="collapsed collapse-title fs-6 ttsoc-read-more" data-text-content="${Utils.encodeTextContent(comment.text)}">${Utils.sliceText(comment.text)}</span>
    //                     </div>
    //                     <div id="collapse-${idx}" class="collapse pt-1" aria-labelledby="heading-${idx}" data-parent="#cardAccordion">
    //                         <div class="card-body">`;

    //         const replies = comment.replies;
    //         replies.forEach((replie, idx2) => {
    //             // const isCheckedReply = Math.random() > 0.4 ? 'checked="checked"' : ''; // for testing
    //             html += `       <div class="divider">
    //                                 <div class="divider-text">
    //                                     <input type="checkbox" id="${replie._id}" class="form-check-input form-check-success form-check-glow ttsoc-send-content">
    //                                     <p class="fs-5">${replie.author} <span class="badge bg-danger">${replie.karma}</span></p>
    //                                 </div>
    //                             </div>
    //                             <p class="fs-6 ttsoc-read-more" data-text-content="${Utils.encodeTextContent(replie.text)}">${Utils.sliceText(replie.text)}</p>`;

    //         });

    //         html += `       </div>
    //                     </div>
    //                 </div>`;
    //     });

    //     html += `</div>`;

    //     return html;
    // },


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

        ttsContent['title'] = content['title'];
        ttsContent['postContent'] = content['postContent'];
        ttsContent['karma'] = content['karma'];

        content.comments.forEach((comment) => {
            const cid = comment._id;

            // comment not selected
            if (!selectedContentIds.includes(cid)) {
                return;
            }
            const cmt = { ...comment };
            delete cmt.replies;

            if (Array.isArray(comment.replies)) {
                comment.replies.forEach((reply) => {
                    const rid = reply._id;
                    if (selectedContentIds.includes(rid)) {
                        (cmt.replies ??= []).push(reply);
                    }
                });
            }

            (ttsContent.comments ??= []).push(cmt);
        });

        return ttsContent;
    }
}


export default Reddit;