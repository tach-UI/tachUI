import { defineConfig, mergeConfig } from 'vitest/config'

import sharedConfig from './vitest.shared.config'

/**
 * The memory tier.
 *
 * Registration is by convention rather than by name: a test under a `memory/`
 * directory, or a file with `memory` in its name, is in the tier. #229 exists
 * because the previous script listed literal paths and the files moved out from
 * under it — a glob cannot rot the same way, and `test:stress` already shows the
 * pattern working.
 *
 * `FORCE_MEMORY_TESTS` is set here because the heap-growth suites gate
 * themselves on it, each in its own way, and the variable is the only thing
 * that distinguishes "running the tier" from an ordinary run for them. The
 * retention suites ignore it: they are deterministic and run everywhere.
 */
export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      include: [
        'packages/**/__tests__/**/memory/**/*.test.ts',
        'packages/**/__tests__/**/*memory*.test.ts',
        // Gated by `FORCE_MEMORY_TESTS` in its body rather than announced in
        // its name, so no glob over paths will find it. Listed until the
        // convention reaches it.
        'packages/core/__tests__/reactive/modifier-lifecycle.test.ts',
      ],
      env: {
        FORCE_MEMORY_TESTS: 'true',
      },
    },
  })
)
