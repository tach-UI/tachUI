import { existsSync } from 'node:fs'
import path from 'node:path'

import { defineConfig, mergeConfig } from 'vitest/config'

import sharedConfig from './vitest.shared.config'

/**
 * The one file the globs cannot reach, and a check that it is still there.
 *
 * Vitest only errors when *no* file matches, and the globs below always match
 * something — so a rename would drop this file from the tier in silence, and
 * its memory assertions would then run nowhere at all, since this config is the
 * only thing that sets the variable un-gating them. That is precisely the rot
 * this tier was repaired to end, so the path is asserted rather than trusted.
 */
const NAMED_BY_PATH = 'packages/core/__tests__/reactive/modifier-lifecycle.test.ts'

if (!existsSync(path.resolve(__dirname, NAMED_BY_PATH))) {
  throw new Error(
    `The memory tier names ${NAMED_BY_PATH} explicitly, and it is not there. It gates its own memory cases on FORCE_MEMORY_TESTS rather than announcing memory in its name, so no glob finds it. Point this at its new home, or rename it so the globs below reach it.`
  )
}

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
        // convention reaches it, and checked above so it cannot go missing
        // quietly.
        NAMED_BY_PATH,
      ],
      env: {
        FORCE_MEMORY_TESTS: 'true',
      },
    },
  })
)
