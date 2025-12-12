const Storage = {
    /**
     * retreive's content from local storage based on a key
     * returns undefined if it doesn't exist
     * @param {string} key 
     * @returns 
     */
    async getContent(key) {
        const data = await chrome.storage.local.get(key);

        return data[key] ?? undefined;
    },

    /**
     * store's data in local storage
     * @param {string} key 
     * @param {any} data 
     */
    async storeContent(key, data) {
        console.log('storing content: ', { [key]: data });
        await chrome.storage.local.set({ [key]: data });
    },

    /**
     * removes data freom local storage
     * @param {string} key 
     */
    async removeContent(key) {
        await chrome.storage.local.remove(key);
    },

    /**
     * appends new data to an existing entry in local storage
     * @param {string} key 
     * @param {string} newKey 
     * @param {any} newValue 
     * @returns {object}
     */
    async appendContent(key, newKey, newValue) {
        const existing = await this.getContent(key);

        // key does not exist
        if (existing === undefined) {
            // if nothing stored yet, initialize a new object
            const fresh = { [newKey]: newValue };
            await this.storeContent(key, fresh);
            return fresh;
        }

        // key does exist, only looks for objects to append to
        if (typeof existing === 'object' && existing !== null && !Array.isArray(existing)) {
            // clone to avoid mutating stored reference
            const updated = { ...existing, [newKey]: newValue };
            await this.storeContent(key, updated);
            return updated;
        }

        // if stored value was not an object, wrap into object and append
        const wrapped = { ...{}, original: existing, [newKey]: newValue };
        await this.storeContent(key, wrapped);
        return wrapped;
    }
}

export default Storage;