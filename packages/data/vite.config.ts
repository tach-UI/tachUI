import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'list/index': resolve(__dirname, 'src/list/index.ts'),
        'menu/index': resolve(__dirname, 'src/menu/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: id =>
        id === '@tachui/core' ||
        id === '@tachui/core/reactive' ||
        id === '@tachui/core/reactive/types' ||
        id === '@tachui/core/runtime/types' ||
        id === '@tachui/core/modifiers/types' ||
        id === '@tachui/core/constants/layout' ||
        id === '@tachui/mobile' ||
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
