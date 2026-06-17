import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  plugins: [react(),     
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: './images', dest: '.' },
      ],
    }),],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2017',
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: 'src/popup/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})