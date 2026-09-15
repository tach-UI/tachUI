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
        'apps/',
        'examples/',
      ],
    },
    exclude: [
      'apps/**',
      // Git worktrees created under `.claude/worktrees` are gitignored but
      // sit inside the checkout, and this config's default include walks
      // them: the pre-push gate then runs another checkout's tests against
      // this one's sources and fails on whatever differs between the two.
      '.claude/**',
      'node_modules/**',
      '**/node_modules/**',
      '**/packages/**/node_modules/**',
      '**/packages/**/benchmarks/**/*.spec.ts',
      // Excluded from PR CI. What is left here is the stress tier and the
      // CLI package, both of which run nightly through
      // `.github/workflows/extended-tests.yml`. Removing a pattern here
      // without adding it to that tier's config stops the suite running
      // anywhere, which is how #229 happened.
      //
      // The slow integration and benchmark suites used to be excluded too,
      // behind a `test:long` tier. Measured, they cost 9 seconds of a 34
      // second run, so they gate every PR now instead — a tier nobody looks
      // at is worth less than nine seconds.
      // The CLI package has its own vitest config and the nightly `cli` job
      // runs it — except the starter-template render suite, which has to gate
      // every PR. A template that type-checks and then throws on mount is
      // exactly what shipped in 0.11.0, and a nightly catches that the morning
      // after it merges. 34ms of tests.
      'packages/cli/!(__tests__)/**',
      'packages/cli/__tests__/!(templates)/**',
      // Matches `test:stress`'s own glob exactly. Narrower here (`*stress.`)
      // would let a `stress-helpers.test.ts` run in both.
      '**/*stress*.test.ts',
      '.github/demos/**',
      'demos/**',
    ],
    followSymlinks: false,
    // Reduce timeout for CI to catch hanging tests faster
    testTimeout: 15000, // 15 seconds instead of default 5 seconds
  },
  resolve: {
    // Essential for ES module resolution in TypeScript
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],

    alias: [
      // Core packages - use src for consistent testing with local environment
      {
        find: '@tachui/core/plugins',
        replacement: path.resolve(__dirname, 'packages/core/src/plugins'),
      },
      {
        find: '@tachui/core/minimal',
        replacement: path.resolve(__dirname, 'packages/core/src/bundles/minimal'),
      },
      {
        find: '@tachui/core/gradients',
        replacement: path.resolve(__dirname, 'packages/core/src/gradients'),
      },
      {
        find: '@tachui/core/assets',
        replacement: path.resolve(__dirname, 'packages/core/src/assets'),
      },
      {
        find: '@tachui/core',
        replacement: path.resolve(__dirname, 'packages/core/src'),
      },
      {
        find: '@tachui/primitives',
        replacement: path.resolve(__dirname, 'packages/primitives/src'),
      },
      {
        find: '@tachui/devtools',
        replacement: path.resolve(__dirname, 'packages/devtools/src'),
      },
      {
        find: '@tachui/registry',
        replacement: path.resolve(__dirname, 'packages/registry/src'),
      },

      // Plugin packages
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
        find: '@tachui/responsive',
        replacement: path.resolve(__dirname, 'packages/responsive/src'),
      },
      {
        find: '@tachui/viewport',
        replacement: path.resolve(__dirname, 'packages/viewport/src'),
      },
      {
        find: '@tachui/modifiers',
        replacement: path.resolve(__dirname, 'packages/modifiers/src'), // Effects merged into modifiers
      },
      {
        find: '@tachui/flow-control',
        replacement: path.resolve(__dirname, 'packages/flow-control/src'),
      },
      {
        find: '@tachui/cli',
        replacement: path.resolve(__dirname, 'packages/cli/src'),
      },
      {
        find: '@tachui/ssr',
        replacement: path.resolve(__dirname, 'packages/ssr/src'),
      },
      {
        find: '@tachui/fragments',
        replacement: path.resolve(__dirname, 'packages/fragments/src'),
      },
      {
        find: '@tachui/fragments/runtime',
        replacement: path.resolve(__dirname, 'packages/fragments/src/runtime.ts'),
      },
      {
        find: '@tachui/query',
        replacement: path.resolve(__dirname, 'packages/query/src'),
      },
    ],
  },
})
