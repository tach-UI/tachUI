#!/usr/bin/env node
/**
 * Every publishable package that advertises type declarations must actually
 * ship them.
 *
 * `@tachui/grid@0.11.0` and `@tachui/viewport@0.11.0` both declared
 * `"types": "./dist/index.d.ts"` and published zero `.d.ts` files: grid's build
 * never ran `tsc`, and viewport's did but inherited `noEmit: true` from the root
 * config, which wins over `emitDeclarationOnly`. Both produced a green build and
 * a package TypeScript consumers cannot type.
 *
 * Run after a build.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Entry points that are broken beyond a wrong path, kept visible rather than
 * deleted from the check. Each ships today and each needs its build fixed, not
 * its manifest edited.
 */
const KNOWN_GAPS = new Map([
  [
    '@tachui/core:./dist/viewport/index.d.ts',
    'The ./viewport subpath has no build output at all — the .js is missing too.',
  ],
  [
    '@tachui/grid:./dist/components/index.d.ts',
    'The ./components subpath has no build output; vite emits a single entry.',
  ],
  [
    '@tachui/grid:./dist/modifiers/index.d.ts',
    'The ./modifiers subpath has no build output; vite emits a single entry.',
  ],
])

const problems = []
let checked = 0

for (const dir of readdirSync(join(ROOT, 'packages'))) {
  const manifestPath = join(ROOT, 'packages', dir, 'package.json')
  if (!existsSync(manifestPath)) continue
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (manifest.private) continue

  const declared = new Set()
  if (manifest.types) declared.add(manifest.types)
  for (const entry of Object.values(manifest.exports ?? {})) {
    if (entry && typeof entry === 'object' && entry.types) declared.add(entry.types)
  }

  for (const rel of declared) {
    checked++
    const abs = join(ROOT, 'packages', dir, rel.replace(/^\.\//, ''))
    if (existsSync(abs)) continue
    const gap = KNOWN_GAPS.get(`${manifest.name}:${rel}`)
    if (gap) {
      console.warn(`  known gap: ${manifest.name} ${rel} — ${gap}`)
      continue
    }
    problems.push(`${manifest.name} declares ${rel}, which was not built`)
  }
}

if (problems.length) {
  console.error('Packages advertising type declarations they do not ship:\n')
  for (const p of problems) console.error(`  ${p}`)
  console.error('\nBuild first; if this persists the package\'s declaration build is broken.')
  process.exit(1)
}
console.log(`All ${checked} declared type entry points exist.`)
