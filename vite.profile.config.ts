import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    emptyOutDir: false, // Prevents deleting the 'post' build
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/content/ContentProfile.tsx'),
      formats: ['iife'],
      name: 'ContentProfile',
      fileName: () => 'src/contentProfile.js',
    },
  },
})