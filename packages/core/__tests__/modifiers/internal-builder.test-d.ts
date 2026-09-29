/**
 * The public builder against the internal one
 *
 * Resolves against `packages/*​/dist/*.d.ts`, so it checks what an installed
 * consumer gets. Run `bun run build` before `bun run test:types`.
 *
 * `addModifier` and `.modifier()` append a modifier instance directly. They
 * are framework seams, so they live on `InternalModifierBuilder` and not on
 * `ModifierBuilder`, where autocomplete would offer them to developers and
 * `addModifier`'s `void` return would end a chain without a type error.
 */

import { describe, expectTypeOf, it } from 'vitest'
import type {
  InternalModifierBuilder,
  Modifier,
  ModifierBuilder,
} from '@tachui/core'
import type {
  InternalModifierBuilder as TypesInternalModifierBuilder,
  ModifierBuilder as TypesModifierBuilder,
} from '@tachui/types'
import { Text } from '@tachui/primitives'

/** Members whose call returns `void`: each one would end a chain. */
type VoidReturningMembers<Builder> = {
  [Key in keyof Builder]: Builder[Key] extends (...args: any[]) => infer Result
    ? [Result] extends [void]
      ? Key
      : never
    : never
}[keyof Builder]

describe('internal modifier builder', () => {
  it('keeps addModifier and modifier() off the public builder', () => {
    expectTypeOf<ModifierBuilder>().not.toHaveProperty('addModifier')
    expectTypeOf<ModifierBuilder>().not.toHaveProperty('modifier')
    expectTypeOf<TypesModifierBuilder>().not.toHaveProperty('addModifier')
    expectTypeOf<TypesModifierBuilder>().not.toHaveProperty('modifier')
  })

  it('declares both on the internal builder', () => {
    expectTypeOf<InternalModifierBuilder>().toHaveProperty('addModifier')
    expectTypeOf<InternalModifierBuilder>().toHaveProperty('modifier')
    expectTypeOf<InternalModifierBuilder['addModifier']>().toEqualTypeOf<
      (modifier: Modifier) => void
    >()
    expectTypeOf<
      ReturnType<InternalModifierBuilder['modifier']>
    >().toEqualTypeOf<InternalModifierBuilder>()
  })

  it('re-exports the internal builder from core unchanged', () => {
    expectTypeOf<InternalModifierBuilder>().toEqualTypeOf<
      TypesInternalModifierBuilder
    >()
  })

  it('extends the public builder', () => {
    expectTypeOf<InternalModifierBuilder>().toMatchTypeOf<ModifierBuilder>()
  })

  it('has no void-returning member on the public builder', () => {
    expectTypeOf<VoidReturningMembers<ModifierBuilder>>().toEqualTypeOf<never>()
    // The check does see one where it exists.
    expectTypeOf<
      VoidReturningMembers<InternalModifierBuilder>
    >().toEqualTypeOf<'addModifier'>()
  })

  it('rejects both on a component chain', () => {
    const modifier = {} as Modifier

    // @ts-expect-error internal: chain the modifier method instead
    Text('x').modifier.modifier(modifier)
    // @ts-expect-error internal: chain the modifier method instead
    Text('x').modifier.addModifier(modifier)
    // @ts-expect-error internal: chain the modifier method instead
    Text('x').addModifier(modifier)

    Text('x').padding(16)
  })
})
