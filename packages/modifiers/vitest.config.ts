import path from 'node:path'
import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      setupFiles: ['./__tests__/setup-enhanced.ts'],
      silent: true,
    },
    env: {
      TEST_ISOLATION: 'true',
    },
    onConsoleLog: () => false,
    resolve: {
      alias: {
        '@tachui/modifiers': path.resolve(__dirname, './src'),
        '@tachui/modifiers/': `${path.resolve(__dirname, './src')}/`,
        '@tachui/modifiers/effects': path.resolve(
          __dirname,
          './src/effects/index.ts'
        ),
      },
    },
  })
)
