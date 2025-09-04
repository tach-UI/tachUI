import { defineConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

export default defineConfig({
  ...sharedConfig,
  test: {
    ...sharedConfig.test,
    setupFiles: ['./__tests__/setup.ts'],
    logLevel: 'silent',
  },
  resolve: {
    ...sharedConfig.resolve,
    alias: {
      ...sharedConfig.resolve?.alias,
      '@tachui/symbols': './src',
    },
  },
})
