/**
 * The builder's types against its runtime
 *
 * `builder-types.test-d.ts` checks one direction: every registered modifier is
 * typed. This checks the other, which type tests cannot, because they never
 * run: every method core declares on `ModifierBuilder` resolves to something
 * once every package that registers modifiers has loaded, and no leftover
 * "moved to another package" stub on the builder shadows a modifier that is
 * registered — the proxy finds a builder method before it asks the registry,
 * so such a stub throws for a method that is typed and registered.
 *
 * The declared names are read from source, as `transitions-removed.test.ts`
 * does, since the interface has no runtime form.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { globalModifierRegistry } from '@tachui/registry'
import { ModifierBuilderImpl } from '@tachui/core/modifiers'
import { Text } from '@tachui/primitives'
import '../src/preload/basic'
import '../src/preload/effects'
import '@tachui/viewport'
import '@tachui/mobile'
import '@tachui/forms'
import '@tachui/grid'
import '@tachui/responsive'
import '@tachui/navigation'
import '../../fragments/src'

const read = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

function interfaceBody(source: string, name: string): string {
  const start = source.indexOf(`export interface ${name}<`)
  let index = source.indexOf('{', start)
  let depth = 0
  const bodyStart = index
  for (; index < source.length; index++) {
    if (source[index] === '{') depth++
    if (source[index] === '}' && --depth === 0) break
  }
  return source.slice(bodyStart, index)
}

const declared = [
  ...new Set(
    interfaceBody(
      read('../../types/src/modifiers.ts'),
      'ModifierBuilderBase'
    ).match(/^ {2}([a-zA-Z]\w*)\s*[(<]/gm) ?? []
  ),
].map(line => line.trim().replace(/\s*[(<]$/, ''))

// Builder methods whose whole body is a throw pointing somewhere else.
const movedStubs = [
  ...read('../../core/src/modifiers/builder.ts').matchAll(
    /^ {2}([a-zA-Z]\w*)\([^)]*\)[^{]*\{\s*throw new Error\(/gm
  ),
].map(match => match[1])

const resolves = (name: string) =>
  name in ModifierBuilderImpl.prototype || globalModifierRegistry.has(name)

describe('modifier builder runtime parity', () => {
  it('reads the declared methods and the stubs', () => {
    expect(declared.length).toBeGreaterThan(50)
    expect(declared).toContain('frame')
    expect(movedStubs.length).toBeGreaterThan(0)
  })

  it('resolves every method core declares', () => {
    expect(declared.filter(name => !resolves(name))).toEqual([])
  })

  it('has no stub shadowing a registered modifier', () => {
    expect(
      movedStubs.filter(name => globalModifierRegistry.has(name))
    ).toEqual([])
  })

  // These six were typed and registered, but a stub of the same name on the
  // builder threw "moved to …" first, on a component chain and on `.modifier`.
  it.each([
    ['onAppear', [() => {}]],
    ['onDisappear', [() => {}]],
    ['refreshable', [{ onRefresh: async () => {} }]],
    ['customProperty', ['accent', 'red']],
    ['customProperties', [{ properties: { accent: 'red' } }]],
    ['cssVariables', [{ accent: 'red' }]],
  ])('chains .%s() through the registry', (name, args) => {
    const component = Text('x') as any

    expect(component[name](...args)).toBe(component)
    expect(component.build().modifiers).toHaveLength(1)
    expect(
      (Text('y') as any).modifier[name](...args).build().modifiers
    ).toHaveLength(1)
  })
})
