import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from './vitest.shared.config'

const stressPatterns = ['packages/**/__tests__/**/*stress*.test.ts']

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      include: stressPatterns,
      exclude: [
        'node_modules/**',
        '**/node_modules/**',
        '**/packages/**/node_modules/**',
        'dist/**',
        'build/**',
        'benchmarks/**',
        '**/*.bench.ts',
        '**/*.spec.ts',
        'coverage/**',
      ],
      testTimeout: 20000,
    },
  })
)
