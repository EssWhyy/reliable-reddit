import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // Correctly stringify the node environment to fully strip it out of third-party libraries
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({ NODE_ENV: 'production' })
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2017',
    lib: {
      // FIXED: Case-sensitive path from your file structure tree: "ContentPost.tsx"
      entry: path.resolve(__dirname, 'src/content/ContentPost.tsx'),
      name: 'content', 
      formats: ['iife'],     
      fileName: () => 'src/content.js', 
    },
    rollupOptions: {
      output: {
        assetFileNames: 'src/[name][extname]',
      },
    },
  },
})