import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tools/testing/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.bench.ts',
        'tools/',
        'examples/',
      ],
    },
    exclude: [
      'node_modules/**',
      '**/node_modules/**',
      '**/packages/**/node_modules/**',
      '**/packages/**/benchmarks/**/*.spec.ts',
      'packages/cli/',
    ],
    followSymlinks: false,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: [
      {
        find: '@tachui/core/plugins',
        replacement: path.resolve(__dirname, 'packages/core/src/plugins'),
      },
      {
        find: '@tachui/core',
        replacement: path.resolve(__dirname, 'packages/core/dist'),
      },
      {
        find: '@tachui/primitives',
        replacement: path.resolve(__dirname, 'packages/primitives/dist'),
      },
      {
        find: '@tachui/cli',
        replacement: path.resolve(__dirname, 'packages/cli/src'),
      },
      {
        find: '@tachui/forms',
        replacement: path.resolve(__dirname, 'packages/forms/src'),
      },
      {
        find: '@tachui/navigation',
        replacement: path.resolve(__dirname, 'packages/navigation/src'),
      },
      {
        find: '@tachui/mobile',
        replacement: path.resolve(__dirname, 'packages/mobile/src'),
      },
      {
        find: '@tachui/symbols',
        replacement: path.resolve(__dirname, 'packages/symbols/src'),
      },
      {
        find: '@tachui/data',
        replacement: path.resolve(__dirname, 'packages/data/src'),
      },
      {
        find: '@tachui/grid',
        replacement: path.resolve(__dirname, 'packages/grid/src'),
      },
      {
        find: '@tachui/modifiers',
        replacement: path.resolve(__dirname, 'packages/modifiers/dist'),
      },
      {
        find: '@tachui/effects',
        replacement: path.resolve(__dirname, 'packages/effects/dist'),
      },
      {
        find: '@tachui/responsive',
        replacement: path.resolve(__dirname, 'packages/responsive/src'),
      },
      {
        find: '@tachui/devtools',
        replacement: path.resolve(__dirname, 'packages/devtools/src'),
      },
    ],
  },
})
