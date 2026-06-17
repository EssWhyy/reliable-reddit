import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({ NODE_ENV: 'production' }),
    // Transformers.js needs this to understand it's running in an isolated environment
    'globalThis.document': 'undefined' 
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, 
    target: 'es2022',   
    lib: {
      entry: path.resolve(__dirname, 'src/background/huggingFaceSentiment.ts'),
      formats: ['es'],  
      fileName: () => 'src/background/huggingFaceSentiment.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true, 
      }
    }
  },
})