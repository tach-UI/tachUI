import { defineConfig, mergeConfig } from 'vitest/config'
import { resolve } from 'path'
import sharedConfig from '../../vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
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
)
