import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: 'src/contentReact.tsx'
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
});
