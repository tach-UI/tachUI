import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: '@tachui/grid',
      fileName: format => `index.${format === 'es' ? 'js' : format}`,
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@tachui/core'],
      output: {
        globals: {
          '@tachui/core': 'TachuiCore',
        },
      },
    },
    sourcemap: true,
    target: 'es2020',
    minify: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
