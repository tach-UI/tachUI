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
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['@tachui/core', '@tachui/core/validation'],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
        },
        exports: 'named',
        manualChunks: {
          // Core form utilities - most likely to be used
          'forms-core': ['./src/state/index.ts', './src/validation/index.ts'],
          // Basic input components - commonly used
          'forms-inputs': [
            './src/components/input/TextField.ts',
            './src/components/input/Checkbox.ts',
            './src/components/input/Radio.ts',
          ],
          // Complex components - loaded on demand
          'forms-complex': ['./src/components/input/Select.ts'],
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['../core/test/setup.ts'],
  },
})
