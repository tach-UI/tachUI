import { describe, expect, it } from 'vitest'

describe('@tachui/core runtime-safe root entrypoint', () => {
  it('does not expose compiler APIs from the root entrypoint', async () => {
    const core = await import('../../src/index')

    expect(core.createTachUIPlugin).toBeUndefined()
    expect(core.parseSwiftUISyntax).toBeUndefined()
  })

  it('keeps compiler APIs available via explicit compiler subpath', async () => {
    const compiler = await import('../../src/compiler')

    expect(typeof compiler.createTachUIPlugin).toBe('function')
    expect(typeof compiler.parseSwiftUISyntax).toBe('function')
  })

  it('provides temporary compatibility surface via the full entrypoint', async () => {
    const full = await import('../../src/full')

    expect(typeof full.createTachUIPlugin).toBe('function')
    expect(typeof full.parseSwiftUISyntax).toBe('function')
  })
})
