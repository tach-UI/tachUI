import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TachUIMobilePatterns',
      formats: ['es'],
    },
    rollupOptions: {
      // Mark @tachui/core as external since it's a peer dependency
      external: ['@tachui/core'],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
        },
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
  },
  esbuild: {
    target: 'es2020',
  },
})
