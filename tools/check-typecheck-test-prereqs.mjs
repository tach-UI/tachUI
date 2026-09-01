#!/usr/bin/env node
/**
 * Guard the prerequisites of the type-level test suite.
 *
 * `tsconfig.typecheck-tests.json` resolves `@tachui/*` to built declarations,
 * because a type test that reads `src/**` proves the source compiles and says
 * nothing about what an installed consumer receives.
 *
 * The failure mode when `dist` is absent is quiet and dangerous rather than
 * loud: the imports resolve to `any`, every `assertType` and `expectTypeOf`
 * then trivially succeeds, and the suite reports a near-clean pass while
 * asserting nothing. Measured on this repo with `packages/primitives/dist`
 * removed: 9 of 10 tests still "passed", and only an `@ts-expect-error` that
 * had become unused gave the game away.
 *
 * So fail up front, with the command that fixes it, rather than letting a
 * green run mean nothing.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Declarations the type tests resolve against, as declared in the tsconfig paths. */
const REQUIRED = [
  'packages/types/dist/index.d.ts',
  'packages/core/dist/index.d.ts',
  'packages/query/dist/index.d.ts',
  'packages/modifiers/dist/index.d.ts',
  'packages/primitives/dist/index.d.ts',
  'packages/primitives/dist/controls/index.d.ts',
]

const missing = REQUIRED.filter((path) => !existsSync(join(repoRoot, path)))

if (missing.length > 0) {
  console.error('Type tests need built declarations, and these are missing:')
  for (const path of missing) console.error(`  - ${path}`)
  console.error('')
  console.error('Without them the imports resolve to `any` and the assertions')
  console.error('pass without checking anything. Build first:')
  console.error('')
  console.error('  bun run build')
  console.error('')
  process.exit(1)
}
