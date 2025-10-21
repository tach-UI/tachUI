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
      external: [
        '@tachui/core',
        '@tachui/core/reactive',
        '@tachui/core/reactive/types',
        '@tachui/core/runtime/types',
        '@tachui/core/modifiers/types',
        '@tachui/core/constants/layout',
        '@tachui/mobile',
      ],
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
