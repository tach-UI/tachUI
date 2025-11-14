import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      // Use enhanced setup with better mocks
      setupFiles: ['./__tests__/setup-enhanced.ts'],
      // Mark as isolated test environment
      env: {
        TEST_ISOLATION: 'true',
      },
    },
    resolve: {
      alias: {
        // Self-reference for imports
        '@tachui/modifiers': './src',
        '@tachui/modifiers/effects': './src/effects/index.ts',
      },
    },
  })
)
