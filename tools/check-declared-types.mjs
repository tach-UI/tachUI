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
/** Conditions whose value is another entry object rather than a path. */
const CONDITIONS = ['development', 'production', 'node', 'browser', 'worker', 'deno', 'bun']

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

  // Conditions nest: @tachui/devtools puts development and production objects
  // under its "." entry, and a first-level-only walk never sees
  // dist/index.prod.js. Recurse, and treat a shape this does not understand as
  // a failure rather than skipping it — a silent skip is how an unchecked entry
  // point gets published.
  const walk = (label, node) => {
    if (typeof node === 'string') {
      declared.push([label, node])
      return
    }
    if (node === null) return // an explicitly blocked condition
    if (typeof node !== 'object' || Array.isArray(node)) {
      problems.push(`${manifest.name} — ${label} has an exports shape this check does not understand: ${JSON.stringify(node)}`)
      return
    }
    for (const [key, child] of Object.entries(node)) {
      if (!FIELDS.includes(key) && !key.startsWith('.') && !CONDITIONS.includes(key)) {
        problems.push(`${manifest.name} — ${label} uses an unrecognised export condition "${key}"; teach this check about it rather than letting it go unchecked`)
        continue
      }
      walk(`${label} (${key})`, child)
    }
  }
  for (const [subpath, entry] of Object.entries(manifest.exports ?? {})) walk(subpath, entry)

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
