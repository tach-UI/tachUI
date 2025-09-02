import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
    include: ['__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@tachui/core': resolve(__dirname, '../core/dist'),
      '@tachui/primitives': resolve(__dirname, '../primitives/dist'),
    },
  },
})
