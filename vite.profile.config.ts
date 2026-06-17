import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  define: { 
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({ NODE_ENV: 'production' })
  },
  build: {
    emptyOutDir: false, 
    outDir: 'dist',
    lib: {
      // FIXED: Case-sensitive path matching your file structure tree: "ContentProfile.tsx"
      entry: path.resolve(__dirname, 'src/content/ContentProfile.tsx'),
      formats: ['iife'],
      name: 'ContentProfile',
      fileName: () => 'src/contentProfile.js',
    },
  },
})