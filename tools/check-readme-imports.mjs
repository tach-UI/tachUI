#!/usr/bin/env node
/**
 * Every `import { … } from '@tachui/…'` in a package README, checked against
 * what that entry point actually exports.
 *
 * `@tachui/cli@0.11.0` shipped starter templates importing `Text` from
 * `@tachui/core`, which has never exported it. The same mistake was spread
 * across the READMEs: components imported from `core` rather than
 * `primitives`, and whole APIs that were never built. A README nobody can
 * execute rots silently, so this executes the only part of it that can be
 * checked mechanically.
 *
 * Deliberate counter-examples — a migration guide's "old" import, a
 * before/after pair — belong in ALLOWED below, with a reason.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** `pkg\tspec\tname` entries that are intentionally wrong. */
const ALLOWED = new Map([
  [
    'viewport\t@tachui/core\tViewport, initializeViewportSystem',
    'The "Old (from @tachui/core)" half of the migration example below it.',
  ],
])
const pkgs = readdirSync(join(ROOT, 'packages'))
const byName = {}
for (const d of pkgs) {
  const pj = join(ROOT, 'packages', d, 'package.json')
  if (!existsSync(pj)) continue
  const j = JSON.parse(readFileSync(pj, 'utf8'))
  byName[j.name] = { dir: d, json: j }
}

/** Resolve a spec to its .d.ts via the package's exports map. */
function typesFor(spec) {
  const base = spec.split('/').slice(0, 2).join('/')
  const entry = byName[base]
  if (!entry) return { error: 'unknown package' }
  const sub = spec.split('/').slice(2).join('/')
  const key = sub ? `./${sub}` : '.'
  const exp = entry.json.exports || {}
  const node = exp[key]
  let types
  if (typeof node === 'string') types = node.replace(/\.js$/, '.d.ts')
  else if (node) types = node.types || node.import?.types || (typeof node.import === 'string' ? node.import.replace(/\.js$/, '.d.ts') : undefined)
  if (!types) return { error: `no exports entry for "${key}"` }
  const p = join(ROOT, 'packages', entry.dir, types.replace(/^\.\//, ''))
  if (!existsSync(p)) return { error: `types file missing: ${types}` }
  return { path: p }
}

/** Names a .d.ts exports, following `export * from './x'` one level deep. */
function namesIn(path, seen = new Set(), depth = 0) {
  if (depth > 6 || seen.has(path) || !existsSync(path)) return new Set()
  seen.add(path)
  const src = readFileSync(path, 'utf8')
  const out = new Set()
  for (const m of src.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)) {
    for (let n of m[1].split(',')) {
      n = n.trim().replace(/^type\s+/, '')
      const as = n.split(/\s+as\s+/)
      out.add((as[1] || as[0] || '').trim())
    }
  }
  for (const m of src.matchAll(/export\s+(?:declare\s+)?(?:abstract\s+)?(?:const|function|class|interface|type|enum|let|var)\s+([A-Za-z0-9_$]+)/g)) out.add(m[1])
  for (const m of src.matchAll(/export\s*\*\s*from\s*['"](\.[^'"]+)['"]/g)) {
    const rel = m[1]
    for (const cand of [rel + '.d.ts', rel + '/index.d.ts', rel.replace(/\.js$/, '.d.ts')]) {
      const p = join(dirname(path), cand)
      if (existsSync(p)) { for (const n of namesIn(p, seen, depth + 1)) out.add(n); break }
    }
  }
  out.delete('')
  return out
}

const problems = []
let checked = 0
for (const d of pkgs) {
  const readme = join(ROOT, 'packages', d, 'README.md')
  if (!existsSync(readme)) continue
  const text = readFileSync(readme, 'utf8')
  for (const f of text.matchAll(/```(?:ts|typescript|js|javascript)\n([\s\S]*?)```/g)) {
    // A section that says up front it is not built yet is allowed to show the
    // API it is promising. Everything else has to resolve today.
    const heading = text.slice(0, f.index).match(/^#{1,6} .*$/gm)?.at(-1) ?? ''
    if (/🚧|planned|roadmap|not implemented|future release/i.test(heading)) continue
    for (const im of f[1].matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s*from\s*['"](@tachui\/[^'"]+)['"]/g)) {
      checked++
      const spec = im[2]
      const names = im[1].split(',').map(s => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]).filter(Boolean)
      const t = typesFor(spec)
      if (t.error) { problems.push(`${d}\t${spec}\tUNRESOLVED: ${t.error}`); continue }
      const have = namesIn(t.path)
      const missing = names.filter(n => !have.has(n))
      if (missing.length) problems.push(`${d}\t${spec}\tmissing: ${missing.join(', ')}`)
    }
  }
}
const unique = [...new Set(problems)].sort()
const unexpected = unique.filter((line) => {
  const [pkg, spec, detail] = line.split('\t')
  return !ALLOWED.has(`${pkg}\t${spec}\t${detail.replace(/^missing: /, '')}`)
})

if (unexpected.length) {
  console.error(`README imports that do not resolve (${checked} checked):\n`)
  for (const line of unexpected) {
    const [pkg, spec, detail] = line.split('\t')
    console.error(`  packages/${pkg}/README.md — ${spec} ${detail}`)
  }
  console.error(
    '\nFix the README, or add a deliberate counter-example to ALLOWED in tools/check-readme-imports.mjs with a reason.'
  )
  process.exit(1)
}

console.log(`All ${checked} @tachui imports in package READMEs resolve.`)
