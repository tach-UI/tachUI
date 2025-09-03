import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@tachui/core/modifiers/base': path.resolve(
        __dirname,
        '__tests__/mocks/base.ts'
      ),
      '@tachui/core/modifiers/types': path.resolve(
        __dirname,
        '__tests__/mocks/types.ts'
      ),
      '@tachui/core/runtime/types': path.resolve(
        __dirname,
        '__tests__/mocks/runtime-types.ts'
      ),
    },
  },
})
