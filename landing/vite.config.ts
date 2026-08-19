import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/deplao-builder/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

