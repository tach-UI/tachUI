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
import { pathToFileURL } from 'node:url'
import process from 'node:process'

const REPO_ROOT = path.resolve(import.meta.dirname, '..')
const PACKAGES_DIR = path.join(REPO_ROOT, 'packages')

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function collectBudgetedPackages(only) {
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
 * The relative specifiers a module imports.
 *
 * A single-pass tokenizer rather than regexes over the whole file. A regex
 * cannot tell import-like text inside an ordinary string from a real import, nor
 * `import("./a")` from `foo.from("./a")`, and blanking every string literal
 * would destroy the specifiers this exists to find. Tracking the preceding word
 * settles all three.
 *
 * Bare specifiers are ignored: an external dependency is the consumer's cost,
 * not this package's.
 */
export function relativeImportsOf(source) {
  const specifiers = []
  const length = source.length
  let i = 0
  let lastWord = ''

  const isIdentifierChar = ch => /[A-Za-z0-9_$]/.test(ch)

  const record = value => {
    if (value !== null && value.startsWith('.') && !specifiers.includes(value)) {
      specifiers.push(value)
    }
  }

  while (i < length) {
    const two = source.slice(i, i + 2)

    if (two === '//') {
      const stop = source.indexOf('\n', i)
      i = stop === -1 ? length : stop
      continue
    }

    if (two === '/*') {
      const stop = source.indexOf('*/', i + 2)
      i = stop === -1 ? length : stop + 2
      continue
    }

    const ch = source[i]

    if (ch === '"' || ch === "'" || ch === '`') {
      const literal = readStringLiteral(source, i)
      if (lastWord === 'from' || lastWord === 'import') record(literal.value)
      i = literal.end
      lastWord = ''
      continue
    }

    if (isIdentifierChar(ch)) {
      let j = i
      while (j < length && isIdentifierChar(source[j])) j += 1
      lastWord = source.slice(i, j)
      i = j
      continue
    }

    // Whitespace preserves the word context; `(` preserves it only for
    // `import(`, so dynamic imports resolve while `something.from(...)` does not.
    if (/\s/.test(ch)) {
      i += 1
      continue
    }

    if (ch === '(') {
      if (lastWord !== 'import') lastWord = ''
      i += 1
      continue
    }

    lastWord = ''
    i += 1
  }

  return specifiers
}

/**
 * Read the string or template literal starting at `start`.
 *
 * Returns the decoded value and the index just past the closing quote. `value`
 * is null for a template carrying an interpolation: its specifier is not
 * statically known, so it could not be resolved on disk anyway.
 */
function readStringLiteral(source, start) {
  const quote = source[start]
  let i = start + 1
  let value = ''
  let interpolated = false

  while (i < source.length) {
    const ch = source[i]

    if (ch === '\\') {
      // Keep the escaped character: `import "./quo\"ted.js"` names a file with a
      // quote in it, not a specifier truncated at the backslash.
      value += source[i + 1] ?? ''
      i += 2
      continue
    }

    if (quote === '`' && ch === '$' && source[i + 1] === '{') {
      interpolated = true
      let depth = 1
      i += 2
      while (i < source.length && depth > 0) {
        if (source[i] === '{') depth += 1
        else if (source[i] === '}') depth -= 1
        i += 1
      }
      continue
    }

    if (ch === quote) {
      i += 1
      break
    }

    value += ch
    i += 1
  }

  return { value: interpolated ? null : value, end: i }
}

export function resolveChunk(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier)
  const candidates = [base, `${base}.js`, `${base}.mjs`, path.join(base, 'index.js')]
  return candidates.find(candidate => existsSync(candidate) && statSync(candidate).isFile())
}

/**
 * Gzip the entry plus every relatively-imported chunk as one buffer. Gzipping the
 * concatenation rather than summing per-file gzip sizes is both closer to what a
 * server sends and immune to per-file header overhead inflating small chunks.
 */
export function measure(entryFile) {
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
      if (!resolved) {
        // Dropping it would quietly shrink the measured bundle, which is the one
        // direction this gate must never be wrong in.
        throw new Error(
          `Cannot resolve ${specifier} imported from ${file}. The size budget cannot be measured accurately.`
        )
      }
      queue.push(resolved)
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

export function main() {
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

// Only run when invoked directly, so tests can import the helpers above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
