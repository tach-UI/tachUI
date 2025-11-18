import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      setupFiles: ['__tests__/setup.ts'],
      include: ['__tests__/**/*.test.ts'],
      silent: true,
    },
    onConsoleLog: () => false,
    resolve: {
      alias: {
        '@tachui/devtools': './src',
      },
    },
  })
)
