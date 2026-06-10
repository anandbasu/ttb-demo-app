import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, '..', 'dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/api':     { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
