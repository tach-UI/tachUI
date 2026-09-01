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

  // Three shapes that each ended the scan early and dropped every later
  // specifier. None of them throws - the import is simply never seen - so the
  // gate would pass on an understated number, which is the one direction it must
  // never be wrong in.

  it('does not read a keyword used as a member name as a keyword', () => {
    // `.in` is an ordinary property, so the `/` after it divides. Reading `in`
    // as the keyword made the `/` open a regex that closed on the `/` inside
    // "./chunk-A.js", swallowing the specifier.
    expect(relativeImportsOf('const r=o.in/2;import{a}from"./chunk-A.js";')).toEqual([
      './chunk-A.js',
    ])
    expect(relativeImportsOf('const r=o.of/2;import{a}from"./chunk-A.js";')).toEqual([
      './chunk-A.js',
    ])
    expect(relativeImportsOf('const r=o?.return/2;import{a}from"./chunk-A.js";')).toEqual([
      './chunk-A.js',
    ])
  })

  it('reads a regex after a control-statement head, and division elsewhere', () => {
    // `if (…)` is followed by a statement, so `/` opens a regex; `(a+b)` closes a
    // value, so `/` divides. Treating every `)` as a value made the first case
    // read `/"/` as division and open a string on the quote.
    expect(relativeImportsOf('if(x)/"/.test(s);import{a}from"./chunk-A.js";')).toEqual([
      './chunk-A.js',
    ])
    expect(relativeImportsOf('while(x)/"/.test(s);import{a}from"./chunk-A.js";')).toEqual([
      './chunk-A.js',
    ])
    expect(relativeImportsOf('const r=(a+b)/2;import{a}from"./chunk-A.js";')).toEqual([
      './chunk-A.js',
    ])
  })

  it('ends a template interpolation containing an unbalanced brace', () => {
    // Counting raw braces never reached depth 0 when one sat inside a nested
    // regex or string, so the scan consumed the rest of the file.
    expect(
      relativeImportsOf('const s=`${x.replace(/[{]/g,"")}`;import{a}from"./chunk-A.js";')
    ).toEqual(['./chunk-A.js'])
    expect(relativeImportsOf('const s=`${o["{"]}`;import{a}from"./chunk-A.js";')).toEqual([
      './chunk-A.js',
    ])
    expect(
      relativeImportsOf('const s=`${`${o["{"]}`}`;import{a}from"./chunk-A.js";')
    ).toEqual(['./chunk-A.js'])
  })

  it('finds a dynamic import inside a template interpolation', () => {
    // Skipping the interpolation wholesale hid any import within it.
    expect(
      relativeImportsOf('const s=`${import("./lazy.js")}`;import{a}from"./chunk-A.js";')
    ).toEqual(['./lazy.js', './chunk-A.js'])
  })

  it('treats a postfix increment as leaving a value', () => {
    // `i++/2` divides. Reading the `/` as a regex opener consumed the dynamic
    // import that followed, so the chunk was never measured.
    expect(relativeImportsOf('i++/2; import("./chunk.js")')).toEqual(['./chunk.js'])
    expect(relativeImportsOf('i--/2; import("./chunk.js")')).toEqual(['./chunk.js'])
    // Prefix use is unaffected: the operand sets the same state.
    expect(relativeImportsOf('x=++i/2; import("./chunk.js")')).toEqual(['./chunk.js'])
  })

  it('does not treat a member call named import as a dynamic import', () => {
    // The mirror of the .from() case, and the one finding that errs upward: a
    // non-chunk either inflates the budget or fails the run as unresolvable.
    expect(relativeImportsOf('loader.import("./not-a-chunk.js")')).toEqual([])
    expect(relativeImportsOf('loader.import(`./not-a-chunk.js`)')).toEqual([])
    // A real dynamic import still resolves.
    expect(relativeImportsOf('import("./real.js")')).toEqual(['./real.js'])
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

  // Each chunk is served as its own response with its own gzip stream. Gzipping
  // them concatenated lets duplicate text share one dictionary, so a split
  // package measures smaller than it downloads - 8-27% on this repo's own
  // multi-chunk packages, enough for an over-budget package to pass.
  it('gzips each chunk separately rather than concatenated', () => {
    const body = `export const v = "${'ab'.repeat(2000)}"\n`
    writeFileSync(path.join(dir, 'a.js'), body)
    writeFileSync(path.join(dir, 'b.js'), body)
    writeFileSync(path.join(dir, 'index.js'), 'import "./a.js"\nimport "./b.js"\n')

    const result = measure(path.join(dir, 'index.js'))
    const concatenated = gzipSync(
      Buffer.from([body, body, 'import "./a.js"\nimport "./b.js"\n'].join('\n'), 'utf8')
    ).byteLength

    expect(result.files).toBe(3)
    // The two identical chunks compress to ~nothing together and to their real
    // size apart, so the honest measurement is well above the concatenated one.
    expect(result.gzipBytes).toBeGreaterThan(concatenated * 1.5)
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
