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
      {
        find: /^@tachui\/types\/(.*)$/,
        replacement: resolve(__dirname, '../types/src/$1.ts'),
      },
      {
        find: '@tachui/types',
        replacement: resolve(__dirname, '../types/src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
