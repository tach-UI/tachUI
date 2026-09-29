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
import { basicModifierRegistrations, border, offset } from '@tachui/modifiers'
import type { OffsetOptions } from '@tachui/modifiers'
import type {
  AppearanceModifierProps as ModifiersAppearanceProps,
  LayoutModifierProps as ModifiersLayoutProps,
  ModifierBuilder,
} from '@tachui/modifiers/types'
import type {
  AppearanceModifierProps as TypesAppearanceProps,
  LayoutModifierProps as TypesLayoutProps,
  ModifierBuilder as TypesModifierBuilder,
} from '@tachui/types/modifiers'
import type { AssetValue } from '@tachui/types/assets'
import { Grid } from '@tachui/grid'
import '@tachui/viewport'
import '@tachui/mobile'
import '@tachui/forms'
import '@tachui/navigation'
import '@tachui/fragments'

type TextComponent = ReturnType<typeof Text>

describe('modifier builder types', () => {
  // With a string index signature, `string` is a key of the builder and
  // every name resolves to a method.
  it('declares no string index signature', () => {
    expectTypeOf<string extends keyof TypesModifierBuilder ? true : false>()
      .toEqualTypeOf<false>()
    expectTypeOf<string extends keyof ModifierBuilder ? true : false>()
      .toEqualTypeOf<false>()
    expectTypeOf<string extends keyof TextComponent ? true : false>()
      .toEqualTypeOf<false>()
  })

  // `any` takes every argument, so were the component, the builder or a
  // method `any`, each call this file expects to compile would compile
  // without checking anything.
  it('types the chain rather than falling back to any', () => {
    expectTypeOf(Text('x')).not.toBeAny()
    expectTypeOf(Text('x').modifier).not.toBeAny()

    expectTypeOf(Text('x').blur).not.toBeAny()
    expectTypeOf(Text('x').role).not.toBeAny()
    expectTypeOf(Text('x').overlay).not.toBeAny()
    expectTypeOf(Text('x').modifier.blur).not.toBeAny()
    expectTypeOf(Text('x').modifier.role).not.toBeAny()
    expectTypeOf(Text('x').modifier.overlay).not.toBeAny()

    expectTypeOf<Parameters<TextComponent['blur']>[0]>().not.toBeAny()
    expectTypeOf<Parameters<TextComponent['role']>[0]>().not.toBeAny()
  })

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

  it('takes transition() as arguments or as an object', () => {
    Text('x').transition('opacity', 200).transition({ property: 'opacity', delay: 50 })
  })

  // The basic and effects modifiers both register `transform`, and whichever
  // loads first is what the chain calls. Only a string works in either, so
  // that is what the chain is typed for.
  it('types .transform() for the string form both factories accept', () => {
    Text('x').transform('rotate(4deg)')

    // @ts-expect-error the configuration form is the effects factory's alone
    Text('x').transform({ scale: 2 })
  })

  it('types .asHTML() with its options', () => {
    Text('x').asHTML({ skipSanitizer: false })

    // @ts-expect-error not an asHTML option
    Text('x').asHTML({ sanitize: true })
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

  it('chains .onHover() on `.modifier` with a boolean callback', () => {
    VStack({ children: [
      Text('a')
        .modifier.onHover(hovered => {
          expectTypeOf(hovered).toEqualTypeOf<boolean>()
        })
        .onTap(() => {})
        .build(),
    ] })

    // @ts-expect-error the callback receives a boolean
    Text('x').modifier.onHover((hovered: string) => hovered)
  })

  // `.border(width, color, style)` was typed at no chain position, although
  // the standalone factory declared it.
  it('takes .border() with a style at every chain position', () => {
    const [width] = createSignal(1)
    const [color] = createSignal('blue')

    VStack({ children: [
      Text('a').border(1, 'blue', 'dashed'),
      Text('b').modifier.border(1, 'blue', 'dashed').build(),
      Text('c').modifier.backgroundColor('red').border(1, 'blue', 'dashed').build(),
      Text('d').modifier.css({}).backgroundColor('red').border(1, 'blue', 'dashed').build(),
      Text('e').modifier.padding(4).border(1, 'blue', 'dashed').build(),
      Text('f').modifier.cornerRadius(4).border(1, 'blue', 'dashed').build(),
      Text('g').modifier.border(width, color, 'dotted').build(),
    ] })

    // @ts-expect-error not a border style
    Text('x').modifier.backgroundColor('red').border(1, 'blue', 'wavy')
    // @ts-expect-error not a border style
    Text('x').border(1, 'blue', 'wavy')
  })

  it('keeps the two-argument and options forms of .border()', () => {
    const [color] = createSignal('blue')

    Text('a').border(1, 'blue').border({ width: 1.5, color, style: 'dashed' })
    Text('b').modifier.backgroundColor('red').border(1, 'blue').build()
    Text('c').modifier.border({ width: 1.5, color, style: 'dashed' }).build()
  })

  it('takes the same three arguments on the standalone border factory', () => {
    border(1, 'blue', 'dashed')
    border({ width: 1, color: 'blue', style: 'dashed' })
  })

  // The runtime follows a signal on either axis, and the docs show one, but
  // the factory and the prop shapes were typed for numbers only.
  it('takes numbers or numeric signals for .offset()', () => {
    const [x] = createSignal(14)
    const [y] = createSignal(-2)
    const [label] = createSignal('14')

    VStack({ children: [
      Text('a').offset(x, y),
      Text('b').offset(x, 0),
      Text('c').offset(4, y),
      Text('d').offset(x),
      Text('e').offset(10, 5).offset(20),
    ] })

    offset(x, y)
    offset(x)
    offset(3, y)
    offset(10, 5)

    const options: OffsetOptions = { x, y }
    const numericOptions: OffsetOptions = { x: 1 }
    void [options, numericOptions]

    // `LayoutModifier` no longer takes an offset; `.offset()` is the way.
    // @ts-expect-error LayoutModifierProps declares no offset
    type TypesOffset = TypesLayoutProps['offset']
    // @ts-expect-error LayoutModifierProps declares no offset
    type ModifiersOffset = ModifiersLayoutProps['offset']

    // @ts-expect-error offset takes numbers, not strings
    Text('x').offset('14px', 0)
    // @ts-expect-error offset takes numeric signals only
    Text('x').offset(label)
    // @ts-expect-error offset takes numeric signals only
    offset(1, label)
    // @ts-expect-error offset options take numeric signals only
    const badOptions: OffsetOptions = { x: label }
    // @ts-expect-error the layout props take numeric signals only
    const badProps: TypesLayoutProps['offset'] = { x: '1px' }
    void [badOptions, badProps]
  })

  // CSS takes any number from 1 to 1000 and the factory already did, but the
  // chain and the font options were typed for the named set and the hundreds.
  it('takes any numeric font weight', () => {
    Text('a').fontWeight(590).fontWeight(600).fontWeight('bold').fontWeight('normal')
    Text('b').font({ weight: 590 }).font({ weight: 'bold', size: 12 })

    const typesFont: NonNullable<TypesAppearanceProps['font']> = { weight: 590 }
    const modifiersFont: NonNullable<ModifiersAppearanceProps['font']> = { weight: 590 }
    void [typesFont, modifiersFont]

    // @ts-expect-error not a named weight
    Text('x').fontWeight('heavy')
    // @ts-expect-error not a weight
    Text('x').fontWeight(true)
    // @ts-expect-error not a named weight
    Text('x').font({ weight: 'heavy' })
    // @ts-expect-error not a named weight
    const badFont: NonNullable<ModifiersAppearanceProps['font']> = { weight: 'heavy' }
    void badFont
  })

  // These took `any`: fontFamily and fontStyle from their factories, and
  // scroll from a declaration in `@tachui/types` that shadowed its factory.
  it('types .fontFamily(), .fontStyle() and .scroll() from what they apply', () => {
    const asset = {} as AssetValue

    expectTypeOf<Parameters<TextComponent['fontFamily']>[0]>().not.toBeAny()
    expectTypeOf<Parameters<TextComponent['fontStyle']>[0]>().not.toBeAny()
    expectTypeOf<Parameters<TextComponent['scroll']>[0]>().not.toBeAny()

    Text('a').fontFamily('system-ui, sans-serif').fontFamily(asset)
    Text('b').fontStyle('italic').fontStyle('oblique').fontStyle('normal')
    Text('c').scroll({ behavior: 'smooth', margin: { top: 8 } })
    Text('d').modifier.fontFamily('monospace').fontStyle('italic').build()

    // @ts-expect-error a font family is a string or a font asset
    Text('x').fontFamily(12)
    // @ts-expect-error not a font style
    Text('x').fontStyle('slanted')
    // @ts-expect-error not a scroll behavior
    Text('x').scroll({ behavior: 'instant' })
    // @ts-expect-error scroll takes a configuration
    Text('x').scroll('smooth')
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
