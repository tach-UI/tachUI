import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@tachui/grid',
      fileName: format => `index.${format === 'es' ? 'js' : format}`,
      formats: ['es'],
    },
    emptyOutDir: false, // Don't clean the dist directory to preserve .d.ts files
    rollupOptions: {
      external: ['@tachui/core', '@tachui/modifiers', '@tachui/responsive'],
      output: {
        globals: {
          '@tachui/core': 'TachuiCore',
          '@tachui/modifiers': 'TachuiModifiers',
          '@tachui/responsive': 'TachuiResponsive',
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
