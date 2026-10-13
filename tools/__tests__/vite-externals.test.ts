import { describe, expect, it } from 'vitest'

import coreConfig from '../../packages/core/vite.config'
import flowControlConfig from '../../packages/flow-control/vite.config'
import primitivesConfig from '../../packages/primitives/vite.config'

type ExternalPredicate = (id: string) => boolean

function externalOf(config: unknown): ExternalPredicate {
  const resolved =
    typeof config === 'function'
      ? config({ mode: 'production', command: 'build' })
      : config
  const external = resolved.build?.rollupOptions?.external

  expect(typeof external).toBe('function')
  return external as ExternalPredicate
}

// A checkout whose path happens to contain the word "typescript" must still
// bundle its own sources.
const sourceUnderTypescriptPath =
  '/home/dev/typescript-projects/tachUI/packages/core/src/runtime/component.ts'

describe.each([
  ['@tachui/core', coreConfig],
  ['@tachui/flow-control', flowControlConfig],
  ['@tachui/primitives', primitivesConfig],
])('%s vite externals', (_name, config) => {
  const external = externalOf(config)

  it('externalizes the typescript package and its subpaths', () => {
    expect(external('typescript')).toBe(true)
    expect(external('typescript/lib/typescript.js')).toBe(true)
  })

  it('bundles sources whose path merely contains "typescript"', () => {
    expect(external(sourceUnderTypescriptPath)).toBe(false)
  })

  it('externalizes @tachui packages', () => {
    expect(external('@tachui/types')).toBe(true)
  })
})
