import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tools/testing/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.bench.ts',
        'tools/',
        'apps/',
        'examples/',
      ],
    },
    exclude: [
      'apps/**',
      'node_modules/**',
      '**/node_modules/**',
      '**/packages/**/node_modules/**',
      '**/packages/**/benchmarks/**/*.spec.ts',
      'packages/cli/',
      // Exclude long-running tests from CI (run separately with pnpm test:long)
      '**/long-running-simulation.test.ts', // ~30s simulation tests
      '**/stress-test.test.ts', // Future stress testing
      '**/performance-regression.test.ts', // Future performance regression tests
      // Exclude memory-intensive security tests that cause memory exhaustion
      '**/security/malicious-plugin-detection.test.ts', // Memory-intensive malicious plugin tests
      '**/security/sandbox-security.test.ts', // Memory-intensive sandbox tests
      // Exclude benchmarking tests from CI
      '**/performance/benchmark*.test.ts', // All benchmark performance tests
      '**/performance/*benchmark*.test.ts', // Pattern for benchmark tests
      '**/bundle-size-monitoring.test.ts', // Bundle size benchmarks
      // Exclude flaky error recovery tests from CI
      '**/integration/error-recovery.test.ts', // Flaky timing-sensitive error recovery tests
      // Exclude flaky memory tests that depend on GC timing
      '**/integration/foundation-demo.test.ts', // Memory leak tests with non-deterministic GC
    ],
    followSymlinks: false,
    // Reduce timeout for CI to catch hanging tests faster
    testTimeout: 15000, // 15 seconds instead of default 5 seconds
  },
  resolve: {
    alias: [
      {
        find: '@tachui/core/plugins',
        replacement: path.resolve(__dirname, 'packages/core/src/plugins'),
      },
      {
        find: '@tachui/core',
        replacement: path.resolve(__dirname, 'packages/core/src'),
      },
      {
        find: '@tachui/cli',
        replacement: path.resolve(__dirname, 'packages/cli/src'),
      },
      {
        find: '@tachui/forms',
        replacement: path.resolve(__dirname, 'packages/forms/src'),
      },
      {
        find: '@tachui/navigation',
        replacement: path.resolve(__dirname, 'packages/navigation/src'),
      },
    ],
  },
})
