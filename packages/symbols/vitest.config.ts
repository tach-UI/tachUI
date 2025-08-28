import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    // Suppress stderr output for cleaner test results
    silent: false,
    reporter: 'verbose',
    // Completely silent for errors to prevent stderr
    logLevel: 'silent',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        'dist/',
        '*.config.*',
      ],
    },
  },
})