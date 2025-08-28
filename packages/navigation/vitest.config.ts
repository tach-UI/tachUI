import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['../../tools/testing/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/benchmarks/**/*.spec.ts', // Exclude Playwright benchmark tests
    ],
  },
  resolve: {
    alias: {
      '@tachui/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
})
