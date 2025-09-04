import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@tachui/core': resolve(__dirname, '../core/src'),
      '@tachui/modifiers': resolve(__dirname, '../modifiers/dist'),
    },
  },
  optimizeDeps: {
    include: ['@tachui/modifiers'],
  },
})
