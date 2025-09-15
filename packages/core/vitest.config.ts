import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    exclude: [
      'node_modules/**',
      '**/node_modules/**',
      '**/packages/**/node_modules/**',
      'dist/**',
      'build/**',
      'benchmarks/**',
      '**/*.bench.ts',
      '**/*.spec.ts', // Playwright browser tests
      'benchmarks/browser.spec.ts',
      'benchmarks/browser-quick.spec.ts',
      'coverage/**',
    ],
  },
  resolve: {
    alias: {
      '@tachui/core': resolve(__dirname, './src'),
      '@tachui/primitives': resolve(__dirname, '../primitives/dist'),
    },
  },
})
