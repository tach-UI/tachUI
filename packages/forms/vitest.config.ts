import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
  },
  resolve: {
    alias: {
      '@tachui/core': path.resolve(__dirname, '../core/src'),
    },
  },
})
