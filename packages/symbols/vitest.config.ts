import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    logLevel: 'silent',
    test: {
      setupFiles: ['./__tests__/setup.ts'],
      silent: true,
    },
    onConsoleLog: () => false,
    resolve: {
      alias: {
        '@tachui/symbols': './src',
      },
    },
  })
)
