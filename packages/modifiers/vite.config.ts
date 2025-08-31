import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TachUIModifiers',
      fileName: 'index',
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
      ],
      output: {
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
