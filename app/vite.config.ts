import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Caminhos relativos para o build abrir via file:// dentro do Electron
  base: './',
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000,
    host: true
  }
});
