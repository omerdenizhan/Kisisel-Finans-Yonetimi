import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Build çıktısı server tarafından statik olarak sunulacak.
// Dev'de Vite 5173'te çalışır, /api istekleri Express'e (3000) proxy'lenir.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, '../server/public'),
    emptyOutDir: true,
  },
});
