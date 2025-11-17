import path from 'node:path'
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
        '@tachui/modifiers': path.resolve(__dirname, './src'),
        '@tachui/modifiers/': path.resolve(__dirname, './src') + '/',
        '@tachui/modifiers/effects': path.resolve(
          __dirname,
          './src/effects/index.ts'
        ),
      },
    },
  })
)
