import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxea /api al backend en desarrollo para evitar configurar CORS a mano en el navegador
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    allowedHosts: true,
  },
});
