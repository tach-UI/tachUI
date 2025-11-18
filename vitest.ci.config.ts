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
      // Exclude real-world integration tests (5000ms+ each)
      '**/integration/real-world-auth.test.ts', // 8217ms - User authentication flow
      '**/integration/real-world-dashboard.test.ts', // 4838ms + 4243ms - Dashboard tests
      '**/integration/real-world-simple.test.ts', // 5051ms + 4960ms + 5550ms - Multiple flows
      '**/integration/real-world-*.test.ts', // All real-world integration tests
      // Exclude stress tests (2000ms+ each)
      '**/*stress.test.ts', // All stress tests including modifiers stress tests
      '**/elements/stress.test.ts', // 1486ms - Element stress tests
      '**/appearance/stress.test.ts', // Appearance stress tests
      '**/layout/overlay-stress.test.ts', // Overlay stress tests
      // Exclude long-running simulation tests (2000-4000ms each)
      '**/long-running-*.test.ts', // Long-running application simulations
      '**/simulation*.test.ts', // Application simulation tests
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
    // Essential for ES module resolution in TypeScript
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],

    alias: [
      // Core packages - use src for consistent testing with local environment
      {
        find: '@tachui/core/plugins',
        replacement: path.resolve(__dirname, 'packages/core/src/plugins'),
      },
      {
        find: '@tachui/core/minimal',
        replacement: path.resolve(__dirname, 'packages/core/src/bundles/minimal'),
      },
      {
        find: '@tachui/core/gradients',
        replacement: path.resolve(__dirname, 'packages/core/src/gradients'),
      },
      {
        find: '@tachui/core/assets',
        replacement: path.resolve(__dirname, 'packages/core/src/assets'),
      },
      {
        find: '@tachui/core',
        replacement: path.resolve(__dirname, 'packages/core/src'),
      },
      {
        find: '@tachui/primitives',
        replacement: path.resolve(__dirname, 'packages/primitives/src'),
      },
      {
        find: '@tachui/devtools',
        replacement: path.resolve(__dirname, 'packages/devtools/src'),
      },
      {
        find: '@tachui/registry',
        replacement: path.resolve(__dirname, 'packages/registry/src'),
      },

      // Plugin packages
      {
        find: '@tachui/forms',
        replacement: path.resolve(__dirname, 'packages/forms/src'),
      },
      {
        find: '@tachui/navigation',
        replacement: path.resolve(__dirname, 'packages/navigation/src'),
      },
      {
        find: '@tachui/mobile',
        replacement: path.resolve(__dirname, 'packages/mobile/src'),
      },
      {
        find: '@tachui/symbols',
        replacement: path.resolve(__dirname, 'packages/symbols/src'),
      },
      {
        find: '@tachui/data',
        replacement: path.resolve(__dirname, 'packages/data/src'),
      },
      {
        find: '@tachui/grid',
        replacement: path.resolve(__dirname, 'packages/grid/src'),
      },
      {
        find: '@tachui/responsive',
        replacement: path.resolve(__dirname, 'packages/responsive/src'),
      },
      {
        find: '@tachui/viewport',
        replacement: path.resolve(__dirname, 'packages/viewport/src'),
      },
      {
        find: '@tachui/modifiers',
        replacement: path.resolve(__dirname, 'packages/modifiers/src'), // Effects merged into modifiers
      },
      {
        find: '@tachui/flow-control',
        replacement: path.resolve(__dirname, 'packages/flow-control/src'),
      },
      {
        find: '@tachui/cli',
        replacement: path.resolve(__dirname, 'packages/cli/src'),
      },
    ],
  },
})
