import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@tachui\/core\/modifiers\/base$/,
        replacement: resolve(__dirname, '../core/src/modifiers/base.ts'),
      },
      {
        find: /^@tachui\/core\/modifiers$/,
        replacement: resolve(__dirname, '../core/src/modifiers/index.ts'),
      },
      {
        find: /^@tachui\/core\/reactive$/,
        replacement: resolve(__dirname, '../core/src/reactive/index.ts'),
      },
      {
        find: /^@tachui\/core\/runtime$/,
        replacement: resolve(__dirname, '../core/src/runtime/index.ts'),
      },
      {
        find: /^@tachui\/core\/assets$/,
        replacement: resolve(__dirname, '../core/src/assets/index.ts'),
      },
      {
        find: /^@tachui\/core\/gradients$/,
        replacement: resolve(__dirname, '../core/src/gradients/index.ts'),
      },
      {
        find: /^@tachui\/core$/,
        replacement: resolve(__dirname, '../core/src/index.ts'),
      },
      // A directory subpath: the wildcard below appends `.ts` and would miss
      // it. Needed because the primitives barrel reaches it through `Stack`,
      // so without this `@tachui/primitives` resolves to source that cannot
      // load, and only the subpaths that avoid it work.
      {
        find: /^@tachui\/core\/components$/,
        replacement: resolve(__dirname, '../core/src/components/index.ts'),
      },
      {
        find: /^@tachui\/core\/(.*)$/,
        replacement: resolve(__dirname, '../core/src/$1.ts'),
      },
      {
        find: /^@tachui\/types\/(.*)$/,
        replacement: resolve(__dirname, '../types/src/$1.ts'),
      },
      {
        find: /^@tachui\/types$/,
        replacement: resolve(__dirname, '../types/src/index.ts'),
      },
      {
        find: /^@tachui\/modifiers\/animation$/,
        replacement: resolve(__dirname, '../modifiers/src/animation/index.ts'),
      },
      {
        find: /^@tachui\/modifiers\/(.*)$/,
        replacement: resolve(__dirname, '../modifiers/src/$1.ts'),
      },
      {
        find: /^@tachui\/modifiers$/,
        replacement: resolve(__dirname, '../modifiers/src/index.ts'),
      },
      // Test-only, and not a package dependency: this package depends on
      // `@tachui/core` alone. `shape-shell.test.ts` needs a real shape to
      // prove the serializer emits its shell, and the root config already
      // aliases primitives — without this the file would pass at the root and
      // fail the package-local run. The barrel resolves too, not only the
      // subpaths that happen to avoid `@tachui/core/components`.
      {
        find: /^@tachui\/primitives\/(.*)$/,
        replacement: resolve(__dirname, '../primitives/src/$1'),
      },
      {
        find: /^@tachui\/primitives$/,
        replacement: resolve(__dirname, '../primitives/src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
