import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@tachui/core',
        '@tachui/core/reactive',
        '@tachui/core/reactive/types',
        '@tachui/core/runtime/types',
        '@tachui/core/runtime/context',
        '@tachui/core/runtime/component-context',
        '@tachui/core/runtime/dom-bridge',
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        globals: {
          '@tachui/core': 'TachUICore',
        },
      },
    },
    sourcemap: true,
    target: 'es2020',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
