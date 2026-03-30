import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from './vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      include: ['tools/__tests__/**/*.test.ts'],
      environment: 'node',
      exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
    },
  })
)
