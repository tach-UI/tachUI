import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        // Advertised by the manifest; nothing built it until now.
        'modifiers/index': resolve(__dirname, 'src/modifiers/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: id =>
        id === '@tachui/core' ||
        id === '@tachui/core/reactive' ||
        id === '@tachui/core/reactive/types' ||
        id === '@tachui/core/runtime/types' ||
        id === '@tachui/core/runtime/context' ||
        id === '@tachui/core/runtime/component-context' ||
        id === '@tachui/core/runtime/dom-bridge' ||
        id.startsWith('@tachui/modifiers'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        globals: {
          '@tachui/core': 'TachUICore',
        },
      },
    },
    sourcemap: mode !== 'production',
    target: 'es2020',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}))
