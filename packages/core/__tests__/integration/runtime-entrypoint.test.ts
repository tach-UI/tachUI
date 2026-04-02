import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('@tachui/core runtime-safe root entrypoint', () => {
  it('does not expose compiler APIs from the root entrypoint', async () => {
    const core = await import('../../src/index')

    expect(core.parseAdvancedSwiftUISyntax).toBeUndefined()
    expect(core.generateDOMCode).toBeUndefined()
    expect(core.generateEnhancedDOMCode).toBeUndefined()
    expect(core.createTachUIPlugin).toBeUndefined()
    expect(core.parseSwiftUISyntax).toBeUndefined()
  })

  it('keeps compiler APIs available via explicit compiler subpath', async () => {
    const compiler = await import('../../src/compiler')

    expect(typeof compiler.parseAdvancedSwiftUISyntax).toBe('function')
    expect(typeof compiler.generateDOMCode).toBe('function')
    expect(typeof compiler.generateEnhancedDOMCode).toBe('function')
    expect(typeof compiler.createTachUIPlugin).toBe('function')
    expect(typeof compiler.parseSwiftUISyntax).toBe('function')
  })

  it('provides temporary compatibility surface via the full entrypoint', async () => {
    const full = await import('../../src/full')

    expect(typeof full.parseAdvancedSwiftUISyntax).toBe('function')
    expect(typeof full.generateDOMCode).toBe('function')
    expect(typeof full.generateEnhancedDOMCode).toBe('function')
    expect(typeof full.createTachUIPlugin).toBe('function')
    expect(typeof full.parseSwiftUISyntax).toBe('function')
  })

  it('keeps compiler code out of the built root bundle artifact', () => {
    const distRootPath = resolve(import.meta.dirname, '../../dist/index.js')
    const distCompilerPath = resolve(
      import.meta.dirname,
      '../../dist/compiler/index.js',
    )

    if (!existsSync(distRootPath) || !existsSync(distCompilerPath)) {
      return
    }

    const rootBundle = readFileSync(distRootPath, 'utf8')
    const compilerBundle = readFileSync(distCompilerPath, 'utf8')

    expect(compilerBundle).toContain('createTachUIPlugin')
    expect(rootBundle).not.toContain('createTachUIPlugin')
    expect(rootBundle).not.toContain('parseAdvancedSwiftUISyntax')
    expect(rootBundle).not.toContain('generateDOMCode')
    expect(rootBundle).not.toContain('generateEnhancedDOMCode')
  })
})
