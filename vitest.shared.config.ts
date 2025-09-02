import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Shared Vitest Configuration for TachUI Packages
 *
 * This configuration provides:
 * - Proper ES module resolution with extensions
 * - Alias mapping for all @tachui packages to built dist directories
 * - Consistent test environment setup
 * - Standard coverage configuration
 *
 * Usage in package vitest.config.ts:
 * ```ts
 * import { defineConfig, mergeConfig } from 'vitest/config'
 * import sharedConfig from '../../vitest.shared.config'
 *
 * export default mergeConfig(sharedConfig, defineConfig({
 *   // Package-specific overrides
 * }))
 * ```
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../tools/testing/setup.ts'],

    // Standard exclusions
    exclude: [
      'node_modules/**',
      '**/node_modules/**',
      '**/packages/**/node_modules/**',
      'dist/**',
      'build/**',
      'benchmarks/**',
      '**/*.bench.ts',
      '**/*.spec.ts', // Playwright browser tests
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

    // Timeout
    testTimeout: 10000,

    followSymlinks: false,
  },

  resolve: {
    // Essential for ES module resolution in TypeScript
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],

    alias: [
      // Core packages - point to built dist for proper type resolution
      {
        find: '@tachui/core/plugins',
        replacement: path.resolve(__dirname, 'packages/core/dist/plugins'),
      },
      {
        find: '@tachui/core',
        replacement: path.resolve(__dirname, 'packages/core/dist'),
      },
      {
        find: '@tachui/primitives',
        replacement: path.resolve(__dirname, 'packages/primitives/dist'),
      },
      {
        find: '@tachui/devtools',
        replacement: path.resolve(__dirname, 'packages/devtools/dist'),
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
        replacement: path.resolve(__dirname, 'packages/modifiers/src'),
      },
      {
        find: '@tachui/flow-control',
        replacement: path.resolve(__dirname, 'packages/flow-control/src'),
      },
    ],
  },
})
