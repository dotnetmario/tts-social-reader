const Storage = {
    async getContent(key) {
        const data = await chrome.storage.local.get(key);

        return data[key] ?? undefined;
    },

    async storeContent(key, data) {
        await chrome.storage.local.set({ [key]: data });
    },

    async removeContent(key) {
        await chrome.storage.local.remove(key);
    },

    /**
     * 
     * @param {string} key 
     * @param {string} newKey 
     * @param {any} newValue 
     * @returns {object}
     */
    async appendContent(key, newKey, newValue) {
        const existing = await this.getContent(key);

        if (existing === undefined) {
            // If nothing stored yet, initialize a new object
            const fresh = { [newKey]: newValue };
            await this.storeContent(key, fresh);
            return fresh;
        }

        if (typeof existing === 'object' && existing !== null && !Array.isArray(existing)) {
            // Clone to avoid mutating stored reference
            const updated = { ...existing, [newKey]: newValue };
            await this.storeContent(key, updated);
            return updated;
        }

        // If stored value was not an object, wrap into object and append
        const wrapped = { ...{}, original: existing, [newKey]: newValue };
        await this.storeContent(key, wrapped);
        return wrapped;
    }
}

export default Storage;