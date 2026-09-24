import { describe, expect, it } from 'vitest'
import {
  definesOwnAliases,
  extractStringFinds,
  extractTachuiImports,
  insertSharedAliases,
  mergesSharedConfig,
  packageCoveredByFinds,
} from '../validate-workspace-aliases'

describe('extractStringFinds', () => {
  it('reads string finds from an array-form alias section', () => {
    const content = `
    alias: [
      { find: '@tachui/core', replacement: resolve(__dirname, 'packages/core/src') },
      { find: "@tachui/ssr/", replacement: resolve(__dirname, 'packages/ssr/src') + '/' },
      { find: '@tachui/modifiers/effects', replacement: resolve(__dirname, 'x') },
    ],
    `

    expect(extractStringFinds(content)).toEqual([
      '@tachui/core',
      '@tachui/ssr/',
      '@tachui/modifiers/effects',
    ])
  })

  it('skips regex finds', () => {
    const content = `
    alias: [
      { find: /^@tachui\\/core$/, replacement: resolve(__dirname, 'x') },
      { find: '@tachui/ssr', replacement: resolve(__dirname, 'y') },
    ],
    `

    expect(extractStringFinds(content)).toEqual(['@tachui/ssr'])
  })
})

describe('packageCoveredByFinds', () => {
  const finds = ['@tachui/core', '@tachui/ssr/', '@tachui/modifiers/effects']

  it('matches exact, trailing-slash, and subpath finds', () => {
    expect(packageCoveredByFinds('@tachui/core', finds)).toBe(true)
    expect(packageCoveredByFinds('@tachui/ssr', finds)).toBe(true)
    expect(packageCoveredByFinds('@tachui/modifiers', finds)).toBe(true)
  })

  it('does not match sibling package names sharing a prefix', () => {
    expect(packageCoveredByFinds('@tachui/coretex', finds)).toBe(false)
    expect(packageCoveredByFinds('@tachui/query', finds)).toBe(false)
  })
})

describe('mergesSharedConfig', () => {
  it('detects mergeConfig(sharedConfig, ...)', () => {
    expect(
      mergesSharedConfig("export default mergeConfig(\n  sharedConfig,\n  defineConfig({})\n)")
    ).toBe(true)
  })

  it('rejects standalone configs', () => {
    expect(mergesSharedConfig('export default defineConfig({})')).toBe(false)
  })
})

describe('definesOwnAliases', () => {
  it('detects object-form and array-form alias sections', () => {
    expect(definesOwnAliases("resolve: { alias: { '@tachui/x': './src' } }")).toBe(true)
    expect(definesOwnAliases('resolve: { alias: [ { find: /x/, replacement: y } ] }')).toBe(true)
  })

  it('rejects a pure merge with no alias section', () => {
    expect(
      definesOwnAliases("export default mergeConfig(sharedConfig, defineConfig({}))")
    ).toBe(false)
  })
})

describe('extractTachuiImports', () => {
  it('collects base package names from single- and double-quoted imports', () => {
    const content = `
      import { h } from '@tachui/core'
      import type { X } from "@tachui/core/reactive"
      import { Button } from '@tachui/primitives/forms'
    `

    expect(extractTachuiImports(content).toSorted()).toEqual([
      '@tachui/core',
      '@tachui/primitives',
    ])
  })

  it('ignores relative and third-party imports', () => {
    const content = `
      import { describe } from 'vitest'
      import { helper } from '../helpers'
    `

    expect(extractTachuiImports(content)).toEqual([])
  })
})

describe('insertSharedAliases', () => {
  const shared = `export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@tachui/core',
        replacement: path.resolve(__dirname, 'packages/core/src'),
      },
    ],
  },
})`

  it('appends entries before the closing bracket, matching style and indent', () => {
    const updated = insertSharedAliases(shared, [
      { find: '@tachui/query', replacementSource: "path.resolve(__dirname, 'packages/query/src')" },
    ])

    expect(updated).toContain(
      "      {\n" +
        "        find: '@tachui/query',\n" +
        "        replacement: path.resolve(__dirname, 'packages/query/src'),\n" +
        '      },\n    ],'
    )
    expect(updated).toContain("find: '@tachui/core'")
  })

  it('ignores brackets inside strings and comments while locating the array', () => {
    const tricky = `export default defineConfig({
  // alias: [ not the section (a comment with [brackets])
  resolve: {
    alias: [
      { find: '@tachui/core', replacement: make('a]b') },
    ],
  },
})`

    const updated = insertSharedAliases(tricky, [
      { find: '@tachui/query', replacementSource: "path.resolve(__dirname, 'q')" },
    ])

    expect(updated.indexOf("find: '@tachui/query'")).toBeGreaterThan(
      updated.indexOf("find: '@tachui/core'")
    )
  })

  it('throws when there is no alias array', () => {
    expect(() => insertSharedAliases('export default defineConfig({})', [])).toThrow(
      /no resolve\.alias array/
    )
  })
})
