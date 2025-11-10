import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    exclude: [
      'node_modules/**',
      '**/node_modules/**',
      '**/packages/**/node_modules/**',
      'dist/**',
      'build/**',
      'benchmarks/**',
      '**/*.bench.ts',
      '**/*.spec.ts', // Playwright browser tests
      'benchmarks/browser.spec.ts',
      'benchmarks/browser-quick.spec.ts',
      'coverage/**',
    ],
  },
  resolve: {
    alias: {
      '@tachui/core': resolve(__dirname, './src'),
      '@tachui/primitives': resolve(__dirname, '../primitives/dist'),
      '@tachui/modifiers': resolve(__dirname, '../modifiers/src'),
      '@tachui/effects': resolve(__dirname, '../effects/src'),
      '@tachui/viewport': resolve(__dirname, '../viewport/src'),
      '@tachui/mobile': resolve(__dirname, '../mobile/src'),
      '@tachui/registry': resolve(__dirname, '../registry/src'),
      '@tachui/forms': resolve(__dirname, '../forms/src'),
      '@tachui/grid': resolve(__dirname, '../grid/src'),
      '@tachui/responsive': resolve(__dirname, '../responsive/src'),
    },
  },
})
