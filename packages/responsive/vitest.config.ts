import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@tachui/core': resolve(__dirname, '../core/src'),
    },
  },
})
