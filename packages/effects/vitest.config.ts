import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    resolve: {
      alias: {
        // Self-reference for imports
        '@tachui/effects': './src',
      },
    },
    optimizeDeps: {
      include: ['@tachui/modifiers'],
    },
  })
)
