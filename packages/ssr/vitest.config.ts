import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@tachui/core/reactive',
        replacement: resolve(__dirname, '../core/src/reactive/index.ts'),
      },
      {
        find: '@tachui/core',
        replacement: resolve(__dirname, '../core/src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
