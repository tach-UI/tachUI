import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'modifiers/index': resolve(__dirname, 'src/modifiers/index.ts'),
      },
      name: 'TachUIResponsive',
      formats: ['cjs']
    },
    emptyOutDir: false, // Don't clean the dist directory to preserve .d.ts files
    rollupOptions: {
      external: id =>
        id === '@tachui/core' ||
        id === '@tachui/registry' ||
        id.startsWith('@tachui/modifiers'),
      output: {
        entryFileNames: '[name].js',
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
