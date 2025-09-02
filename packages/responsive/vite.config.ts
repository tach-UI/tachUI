import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TachUIResponsive',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@tachui/core'],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
        },
      },
    },
    sourcemap: true,
    minify: true,
  },
  resolve: {
    alias: {
      '@tachui/core': resolve(__dirname, '../core/src'),
    },
  },
})
