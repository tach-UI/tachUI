/**
 * The modifier builder's type surface
 *
 * Resolves against `packages/*​/dist/*.d.ts`, so it checks what an installed
 * consumer gets. Run `bun run build` before `bun run test:types`.
 *
 * The builder in `@tachui/types` used to end in `[key: string]: any`, so every
 * chain method — a misspelling, a wrong argument, a modifier nobody had
 * typed — resolved to `any` and typechecked. Now a method exists on the type
 * only if core declares it or the package that registers it adds it, derived
 * from the registered factory. The `@ts-expect-error` lines are the point of
 * this file: each one would pass silently under the old signature.
 */

import { describe, expectTypeOf, it } from 'vitest'
import { createSignal } from '@tachui/core'
import { Text, VStack } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'
import '@tachui/modifiers/preload/effects'
import { basicModifierRegistrations } from '@tachui/modifiers'
import type { ModifierBuilder } from '@tachui/modifiers/types'
import { Grid } from '@tachui/grid'
import '@tachui/viewport'
import '@tachui/mobile'
import '@tachui/forms'
import '@tachui/navigation'
import '@tachui/fragments'

describe('modifier builder types', () => {
  it('rejects a method no package registers', () => {
    // @ts-expect-error misspelled
    Text('x').paddin(4)
    // @ts-expect-error misspelled, through the builder
    Text('x').modifier.paddin(4)
  })

  it('checks arguments against the registered factory', () => {
    Text('x').blur(3).role('button').ariaLabel('Close')

    // @ts-expect-error blur takes a number
    Text('x').blur('3px')
    // @ts-expect-error role takes a string
    Text('x').role(1)
  })

  // `.transitions()` was removed: it was registered but discarded its input.
  // The builder at `@tachui/modifiers/types` must not declare it either.
  it('declares transition() and not the removed transitions()', () => {
    const builder = Text('x').modifier as ModifierBuilder

    builder.transition('opacity', 200, 'ease-in')
    // @ts-expect-error transitions() was removed
    builder.transitions({ opacity: 200 })
  })

  it('keeps overloaded factories overloaded', () => {
    const [space] = createSignal(4)

    Text('x').padding(4).padding({ top: 1, leading: 2 }).padding(space)
    Text('x').margin('auto').margin({ vertical: 8 })
    Text('x').backdropFilter('blur(4px)').backdropFilter({ blur: 4 })
  })

  // At runtime a chain on a component returns the component, and a chain on
  // `.modifier` returns the builder. The types say the same.
  it('returns a component from a component chain', () => {
    VStack({ children: [Text('a').padding(4).blur(1).role('note')] })
  })

  it('returns the builder from `.modifier` until build()', () => {
    VStack({ children: [Text('a').modifier.padding(4).build()] })

    // @ts-expect-error the builder is not a component
    VStack({ children: [Text('a').modifier.padding(4)] })
  })

  it('types every basic modifier the package registers', () => {
    type Registered = (typeof basicModifierRegistrations)[number][0]

    expectTypeOf<Exclude<Registered, keyof ModifierBuilder>>().toBeNever()
  })

  it('types the modifiers each other package registers', () => {
    Grid({ children: [Text('header').gridArea('header')] })
    Text('x').onAppear(() => {}).onDisappear(() => {})
    Text('x').refreshable({ onRefresh: async () => {} })
    Text('x').placeholder('Name')
    Text('x').navigationTitle('Home')
    Text('x').interactive()

    // @ts-expect-error onAppear takes a handler
    Text('x').onAppear('now')
  })
})
