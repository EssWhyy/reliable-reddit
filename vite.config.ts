import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: './', // 👈 critical for extensions to use relative asset paths
  build: {
    outDir: 'dist',
    emptyOutDir: false, // keep other built files (like background/content)
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, 'src/contentReact.tsx'),
        popup: path.resolve(__dirname, 'src/popup/index.html'), // 👈 added popup entry
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})