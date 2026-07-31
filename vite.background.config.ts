import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  base: './',
  define: {
    'process.env': {},
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2017',
    lib: {
      entry: path.resolve(__dirname, 'src/background/background.ts'),
      name: 'background',
      formats: ['iife'],
      fileName: () => 'src/background/background.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'src/[name][extname]',
      },
    },
  },
})