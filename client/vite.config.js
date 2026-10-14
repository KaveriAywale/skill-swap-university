import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Public API URL the browser talks to. Overridable per environment.
const apiProxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';

// Keep dev and preview behaviour identical so the app works the same whether
// you run `npm run dev` or inspect a production build with `npm run preview`.
const proxy = {
  '/api': { target: apiProxyTarget, changeOrigin: true },
  '/uploads': { target: apiProxyTarget, changeOrigin: true },
  '/socket.io': {
    target: apiProxyTarget,
    changeOrigin: true,
    ws: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind all interfaces so both http://localhost:5173 and
    // http://127.0.0.1:5173 reach the dev server.
    host: true,
    port: 5173,
    proxy,
  },
  preview: {
    host: true,
    port: 4173,
    proxy,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
