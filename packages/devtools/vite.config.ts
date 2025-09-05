import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'index.prod': resolve(__dirname, 'src/index.prod.ts'),
        inspector: resolve(__dirname, 'src/inspector/index.ts'),
        profiler: resolve(__dirname, 'src/profiler/index.ts'),
        debug: resolve(__dirname, 'src/debug/index.ts'),
        testing: resolve(__dirname, 'src/testing/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => {
        if (entryName === 'index') return 'index.js'
        if (entryName === 'index.prod') return 'index.prod.js'
        return `${entryName}/index.js`
      },
    },
    rollupOptions: {
      external: ['@tachui/core', '@tachui/primitives'],
    },
    sourcemap: true,
    minify: false, // Keep readable for debugging
  },
})
