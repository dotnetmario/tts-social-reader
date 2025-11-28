import View from "./view";
import Utils from "./utils";

const Reddit = {
    async getTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        return tab;
    },

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

    async cleanText(el) {
        return el?.innerText?.trim() || "";
    },

    async getPostTitle() {
        const htmlContent = await this.getHTML();

        return $(htmlContent).find('h1[id*="post-title"]').first().text().trim();
    },

    async getPostAuthor() {
        const htmlContent = await this.getHTML();

        return $(htmlContent).find('shreddit-post').first().attr('author').trim();
    },

    async getPostKarma() {
        const htmlContent = await this.getHTML();
        const karma = $(htmlContent).find('shreddit-post').first().attr('score');

        return Utils.formatHumanNumbers(karma);
        // return $(htmlContent).find('shreddit-post').first().find(`faceplate-number[number="${karma}"]`).first().text().trim();
    },

    async getPostContent() {
        const htmlContent = await this.getHTML();

        return $(htmlContent).find('div[id*="post-rtjson-content"]').first().text().trim();
    },

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

    async getPageContent() {
        return {
            author: await this.getPostAuthor(),
            title: await this.getPostTitle(),
            karma: await this.getPostKarma(),
            postContent: await this.getPostContent(),
            comments: await this.getTopComments()
        };
    },

    async generateContentHTML(content) {
        const author = content.author;
        const post = content.postContent;
        const title = content.title;
        const karma = content.karma;
        const comments = content.comments;

        let html = `<p class="fs-2">${title}</p>`;
        html += `<p class="fs-5">${author} <span class="badge bg-danger">${karma}</span></p>`;
        html += `<p class="fs-6 ttsoc-read-more" data-text-content="${Utils.encodeTextContent(post)}">${Utils.sliceText(post)}</p>`;
        html += `<div id="cardAccordion" class="accordion">`;

        comments.forEach((comment, idx) => {
            // const isCheckedComment = Math.random() > 0.4 ? 'checked="checked"' : ''; // for testing
            html += `<div class="card shadow-lg">
                        <div class="card-header" id="heading-${idx}" data-bs-toggle="collapse" 
                            data-bs-target="#collapse-${idx}" aria-expanded="false" aria-controls="collapse-${idx}" role="button"
                        >
                            <input type="checkbox" id="${comment._id}" class="form-check-input form-check-success form-check-glow ttsoc-send-content">
                            <p class="fs-5">${comment.author} <span class="badge bg-danger">${comment.karma}</span></p>
                            <span class="collapsed collapse-title fs-6 ttsoc-read-more" data-text-content="${Utils.encodeTextContent(comment.text)}">${Utils.sliceText(comment.text)}</span>
                        </div>
                        <div id="collapse-${idx}" class="collapse pt-1" aria-labelledby="heading-${idx}" data-parent="#cardAccordion">
                            <div class="card-body">`;

            const replies = comment.replies;
            replies.forEach((replie, idx2) => {
                // const isCheckedReply = Math.random() > 0.4 ? 'checked="checked"' : ''; // for testing
                html += `       <div class="divider">
                                    <div class="divider-text">
                                        <input type="checkbox" id="${replie._id}" class="form-check-input form-check-success form-check-glow ttsoc-send-content">
                                        <p class="fs-5">${replie.author} <span class="badge bg-danger">${replie.karma}</span></p>
                                    </div>
                                </div>
                                <p class="fs-6 ttsoc-read-more" data-text-content="${Utils.encodeTextContent(replie.text)}">${Utils.sliceText(replie.text)}</p>`;

            });

            html += `       </div>
                        </div>
                    </div>`;
        });

        html += `</div>`;

        return html;
    },


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