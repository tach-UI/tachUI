import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from './vitest.shared.config'

/**
 * Type-level tests.
 *
 * These assert the shape of a package's public API rather than its behaviour:
 * that documented call forms resolve, that a signature change has not silently
 * broken an older one, that a foot-gun the type system should reject is
 * actually rejected. Nothing here runs at runtime — vitest invokes `tsc` and
 * reports type errors as test failures.
 *
 * Kept in its own config because typecheck mode is markedly slower than the
 * runtime suites and has a different include pattern (`*.test-d.ts`).
 *
 * Each project is compiled as its own program. A module augmentation, such as
 * the one a modifier package makes to the builder, applies to the whole
 * program once any file imports that module. A test that checks what is
 * declared without such an import therefore goes under `isolated-types/`,
 * which the `isolated` project compiles apart from the rest. Each project
 * needs its own tsconfig for that: `tsc` compiles what the tsconfig includes,
 * whatever the project's own `include` says.
 */
const ISOLATED = 'packages/**/__tests__/isolated-types/**/*.test-d.ts'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'types',
            include: [],
            typecheck: {
              enabled: true,
              include: ['packages/**/__tests__/**/*.test-d.ts'],
              exclude: ['**/node_modules/**', ISOLATED],
              tsconfig: './tsconfig.typecheck-tests.json',
            },
            environment: 'node',
            exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
          },
        },
        {
          extends: true,
          test: {
            name: 'isolated',
            include: [],
            typecheck: {
              enabled: true,
              include: [ISOLATED],
              tsconfig: './tsconfig.typecheck-isolated.json',
            },
            environment: 'node',
            exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
          },
        },
      ],
    },
  })
)
