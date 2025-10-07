import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // 👇 define process.env as an empty object to prevent ReferenceError
    'process.env': {},
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2017',
    lib: {
      entry: path.resolve(__dirname, 'src/contentReact.tsx'),
      name: 'content', 
      formats: ['iife'],     
      fileName: () => 'content.js', 
    },
  },
})
