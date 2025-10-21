import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TachUIResponsive',
      fileName: 'index',
      formats: ['es'],
    },
    emptyOutDir: false, // Don't clean the dist directory to preserve .d.ts files
    rollupOptions: {
      external: ['@tachui/core', '@tachui/modifiers', '@tachui/registry'],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
          '@tachui/modifiers': 'TachUIModifiers',
          '@tachui/registry': 'TachuiRegistry',
        },
      },
    },
    sourcemap: mode !== 'production',
    minify: true,
  },
  resolve: {
    alias: {
      '@tachui/core': resolve(__dirname, '../core/src'),
    },
  },
}))
