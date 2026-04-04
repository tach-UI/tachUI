import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@tachui\/core\/modifiers\/base$/,
        replacement: resolve(__dirname, '../core/src/modifiers/base.ts'),
      },
      {
        find: /^@tachui\/core\/modifiers$/,
        replacement: resolve(__dirname, '../core/src/modifiers/index.ts'),
      },
      {
        find: /^@tachui\/core\/reactive$/,
        replacement: resolve(__dirname, '../core/src/reactive/index.ts'),
      },
      {
        find: /^@tachui\/core$/,
        replacement: resolve(__dirname, '../core/src/index.ts'),
      },
      {
        find: /^@tachui\/core\/(.*)$/,
        replacement: resolve(__dirname, '../core/src/$1.ts'),
      },
      {
        find: /^@tachui\/ssr$/,
        replacement: resolve(__dirname, '../ssr/src/index.ts'),
      },
      {
        find: /^@tachui\/ssr\/(.*)$/,
        replacement: resolve(__dirname, '../ssr/src/$1.ts'),
      },
      {
        find: /^@tachui\/types$/,
        replacement: resolve(__dirname, '../types/src/index.ts'),
      },
      {
        find: /^@tachui\/types\/(.*)$/,
        replacement: resolve(__dirname, '../types/src/$1.ts'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
