import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      // Package-specific test configuration
      setupFiles: ['../../tools/testing/setup.ts'],
    },

    resolve: {
      alias: {
        // Package-specific aliases
        '@tachui/forms': './src',
      },
    },
  })
)
