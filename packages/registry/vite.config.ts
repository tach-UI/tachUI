import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TachUIRegistry',
      fileName: 'index',
      formats: ['es']
    },
    sourcemap: mode !== 'production',
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
}))