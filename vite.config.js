import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                background: resolve(__dirname, 'src/background.js'),
                content: resolve(__dirname, 'src/content.js'),
                popup: resolve(__dirname, 'src/popup.js'),
                options: resolve(__dirname, 'src/options.js')
            },
            output: {
                entryFileNames: chunk => {
                    return chunk.name === 'popup'
                        ? '[name].js'           // dist/popup.js
                        : 'assets/[name].js';   // dist/assets/background.js, etc.
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
})


// https://vitejs.dev/config/
// export default defineConfig({
//     plugins: [
//       react(),
//       tsconfigPaths(),
//       viteManifestHackIssue846,
//       crx({
//         manifest,
//         contentScripts: {
//           injectCss: true,
//         },
//       }),
//     ],
//     resolve: {
//       alias: {
//         '@': resolve(__dirname, './src'),
//         '@utils': resolve(__dirname, './src/utils'),
//         '@assets': resolve(__dirname, './src/assets'),
//       },
//     },
//   });