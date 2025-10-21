import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TachUIEffects',
      fileName: 'index',
      formats: ['es'],
    },
    emptyOutDir: false, // Don't clean the dist directory to preserve .d.ts files
    rollupOptions: {
      external: ['@tachui/core', '@tachui/registry'],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
          '@tachui/registry': 'TachUIRegistry',
        },
      },
    },
    sourcemap: mode !== 'production',
    target: 'es2020',
  },
  resolve: {
    alias: {
      '@tachui/core': resolve(__dirname, '../core/src'),
      '@tachui/modifiers': resolve(__dirname, '../modifiers/dist'),
      '@tachui/registry': resolve(__dirname, '../registry/dist'),
    },
  },
}))
