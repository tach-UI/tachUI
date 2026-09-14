#!/usr/bin/env node
/**
 * Every entry point a publishable package advertises must actually exist.
 *
 * 0.11.0 shipped a lot that did not. `@tachui/eslint-plugin` published with no
 * code at all — it was missing from the build chain. `@tachui/mobile`'s main
 * entry pointed at `dist/index.js` while vite emitted `dist/mobile.js`, so
 * importing the package failed at runtime though its types resolved.
 * `@tachui/grid` and `@tachui/viewport` advertised declarations they never
 * built. `@tachui/core` pointed four bundle subpaths at the wrong directory and
 * listed six more with no build output behind them.
 *
 * Every one of those produced a green build. Checks the `import`, `types`,
 * `require` and `default` of every exports entry, plus top-level `types`.
 *
 * Run after a build — against a stale dist it passes for the wrong reason,
 * which is how several of the above stayed invisible locally.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FIELDS = ['import', 'types', 'require', 'default']

const problems = []
let checked = 0

for (const dir of readdirSync(join(ROOT, 'packages'))) {
  const manifestPath = join(ROOT, 'packages', dir, 'package.json')
  if (!existsSync(manifestPath)) continue
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (manifest.private) continue

  /** @type {Array<[string, string]>} */
  const declared = []
  if (typeof manifest.types === 'string') declared.push(['"types"', manifest.types])
  for (const [subpath, entry] of Object.entries(manifest.exports ?? {})) {
    if (typeof entry === 'string') {
      declared.push([subpath, entry])
      continue
    }
    if (!entry || typeof entry !== 'object') continue
    for (const field of FIELDS) {
      if (typeof entry[field] === 'string') declared.push([`${subpath} (${field})`, entry[field]])
    }
  }

  for (const [label, rel] of declared) {
    checked++
    if (existsSync(join(ROOT, 'packages', dir, rel.replace(/^\.\//, '')))) continue
    problems.push(`${manifest.name} — ${label} → ${rel}`)
  }
}

if (problems.length) {
  console.error('Packages advertising entry points they do not ship:\n')
  for (const p of problems) console.error(`  ${p}`)
  console.error(
    '\nBuild first. If it persists, the package either builds to a different path than its manifest claims, or is missing from the build chain entirely.'
  )
  process.exit(1)
}

console.log(`All ${checked} advertised entry points exist.`)
