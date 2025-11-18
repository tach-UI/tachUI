import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TachUIResponsive',
      fileName: 'index',
      formats: ['cjs']
    },
    emptyOutDir: false, // Don't clean the dist directory to preserve .d.ts files
    rollupOptions: {
      external: id =>
        id === '@tachui/core' ||
        id === '@tachui/registry' ||
        id.startsWith('@tachui/modifiers'),
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
          '@tachui/modifiers': 'TachUIModifiers',
          '@tachui/registry': 'TachUIRegistry'
        }
      }
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
