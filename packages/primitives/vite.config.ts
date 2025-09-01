import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        // Main entry point
        index: resolve(__dirname, 'src/index.ts'),
        // Category exports for tree-shaking
        'layout/index': resolve(__dirname, 'src/layout/index.ts'),
        'display/index': resolve(__dirname, 'src/display/index.ts'),
        'controls/index': resolve(__dirname, 'src/controls/index.ts'),
        'forms/index': resolve(__dirname, 'src/forms/index.ts'),
      },
      name: 'TachUIPrimitives',
      formats: ['es'],
    },
    rollupOptions: {
      // External dependencies (not bundled)
      external: id => {
        // Always externalize TypeScript
        if (id === 'typescript' || id.includes('typescript')) {
          return true
        }
        // Externalize @tachui packages to avoid circular dependencies
        if (id.startsWith('@tachui/')) {
          return true
        }
        return false
      },
      output: {
        exports: 'named',
        preserveModules: false,
        manualChunks: undefined,
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
  },
  esbuild: {
    target: 'es2020',
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
