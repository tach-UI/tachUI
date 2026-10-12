import { describe, expect, it } from 'vitest'
import { tachUIImportOptimizer } from '../src/vite-plugin-import-optimizer'

type TransformResult = {
  code: string
  map: { mappings: string; sources: string[]; toString(): string }
} | null

function transform(code: string, id = '/app/tachui-app/src/main.ts'): TransformResult {
  const plugin = tachUIImportOptimizer({ showWarnings: false })
  const hook = plugin.transform as (code: string, id: string) => TransformResult
  return hook.call({}, code, id)
}

describe('tachUIImportOptimizer', () => {
  it('rewrites an import source in place and returns a source map for it', () => {
    const code = [
      "import { createSignal, createEffect } from '@tachui/core'",
      "import { VStack } from '@tachui/primitives'",
      'const [count] = createSignal(0)',
      '',
    ].join('\n')

    const result = transform(code)

    expect(result).not.toBeNull()
    expect(result?.code).toBe(
      [
        "import { createSignal, createEffect } from '@tachui/core/reactive'",
        "import { VStack } from '@tachui/primitives/layout'",
        'const [count] = createSignal(0)',
        '',
      ].join('\n')
    )
    expect(result?.map.sources).toHaveLength(1)
    expect(result?.map.mappings.length).toBeGreaterThan(0)
  })

  it('leaves an import that no narrower entry covers untouched', () => {
    expect(transform("import { mount, createSignal } from '@tachui/core'\n")).toBeNull()
  })

  it('skips files outside a tachui project and dependencies', () => {
    const code = "import { createSignal } from '@tachui/core'\n"

    expect(transform(code, '/app/other/src/main.ts')).toBeNull()
    expect(transform(code, '/app/tachui-app/node_modules/x/index.ts')).toBeNull()
  })
})
