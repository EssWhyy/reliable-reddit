import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // prevent ReferenceError
    'process.env': {},
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2017',
    lib: {
      entry: path.resolve(__dirname, 'src/content/contentReact.tsx'),
      name: 'content', 
      formats: ['iife'],     
      fileName: () => 'src/content.js', 
    },
    rollupOptions: {
      output: {
        // 👇 This ensures all assets (CSS, etc.) go into dist/src/
        assetFileNames: 'src/[name][extname]',
      },
    },
  },
  
})
