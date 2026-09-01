#!/usr/bin/env node
/**
 * Bundle size budget gate.
 *
 * A package opts in by declaring a budget in its package.json:
 *
 *   "tachui": {
 *     "sizeBudget": { "entry": "dist/index.js", "gzipBytes": 12288 }
 *   }
 *
 * Packages without that field are skipped, so this can be adopted one package at a
 * time rather than needing a budget for all twenty at once.
 *
 * Measures the gzipped size of the built entry, following relative imports so that
 * code split into sibling chunks still counts against the budget. Requires the
 * package to be built first.
 *
 * Usage:
 *   node tools/check-size-budget.mjs              # every package that declares a budget
 *   node tools/check-size-budget.mjs @tachui/query # just one
 */
import { gzipSync } from 'node:zlib'
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const REPO_ROOT = path.resolve(import.meta.dirname, '..')
const PACKAGES_DIR = path.join(REPO_ROOT, 'packages')

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function collectBudgetedPackages(only) {
  const packages = []

  for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const manifestPath = path.join(PACKAGES_DIR, entry.name, 'package.json')
    if (!existsSync(manifestPath)) continue

    let manifest
    try {
      manifest = readJson(manifestPath)
    } catch {
      continue
    }

    const budget = manifest.tachui?.sizeBudget
    if (!budget) continue
    if (only && manifest.name !== only) continue

    if (typeof budget.entry !== 'string' || typeof budget.gzipBytes !== 'number') {
      throw new Error(
        `${manifest.name}: tachui.sizeBudget must declare a string "entry" and a numeric "gzipBytes".`
      )
    }

    packages.push({
      name: manifest.name,
      directory: path.join(PACKAGES_DIR, entry.name),
      budget,
    })
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Resolve the specifiers a module imports, keeping only relative ones. External
 * dependencies are the consumer's cost, not this package's.
 */
function relativeImportsOf(source) {
  const specifiers = []
  const patterns = [
    /(?:^|\n)\s*(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]/g,
    /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1].startsWith('.')) specifiers.push(match[1])
    }
  }

  return specifiers
}

function resolveChunk(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier)
  const candidates = [base, `${base}.js`, `${base}.mjs`, path.join(base, 'index.js')]
  return candidates.find(candidate => existsSync(candidate) && statSync(candidate).isFile())
}

/**
 * Gzip the entry plus every relatively-imported chunk as one buffer. Gzipping the
 * concatenation rather than summing per-file gzip sizes is both closer to what a
 * server sends and immune to per-file header overhead inflating small chunks.
 */
function measure(entryFile) {
  const seen = new Set()
  const queue = [entryFile]
  const sources = []

  while (queue.length > 0) {
    const file = queue.shift()
    if (seen.has(file)) continue
    seen.add(file)

    const source = readFileSync(file, 'utf8')
    sources.push(source)

    for (const specifier of relativeImportsOf(source)) {
      const resolved = resolveChunk(file, specifier)
      if (resolved) queue.push(resolved)
    }
  }

  return {
    files: seen.size,
    gzipBytes: gzipSync(Buffer.from(sources.join('\n'), 'utf8')).byteLength,
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB (${bytes} B)`
}

function main() {
  const only = process.argv[2]
  let packages

  try {
    packages = collectBudgetedPackages(only)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  if (only && packages.length === 0) {
    console.error(`No size budget declared for ${only}.`)
    process.exit(1)
  }

  if (packages.length === 0) {
    console.log('No packages declare tachui.sizeBudget; nothing to check.')
    return
  }

  const failures = []

  for (const pkg of packages) {
    const entryFile = path.join(pkg.directory, pkg.budget.entry)

    if (!existsSync(entryFile)) {
      failures.push(
        `${pkg.name}: ${pkg.budget.entry} does not exist. Build the package before checking its size budget.`
      )
      continue
    }

    const { files, gzipBytes } = measure(entryFile)
    const limit = pkg.budget.gzipBytes
    const percent = ((gzipBytes / limit) * 100).toFixed(1)
    const detail = `${formatBytes(gzipBytes)} gzipped across ${files} file(s), budget ${formatBytes(limit)} (${percent}%)`

    if (gzipBytes > limit) {
      failures.push(`${pkg.name}: OVER BUDGET - ${detail}`)
    } else {
      console.log(`${pkg.name}: ${detail}`)
    }
  }

  if (failures.length > 0) {
    console.error('\nBundle size budget exceeded:')
    for (const failure of failures) console.error(`- ${failure}`)
    console.error(
      '\nEither reduce the bundle or raise tachui.sizeBudget.gzipBytes deliberately, in its own commit.'
    )
    process.exit(1)
  }
}

main()
