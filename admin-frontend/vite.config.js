import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'node:path';
// Stand-alone admin SPA. The mini-program lives in `frontend/`; this is a
// separate Vite project so we can pull in Element Plus + dev tooling
// without bloating the wechat package.
export default defineConfig({
    server: {
        port: 5174,
        proxy: {
            // The Spring backend lives on :8080 in dev; same-origin /api keeps
            // CORS off the table when we're working locally.
            '/api': {
                target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
                changeOrigin: true,
            },
            '/auth': {
                target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    plugins: [
        vue(),
        AutoImport({ resolvers: [ElementPlusResolver()] }),
        Components({ resolvers: [ElementPlusResolver()] }),
    ],
});
