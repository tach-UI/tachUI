import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      // Package-specific test configuration
      setupFiles: ['./__tests__/setup.ts'],
    silent: true,    },
    onConsoleLog: () => false, // Suppress console.log output during tests
  })
)
