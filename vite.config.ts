import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração do Vite restaurada — plugins válidos, sem imports inválidos.
// Preview em http://127.0.0.1:8080
export default defineConfig({
  // base relativa: funciona em qualquer hospedagem estática local
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: '127.0.0.1',
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 8080,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});