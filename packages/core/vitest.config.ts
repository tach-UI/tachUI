import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../tools/testing/setup.ts'],

    // include removed (default pattern used)

    // Exclude benchmark and spec files by default
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

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'benchmarks/**',
        '**/*.bench.ts',
        '**/*.spec.ts',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/vitest.*.ts',
      ],
      // Quality gate thresholds
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    },

    // Reporter
    reporter: ['verbose'],

    // Timeout
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@tachui/core': './src',
    },
  },
})
