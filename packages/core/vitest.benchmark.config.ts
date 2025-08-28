import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.bench.ts'],
    testTimeout: 120000,
  },
  esbuild: {
    target: 'node18',
  },
})
