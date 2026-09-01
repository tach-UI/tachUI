/**
 * Tests for the bundle size budget gate.
 *
 * This tool is the sole enforcement of issue #276's acceptance criterion 2, so
 * the cases that matter are the ones where it could report a pass it has not
 * earned: a chunk missed by the import scanner, or a specifier it cannot resolve.
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  collectBudgetedPackages,
  measure,
  relativeImportsOf,
  resolveChunk,
} from '../check-size-budget.mjs'

describe('relativeImportsOf', () => {
  it('finds every import on a single minified line', () => {
    // The regression this exists for: an anchored scan caught only chunk-A and
    // silently dropped the rest from the measurement.
    const minified =
      'import{a}from"./chunk-A.js";import{b}from"./chunk-B.js";import{c}from"./chunk-C.js";'

    expect(relativeImportsOf(minified)).toEqual([
      './chunk-A.js',
      './chunk-B.js',
      './chunk-C.js',
    ])
  })

  it('finds re-exports', () => {
    expect(relativeImportsOf('export * from "./chunk.js";export{x}from"./other.js";')).toEqual([
      './chunk.js',
      './other.js',
    ])
  })

  it('finds bare side-effect imports', () => {
    expect(relativeImportsOf('import "./polyfill.js"')).toContain('./polyfill.js')
  })

  it('finds dynamic imports', () => {
    expect(relativeImportsOf('const p = import("./lazy.js")')).toContain('./lazy.js')
  })

  it('ignores bare specifiers, which are the consumer cost not the package cost', () => {
    expect(relativeImportsOf('import { x } from "@tachui/core"\nimport "node:fs"')).toEqual([])
  })

  // Bundlers preserve `/*! ... */` legal banners, and those routinely quote code.
  // Since an unresolvable specifier now throws, a banner naming a file that does
  // not exist would fail the whole gate over an inert comment.
  it('ignores import-like text inside a preserved banner comment', () => {
    const source = '/*! import { x } from "./does-not-exist.js" */\nimport{a}from"./real.js";'
    expect(relativeImportsOf(source)).toEqual(['./real.js'])
  })

  it('ignores import-like text inside a line comment', () => {
    expect(relativeImportsOf('// import x from "./nope.js"\nimport "./real.js"')).toEqual([
      './real.js',
    ])
  })

  // The opposite failure: a real lazy chunk omitted from the measurement because
  // the specifier is followed by an import-attributes argument rather than `)`.
  it('finds a dynamic import that carries import attributes', () => {
    expect(
      relativeImportsOf('const lazy = import("./large.js", { with: { type: "json" } })')
    ).toContain('./large.js')
  })

  it('reports each specifier once even when imported repeatedly', () => {
    expect(
      relativeImportsOf('import{a}from"./c.js";import{b}from"./c.js";')
    ).toEqual(['./c.js'])
  })
})

describe('measure', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'size-budget-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('counts sibling chunks reached from the entry', () => {
    writeFileSync(path.join(dir, 'chunk.js'), 'export const chunk = "a".repeat(500)\n')
    writeFileSync(
      path.join(dir, 'index.js'),
      'import { chunk } from "./chunk.js"\nexport { chunk }\n'
    )

    const result = measure(path.join(dir, 'index.js'))

    expect(result.files).toBe(2)
    expect(result.gzipBytes).toBeGreaterThan(0)
  })

  it('counts a chunk that shares a line with another import', () => {
    writeFileSync(path.join(dir, 'a.js'), 'export const a = 1\n')
    writeFileSync(path.join(dir, 'b.js'), `export const b = "${'x'.repeat(2000)}"\n`)
    writeFileSync(path.join(dir, 'index.js'), 'import{a}from"./a.js";import{b}from"./b.js";')

    const withBoth = measure(path.join(dir, 'index.js'))
    const bAlone = gzipSync(Buffer.from('')).byteLength

    expect(withBoth.files).toBe(3)
    expect(withBoth.gzipBytes).toBeGreaterThan(bAlone)
  })

  it('follows a chunk graph without revisiting a shared dependency', () => {
    writeFileSync(path.join(dir, 'shared.js'), 'export const s = 1\n')
    writeFileSync(path.join(dir, 'a.js'), 'import "./shared.js"\nexport const a = 1\n')
    writeFileSync(path.join(dir, 'b.js'), 'import "./shared.js"\nexport const b = 1\n')
    writeFileSync(path.join(dir, 'index.js'), 'import "./a.js"\nimport "./b.js"\n')

    expect(measure(path.join(dir, 'index.js')).files).toBe(4)
  })

  it('resolves an extensionless specifier', () => {
    writeFileSync(path.join(dir, 'chunk.js'), 'export const c = 1\n')
    writeFileSync(path.join(dir, 'index.js'), 'import "./chunk"\n')

    expect(measure(path.join(dir, 'index.js')).files).toBe(2)
  })

  it('throws rather than silently shrinking the measurement', () => {
    // Skipping an unresolvable chunk would under-report the bundle, which is the
    // one direction this gate must never be wrong in.
    writeFileSync(path.join(dir, 'index.js'), 'import "./does-not-exist.js"\n')

    expect(() => measure(path.join(dir, 'index.js'))).toThrow(/Cannot resolve/)
  })
})

describe('resolveChunk', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'size-budget-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('prefers an exact file, then .js, then a directory index', () => {
    mkdirSync(path.join(dir, 'nested'))
    writeFileSync(path.join(dir, 'nested', 'index.js'), '')
    writeFileSync(path.join(dir, 'plain.js'), '')
    const from = path.join(dir, 'entry.js')

    expect(resolveChunk(from, './plain')).toBe(path.join(dir, 'plain.js'))
    expect(resolveChunk(from, './plain.js')).toBe(path.join(dir, 'plain.js'))
    expect(resolveChunk(from, './nested')).toBe(path.join(dir, 'nested', 'index.js'))
  })

  it('returns undefined for a specifier with no file behind it', () => {
    expect(resolveChunk(path.join(dir, 'entry.js'), './missing')).toBeUndefined()
  })
})

describe('collectBudgetedPackages', () => {
  it('finds the declared budget for @tachui/query', () => {
    const [pkg] = collectBudgetedPackages('@tachui/query')

    expect(pkg).toBeDefined()
    expect(pkg.budget.entry).toBe('dist/index.js')
    expect(pkg.budget.gzipBytes).toBeGreaterThan(0)
  })

  it('returns nothing for a package that declares no budget', () => {
    expect(collectBudgetedPackages('@tachui/core')).toEqual([])
  })
})
