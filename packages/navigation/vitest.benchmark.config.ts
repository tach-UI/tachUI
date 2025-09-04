import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['benchmarks/**/*.bench.ts'],
    benchmark: {
      // Enable benchmark reporting
      reporters: ['default'],
    },
  },
  resolve: {
    alias: {
      '@tachui/core': path.resolve(
        __dirname,
        '../../packages/core/src/index.ts'
      ),
    },
  },
})
