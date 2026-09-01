/**
 * Tests for the bundle size budget gate.
 *
 * This tool is the sole enforcement of issue #276's acceptance criterion 2, so
 * the cases that matter are the ones where it could report a pass it has not
 * earned - anything that drops a chunk from the total without raising.
 *
 * The chunk graph comes from the Vite manifest rather than from parsing emitted
 * JavaScript, so these fixtures write a manifest of the shape Vite produces:
 * records keyed by source path for entries and by `_<chunk>.js` for shared
 * chunks, each carrying a `file` plus optional `imports`/`dynamicImports` that
 * reference *other keys*, not filenames.
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  chunkFilesFor,
  collectBudgetedPackages,
  findManifest,
  measure,
} from '../check-size-budget.mjs'

describe('chunkFilesFor', () => {
  it('returns just the entry when it pulls in nothing', () => {
    const manifest = {
      'src/index.ts': { file: 'index.js', isEntry: true },
    }

    expect(chunkFilesFor(manifest, 'index.js')).toEqual(['index.js'])
  })

  it('follows static imports', () => {
    const manifest = {
      'src/index.ts': { file: 'index.js', isEntry: true, imports: ['_shared.js'] },
      '_shared.js': { file: 'shared-abc.js' },
    }

    expect(chunkFilesFor(manifest, 'index.js')).toEqual(['index.js', 'shared-abc.js'])
  })

  it('follows dynamic imports, which ship and download just the same', () => {
    const manifest = {
      'src/index.ts': { file: 'index.js', isEntry: true, dynamicImports: ['_lazy.js'] },
      '_lazy.js': { file: 'lazy-abc.js' },
    }

    expect(chunkFilesFor(manifest, 'index.js')).toEqual(['index.js', 'lazy-abc.js'])
  })

  it('counts a chunk reached by two paths only once', () => {
    const manifest = {
      'src/index.ts': { file: 'index.js', isEntry: true, imports: ['_a.js', '_b.js'] },
      '_a.js': { file: 'a.js', imports: ['_shared.js'] },
      '_b.js': { file: 'b.js', imports: ['_shared.js'] },
      '_shared.js': { file: 'shared.js' },
    }

    expect(chunkFilesFor(manifest, 'index.js')).toEqual([
      'index.js',
      'a.js',
      'b.js',
      'shared.js',
    ])
  })

  it('measures only the requested entry, not every entry in the manifest', () => {
    // A multi-entry package - core declares about fourteen - must not have one
    // entry's budget charged for another's chunks.
    const manifest = {
      'src/index.ts': { file: 'index.js', isEntry: true, imports: ['_shared.js'] },
      'src/other.ts': { file: 'other.js', isEntry: true, imports: ['_only-other.js'] },
      '_shared.js': { file: 'shared.js' },
      '_only-other.js': { file: 'only-other.js' },
    }

    expect(chunkFilesFor(manifest, 'index.js')).toEqual(['index.js', 'shared.js'])
  })

  it('counts extracted CSS, which downloads with the chunk that owns it', () => {
    const manifest = {
      'src/index.ts': { file: 'index.js', isEntry: true, css: ['style.css'] },
    }

    expect(chunkFilesFor(manifest, 'index.js')).toEqual(['index.js', 'style.css'])
  })

  it('counts CSS owned by a chunk further down the graph', () => {
    const manifest = {
      'src/index.ts': { file: 'index.js', isEntry: true, imports: ['_c.js'] },
      '_c.js': { file: 'c.js', css: ['nested.css'] },
    }

    expect(chunkFilesFor(manifest, 'index.js')).toEqual(['index.js', 'c.js', 'nested.css'])
  })

  it('counts a stylesheet shared by several chunks once', () => {
    // One stylesheet is commonly referenced by every chunk that uses it; the
    // consumer downloads it once and should be charged for it once.
    const manifest = {
      'src/index.ts': { file: 'index.js', isEntry: true, imports: ['_a.js', '_b.js'] },
      '_a.js': { file: 'a.js', css: ['shared.css'] },
      '_b.js': { file: 'b.js', css: ['shared.css'] },
    }

    expect(chunkFilesFor(manifest, 'index.js')).toEqual([
      'index.js',
      'a.js',
      'shared.css',
      'b.js',
    ])
  })

  it('leaves assets out, deliberately', () => {
    // Assets are referenced by URL and fetched on demand rather than pulled in by
    // loading the chunk, and they are already-compressed binaries whose gzipped
    // size would inflate the number without making it truer. Asserted so the
    // exclusion stays a decision rather than drifting into an oversight.
    const manifest = {
      'src/index.ts': { file: 'index.js', isEntry: true, assets: ['font.woff2'] },
    }

    expect(chunkFilesFor(manifest, 'index.js')).toEqual(['index.js'])
  })

  it('throws when the manifest references a key it does not define', () => {
    // Skipping it would quietly shrink the measurement.
    const manifest = {
      'src/index.ts': { file: 'index.js', isEntry: true, imports: ['_missing.js'] },
    }

    expect(() => chunkFilesFor(manifest, 'index.js')).toThrow(/does not define it/)
  })

  it('throws when no record matches the entry file', () => {
    const manifest = { 'src/index.ts': { file: 'index.js', isEntry: true } }

    expect(() => chunkFilesFor(manifest, 'nope.js')).toThrow(/no record whose "file"/)
  })
})

describe('findManifest', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'size-budget-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('finds the manifest beside the entry', () => {
    mkdirSync(path.join(dir, 'dist', '.vite'), { recursive: true })
    writeFileSync(
      path.join(dir, 'dist', '.vite', 'manifest.json'),
      JSON.stringify({ 'src/index.ts': { file: 'index.js', isEntry: true } })
    )
    writeFileSync(path.join(dir, 'dist', 'index.js'), 'export const a = 1\n')

    const found = findManifest(path.join(dir, 'dist', 'index.js'), dir)

    expect(found.outDir).toBe(path.join(dir, 'dist'))
    expect(found.manifest['src/index.ts'].file).toBe('index.js')
  })

  it('explains how to turn the manifest on when it is absent', () => {
    // The likely first encounter is a package that adopted a budget but not
    // `manifest: true`, so the error has to name the fix.
    mkdirSync(path.join(dir, 'dist'), { recursive: true })
    writeFileSync(path.join(dir, 'dist', 'index.js'), 'export const a = 1\n')

    expect(() => findManifest(path.join(dir, 'dist', 'index.js'), dir)).toThrow(
      /manifest: true/
    )
  })
})

describe('measure', () => {
  let dir: string

  const writeManifest = (manifest: unknown) => {
    mkdirSync(path.join(dir, 'dist', '.vite'), { recursive: true })
    writeFileSync(
      path.join(dir, 'dist', '.vite', 'manifest.json'),
      JSON.stringify(manifest)
    )
  }

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'size-budget-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('counts the entry and every chunk it reaches', () => {
    writeManifest({
      'src/index.ts': { file: 'index.js', isEntry: true, imports: ['_chunk.js'] },
      '_chunk.js': { file: 'chunk.js' },
    })
    writeFileSync(path.join(dir, 'dist', 'index.js'), 'import "./chunk.js"\n')
    writeFileSync(path.join(dir, 'dist', 'chunk.js'), `export const c = "${'x'.repeat(500)}"\n`)

    const result = measure(path.join(dir, 'dist', 'index.js'), dir)

    expect(result.files).toBe(2)
    expect(result.gzipBytes).toBeGreaterThan(0)
  })

  it('gzips each chunk separately rather than concatenated', () => {
    // Each chunk is served as its own response with its own gzip stream.
    // Gzipping them concatenated lets duplicate text share one dictionary, so a
    // split package measures smaller than it downloads - 8-27% on this repo's
    // own multi-chunk packages, enough for an over-budget package to pass.
    const body = `export const v = "${'ab'.repeat(2000)}"\n`
    writeManifest({
      'src/index.ts': { file: 'index.js', isEntry: true, imports: ['_a.js', '_b.js'] },
      '_a.js': { file: 'a.js' },
      '_b.js': { file: 'b.js' },
    })
    writeFileSync(path.join(dir, 'dist', 'index.js'), 'import "./a.js"\nimport "./b.js"\n')
    writeFileSync(path.join(dir, 'dist', 'a.js'), body)
    writeFileSync(path.join(dir, 'dist', 'b.js'), body)

    const result = measure(path.join(dir, 'dist', 'index.js'), dir)
    const concatenated = gzipSync(
      Buffer.from([body, body, 'import "./a.js"\nimport "./b.js"\n'].join('\n'), 'utf8')
    ).byteLength

    expect(result.files).toBe(3)
    // The two identical chunks compress to ~nothing together and to their real
    // size apart, so the honest measurement is well above the concatenated one.
    expect(result.gzipBytes).toBeGreaterThan(concatenated * 1.5)
  })

  it('adds extracted CSS bytes to the total', () => {
    const css = `.a{color:red}\n${'/* pad */\n'.repeat(400)}`
    writeManifest({
      'src/index.ts': { file: 'index.js', isEntry: true, css: ['style.css'] },
    })
    writeFileSync(path.join(dir, 'dist', 'index.js'), 'export const a = 1\n')
    writeFileSync(path.join(dir, 'dist', 'style.css'), css)

    const withCss = measure(path.join(dir, 'dist', 'index.js'), dir)
    const jsOnly = gzipSync(Buffer.from('export const a = 1\n', 'utf8')).byteLength

    expect(withCss.files).toBe(2)
    expect(withCss.gzipBytes).toBeGreaterThan(jsOnly)
  })

  it('throws rather than silently shrinking when a listed chunk is missing', () => {
    writeManifest({
      'src/index.ts': { file: 'index.js', isEntry: true, imports: ['_gone.js'] },
      '_gone.js': { file: 'gone.js' },
    })
    writeFileSync(path.join(dir, 'dist', 'index.js'), 'import "./gone.js"\n')

    expect(() => measure(path.join(dir, 'dist', 'index.js'), dir)).toThrow(
      /does not exist under/
    )
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
