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
 * and by emitting a Vite manifest, which is where the chunk graph comes from:
 *
 *   build: { manifest: true, ... }
 *
 * Packages without a budget are skipped, so this can be adopted one package at a
 * time rather than needing a budget for all twenty at once.
 *
 * Measures the gzipped size of the built entry plus every chunk it pulls in, so
 * code split into siblings still counts against the budget. Requires the package
 * to be built first.
 *
 * The graph is read from `dist/.vite/manifest.json` rather than parsed out of the
 * emitted JavaScript. Rollup already computes it exactly while building;
 * re-deriving it afterwards means writing a JavaScript lexer, and a lexer that is
 * subtly wrong fails in the worst possible direction here - a missed specifier
 * drops a chunk from the total silently, so the gate passes on an understated
 * number with nothing thrown. Reading the build's own answer removes that whole
 * class of failure.
 *
 * Usage:
 *   node tools/check-size-budget.mjs              # every package that declares a budget
 *   node tools/check-size-budget.mjs @tachui/query # just one
 */
import { gzipSync } from 'node:zlib'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
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
 * Locate the Vite manifest covering `entryFile`, walking up from the entry to the
 * package root so a nested `outDir` still resolves.
 *
 * Returns the parsed manifest and the directory its `file` paths are relative to.
 */
export function findManifest(entryFile, packageDir) {
  let dir = path.dirname(path.resolve(entryFile))
  const root = path.resolve(packageDir)

  while (dir.startsWith(root)) {
    const candidate = path.join(dir, '.vite', 'manifest.json')
    if (existsSync(candidate)) {
      return { manifest: readJson(candidate), outDir: dir, manifestPath: candidate }
    }
    if (dir === root) break
    dir = path.dirname(dir)
  }

  throw new Error(
    `No Vite manifest found for ${entryFile}. The size budget reads the chunk graph from ` +
      `the build rather than re-deriving it, so the package must set "manifest: true" under ` +
      `"build" in its vite.config.ts and be rebuilt.`
  )
}

/**
 * Every emitted file reachable from `entryFile`, as paths relative to `outDir`.
 *
 * Manifest records key their dependencies by manifest key, not by filename, and a
 * chunk can be reached by more than one path, so this is a breadth-first walk over
 * keys with a visited set. Static and dynamic imports both count: a dynamically
 * imported chunk is still shipped and still downloaded when the branch is taken.
 *
 * `record.css` counts too. Extracted stylesheets are a blocking dependency of the
 * chunk that owns them - the browser downloads them to render at all - so leaving
 * them out lets a CSS-bearing package pass on an understated total.
 *
 * `record.assets` deliberately does not count. Assets are referenced by URL and
 * fetched on demand rather than pulled in by loading the chunk, and they are
 * already-compressed binaries (fonts, images) whose gzipped size is not a
 * meaningful contribution to a gzip budget. Counting them would make the number
 * larger without making it more truthful. If that trade ever needs revisiting it
 * should be a deliberate change with its own budget, not a silent addition here.
 *
 * Files are collected into a set: one stylesheet is commonly shared by several
 * chunks, and a shared file must be paid for once, not once per referrer.
 */
export function chunkFilesFor(manifest, entryFile) {
  const entryKey = Object.keys(manifest).find(key => manifest[key].file === entryFile)
  if (!entryKey) {
    throw new Error(
      `The Vite manifest has no record whose "file" is ${entryFile}. ` +
        `Known files: ${Object.values(manifest)
          .map(record => record.file)
          .join(', ')}`
    )
  }

  const seen = new Set()
  const queue = [entryKey]
  const files = new Set()

  while (queue.length > 0) {
    const key = queue.shift()
    if (seen.has(key)) continue
    seen.add(key)

    const record = manifest[key]
    if (!record) {
      // Dropping it would quietly shrink the measured bundle, which is the one
      // direction this gate must never be wrong in.
      throw new Error(
        `The Vite manifest references "${key}" but does not define it. ` +
          `The size budget cannot be measured accurately.`
      )
    }

    files.add(record.file)
    for (const stylesheet of record.css ?? []) files.add(stylesheet)

    for (const next of record.imports ?? []) queue.push(next)
    for (const next of record.dynamicImports ?? []) queue.push(next)
  }

  return [...files]
}

/**
 * Gzip each reachable chunk on its own and sum the results.
 *
 * Chunks are separate responses with separate gzip streams, so they are sized
 * separately. Gzipping them concatenated would let duplicate text across chunks
 * share one dictionary and undercount what a browser actually downloads -
 * measured at 8-27% on this repo's own multi-chunk packages, which is enough for
 * an over-budget split package to pass.
 */
export function measure(entryFile, packageDir) {
  const { manifest, outDir } = findManifest(entryFile, packageDir)
  const relativeEntry = path.relative(outDir, path.resolve(entryFile))
  const files = chunkFilesFor(manifest, relativeEntry)

  let gzipBytes = 0
  for (const file of files) {
    const absolute = path.join(outDir, file)
    if (!existsSync(absolute)) {
      throw new Error(
        `The Vite manifest lists ${file}, but it does not exist under ${outDir}. ` +
          `The size budget cannot be measured accurately.`
      )
    }
    gzipBytes += gzipSync(readFileSync(absolute)).byteLength
  }

  return { files: files.length, gzipBytes }
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

    let files
    let gzipBytes
    try {
      ;({ files, gzipBytes } = measure(entryFile, pkg.directory))
    } catch (error) {
      failures.push(`${pkg.name}: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }

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
    // Covers two kinds of failure now: over budget, and unable to measure.
    console.error('\nBundle size budget check failed:')
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
