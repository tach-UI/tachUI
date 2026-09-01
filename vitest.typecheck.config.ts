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
 */
export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      include: [],
      typecheck: {
        enabled: true,
        include: ['packages/**/__tests__/**/*.test-d.ts'],
        tsconfig: './tsconfig.typecheck-tests.json',
      },
      environment: 'node',
      exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
    },
  })
)
