#!/usr/bin/env node
/**
 * Every ESM entry point a publishable package advertises must actually import.
 *
 * `ci:check-declared-types` proves the files exist, and existing is not
 * working: `@tachui/eslint-plugin` was repaired from publishing nothing to
 * publishing a `dist` whose entry threw ERR_MODULE_NOT_FOUND on load, because
 * `"type": "module"` requires extensioned relative specifiers and its build
 * emitted `./rules/prefer-direct-modifiers`. Existence checks passed the whole
 * time.
 *
 * Only self-contained packages are loaded. Anything importing another @tachui
 * package needs the whole graph built and installed to resolve, which is what
 * `release:smoke` covers; this catches the class the smoke test cannot see
 * because it only scaffolds an app from a couple of packages.
 *
 * Run after a build.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Relative specifiers a `"type": "module"` build must not emit extensionless. */
function extensionlessRelativeImports(file) {
  const src = readFileSync(file, 'utf8')
  const bad = []
  // Anchored to the start of a line: a bundle contains error-message strings
  // that read like import statements, and matching those reports nonsense.
  for (const m of src.matchAll(/^\s*(?:import[^'"\n]*from|export[^'"\n]*from|import)\s*['"](\.[^'"]*)['"]/gm)) {
    const spec = m[1]
    if (!/\.(js|mjs|cjs|json|node)$/.test(spec)) bad.push(spec)
  }
  return bad
}

const problems = []
let loaded = 0
let scanned = 0

for (const dir of readdirSync(join(ROOT, 'packages'))) {
  const manifestPath = join(ROOT, 'packages', dir, 'package.json')
  if (!existsSync(manifestPath)) continue
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (manifest.private || manifest.type !== 'module') continue

  const entry = manifest.exports?.['.']?.import ?? manifest.main
  if (typeof entry !== 'string') continue
  const abs = join(ROOT, 'packages', dir, entry.replace(/^\.\//, ''))
  if (!existsSync(abs)) continue // check-declared-types owns that failure

  scanned++
  const bad = extensionlessRelativeImports(abs)
  if (bad.length) {
    problems.push(
      `${manifest.name} — ${entry} imports ${bad.join(', ')} without a file extension; Node ESM will not resolve it`
    )
    continue
  }

  // Self-contained packages get actually loaded.
  const deps = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })
  if (deps.some((d) => d.startsWith('@tachui/'))) continue
  try {
    await import(pathToFileURL(abs).href)
    loaded++
  } catch (error) {
    problems.push(`${manifest.name} — ${entry} failed to import: ${error.code ?? error.message}`)
  }
}

if (problems.length) {
  console.error('Published entry points that will not load:\n')
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}

console.log(`Checked ${scanned} ESM entry points for resolvable specifiers; imported ${loaded} self-contained ones.`)
