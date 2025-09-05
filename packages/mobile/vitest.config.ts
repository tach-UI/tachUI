import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      setupFiles: ['./__tests__/setup.ts'],
    },
    resolve: {
      alias: {
        '@tachui/mobile': './src',
      },
    },
  })
)
