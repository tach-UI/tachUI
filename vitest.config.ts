import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from './vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      // Root-specific test patterns - discover all package tests
      include: [
        'packages/**/__tests__/**/*.test.ts',
        'packages/**/__tests__/**/*.test.tsx',
      ],

      // Remove CLI exclusion - include all packages for consistent totals
      exclude: [
        'node_modules/**',
        '**/node_modules/**',
        '**/packages/**/node_modules/**',
        'dist/**',
        'build/**',
        'benchmarks/**',
        '**/*.bench.ts',
        '**/*.spec.ts', // Playwright browser tests only
        'coverage/**',
      ],
    },

    // Root uses shared aliases - no overrides needed
  })
)
