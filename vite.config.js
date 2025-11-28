import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                background: resolve(__dirname, 'src/background.js'),
                content: resolve(__dirname, 'src/content.js'),
                popup: resolve(__dirname, 'src/popup.js'),
                options: resolve(__dirname, 'src/options.js'),
                offscreen: resolve(__dirname, 'src/offscreen.js')
            },
            output: {
                entryFileNames: chunk => {
                    return ['background', 'content', 'popup', 'options', 'offscreen'].includes(chunk.name)
                        ? '[name].js'           // dist/popup.js
                        : 'assets/[name].js';   // dist/assets/background.js, etc.
                    // return chunk.name === 'popup' 
                    //     ? '[name].js'           // dist/popup.js
                    //     : 'assets/[name].js';   // dist/assets/background.js, etc.
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: assetInfo => {
                    // Group all CSS in one file named 'style.css'
                    if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                        return 'assets/all.css';
                    }
                    return 'assets/[name][extname]';
                }
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
    },
    publicDir: 'public',
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@utils': resolve(__dirname, './src/utils'),
            '@pages': resolve(__dirname, './public/pages'),
        },
    },
});