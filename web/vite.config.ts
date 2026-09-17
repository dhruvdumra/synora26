import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Indexer API during local development; in production CloudFront routes /api/* to EC2.
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
    },
  },
})
