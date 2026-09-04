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
        find: /^@tachui\/core\/runtime$/,
        replacement: resolve(__dirname, '../core/src/runtime/index.ts'),
      },
      {
        find: /^@tachui\/core\/assets$/,
        replacement: resolve(__dirname, '../core/src/assets/index.ts'),
      },
      {
        find: /^@tachui\/core\/gradients$/,
        replacement: resolve(__dirname, '../core/src/gradients/index.ts'),
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
        find: /^@tachui\/types\/(.*)$/,
        replacement: resolve(__dirname, '../types/src/$1.ts'),
      },
      {
        find: /^@tachui\/types$/,
        replacement: resolve(__dirname, '../types/src/index.ts'),
      },
      {
        find: /^@tachui\/modifiers\/animation$/,
        replacement: resolve(__dirname, '../modifiers/src/animation/index.ts'),
      },
      {
        find: /^@tachui\/modifiers\/(.*)$/,
        replacement: resolve(__dirname, '../modifiers/src/$1.ts'),
      },
      {
        find: /^@tachui\/modifiers$/,
        replacement: resolve(__dirname, '../modifiers/src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
