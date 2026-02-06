import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5900,
    proxy: {
      '/api': {
        target: 'http://localhost:3900',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist/client',
  },
  appType: 'spa',
});
