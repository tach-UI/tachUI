import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'components/index': resolve(__dirname, 'src/components/index.ts'),
        'validation/index': resolve(__dirname, 'src/validation/index.ts'),
        'state/index': resolve(__dirname, 'src/state/index.ts'),
      },
      name: 'TachUIForms',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@tachui/core', '@tachui/core/validation'],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
        },
        exports: 'named',
        manualChunks: undefined,
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['../core/test/setup.ts'],
  },
})
