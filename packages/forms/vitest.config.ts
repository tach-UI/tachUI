import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      // Package-specific test configuration
      setupFiles: ['./__tests__/setup.ts'],
    },

  })
)
