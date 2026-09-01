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

  // A regex scanner cannot tell import-like text inside a string from a real
  // import. These four cases defeated the previous one in both directions: the
  // first two invented chunks that do not exist (and, since an unresolvable
  // specifier throws, would fail the whole gate), the third dropped a real lazy
  // chunk from the measurement, and the fourth truncated a valid specifier.
  it('ignores import-like text inside an ordinary string', () => {
    const source = `const s = "import x from './not-a-module.js'";import{a}from"./real.js"`
    expect(relativeImportsOf(source)).toEqual(['./real.js'])
  })

  it('ignores import-like text inside a template literal', () => {
    expect(relativeImportsOf('const s = `import x from "./tpl-nope.js"`')).toEqual([])
  })

  it('finds a dynamic import written with backticks', () => {
    expect(relativeImportsOf('const lazy = import(`./real-lazy.js`)')).toEqual([
      './real-lazy.js',
    ])
  })

  it('keeps an escaped quote inside a specifier', () => {
    // Names a file with a quote in it, rather than truncating at the backslash.
    expect(relativeImportsOf('import "./quo\\"ted.js"')).toEqual(['./quo"ted.js'])
  })

  it('skips a template specifier it cannot resolve statically', () => {
    expect(relativeImportsOf('const lazy = import(`./${name}.js`)')).toEqual([])
  })

  it('does not treat a .from() method call as an import', () => {
    expect(relativeImportsOf('const rows = table.from("./not-an-import.js")')).toEqual([])
  })

  // A regex literal carrying a quote is routine in minified output - any escaping
  // or replace helper has one. Without regex tokenization the quote opens a
  // string that runs to the next quote in the file, so every specifier after it
  // lands on the wrong side of a quote pair and the whole tail of the chunk
  // graph vanishes from the measurement: the exact under-reporting this gate
  // must never do.
  it('finds imports after a regex containing a double quote', () => {
    const source =
      'const e=s=>s.replace(/"/g,"&quot;");import{a}from"./chunk-A.js";import{b}from"./chunk-B.js";'

    expect(relativeImportsOf(source)).toEqual(['./chunk-A.js', './chunk-B.js'])
  })

  it('finds imports after a regex whose character class holds a quote', () => {
    expect(relativeImportsOf(`const q=/[']/;import{a}from"./chunk-A.js";`)).toEqual([
      './chunk-A.js',
    ])
    expect(relativeImportsOf('const t=/[`]/;import{a}from"./chunk-B.js";')).toEqual([
      './chunk-B.js',
    ])
  })

  it('finds imports after a regex whose class holds an unescaped slash', () => {
    // `/` inside `[...]` does not close the literal, so a naive scan would stop
    // early and read the remainder as code.
    expect(relativeImportsOf('const r=/[/"]/g;import{b}from"./chunk-B.js";')).toEqual([
      './chunk-B.js',
    ])
  })

  it('finds imports after a regex following a keyword', () => {
    expect(
      relativeImportsOf('function f(s){return /"/.test(s)}\nimport{b}from"./chunk-B.js";')
    ).toEqual(['./chunk-B.js'])
  })

  // The mirror risk: reading a division as a regex would swallow everything up
  // to the next `/`, which can just as easily be a real import.
  it('does not mistake division for a regex', () => {
    expect(relativeImportsOf('const x=f(a)/2/3;import{b}from"./b.js";')).toEqual(['./b.js'])
    expect(relativeImportsOf('const y=a[0]/2/3;import{c}from"./c.js";')).toEqual(['./c.js'])
    expect(relativeImportsOf('const z=p/q/r;import{d}from"./d.js";')).toEqual(['./d.js'])
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

  // The regex case at the measurement level, not just the scanner's. This failure
  // is quieter than an unresolvable chunk: nothing throws, because the import is
  // never seen at all - the chunk is simply absent from the total and the gate
  // passes on an understated number. Before regex tokenization this measured 1
  // file and lost the chunk's bytes entirely.
  it('counts a chunk imported after a regex literal containing a quote', () => {
    writeFileSync(path.join(dir, 'chunk.js'), `export const c = "${'x'.repeat(4000)}"\n`)
    writeFileSync(
      path.join(dir, 'index.js'),
      'const esc=s=>s.replace(/"/g,"&quot;");import{c}from"./chunk.js";export{c};'
    )
    writeFileSync(path.join(dir, 'entry-only.js'), 'const esc=s=>s.replace(/"/g,"&quot;");')

    const withChunk = measure(path.join(dir, 'index.js'))

    expect(withChunk.files).toBe(2)
    expect(withChunk.gzipBytes).toBeGreaterThan(measure(path.join(dir, 'entry-only.js')).gzipBytes)
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
