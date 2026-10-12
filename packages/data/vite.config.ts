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
        // Hashed: Rolldown names a shared chunk after a module, and a bare
        // `list.js` beside `list/` is what `./list` resolves to, hiding
        // `list/index.d.ts` from TypeScript.
        chunkFileNames: '[name]-[hash].js',
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
