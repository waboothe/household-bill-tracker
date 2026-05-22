import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `server.proxy` lets the dev server (5173) forward /api/* to the
// FastAPI container (8000) without CORS gymnastics. In production
// nginx does the same thing inside the bill-tracker image.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
