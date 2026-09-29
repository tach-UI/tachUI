/**
 * Direct chaining types, without `.modifier`
 *
 * Resolves against `packages/*​/dist/*.d.ts`. Run `bun run build` before
 * `bun run test:types`.
 *
 * `BasicInput`, `Toggle`, `Divider`, `Picker`, `BasicForm` and their helper
 * variants returned the component plus a `.modifier` property, with no builder
 * methods on the component itself, so every direct chain failed with TS2339.
 * They return the full builder shape now, and every component takes the
 * registered factories by name and any factory's instance through
 * `.applyModifier()`.
 */

import { describe, expectTypeOf, it } from 'vitest'
import { createSignal } from '@tachui/core'
import type { Modifier, ModifiableComponentWithModifiers } from '@tachui/core'
import {
  BasicForm,
  BasicInput,
  Divider,
  DividerUtils,
  ImageUtils,
  Picker,
  PickerStyles,
  Text,
  Toggle,
  ToggleStyles,
  ToggleWithLabel,
  VStack,
} from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'
import { onHover } from '@tachui/modifiers'

declare const glow: (color: string) => Modifier

const [text, setText] = createSignal('')
const [selection] = createSignal('a')
const options = [{ value: 'a', label: 'A' }]

describe('direct chaining types', () => {
  it('chains .css() on BasicInput', () => {
    VStack({ children: [
      BasicInput({ text, setText, inputType: 'text' }).css({ display: 'block' }).build(),
    ] })
  })

  it('returns the builder shape from the previously narrow components', () => {
    expectTypeOf(BasicInput({ text })).toMatchTypeOf<ModifiableComponentWithModifiers>()
    expectTypeOf(BasicForm([])).toMatchTypeOf<ModifiableComponentWithModifiers>()
    expectTypeOf(Toggle(false)).toMatchTypeOf<ModifiableComponentWithModifiers>()
    expectTypeOf(ToggleWithLabel('x', false)).toMatchTypeOf<ModifiableComponentWithModifiers>()
    expectTypeOf(ToggleStyles.Switch(false)).toMatchTypeOf<ModifiableComponentWithModifiers>()
    expectTypeOf(Divider()).toMatchTypeOf<ModifiableComponentWithModifiers>()
    expectTypeOf(DividerUtils.dashed()).toMatchTypeOf<ModifiableComponentWithModifiers>()
    expectTypeOf(Picker(selection, options)).toMatchTypeOf<ModifiableComponentWithModifiers>()
    expectTypeOf(PickerStyles.Menu(selection, options)).toMatchTypeOf<ModifiableComponentWithModifiers>()
    expectTypeOf(ImageUtils.progressive('/a', '/b')).toMatchTypeOf<ModifiableComponentWithModifiers>()
  })

  it('chains built-ins directly on each of them', () => {
    VStack({ children: [
      BasicForm([]).padding(4),
      Toggle(false).padding(4).foregroundColor('red'),
      ToggleWithLabel('Wi-Fi', false).padding(4),
      ToggleStyles.Checkbox(true).opacity(0.5),
      Divider().padding(4),
      DividerUtils.vertical(20).margin(2),
      DividerUtils.thin().opacity(0.5),
      Picker(selection, options).padding(4),
      PickerStyles.Segmented(selection, options).cornerRadius(4),
      ImageUtils.withPlaceholder('/a', '/b').scaledToFit().padding(4),
    ] })
  })

  it('chains the representative factories by name', () => {
    VStack({ children: [
      VStack({ children: [], spacing: 0 })
        .onHover(hovered => {
          expectTypeOf(hovered).toEqualTypeOf<boolean>()
        })
        .aria({ label: 'Close', expanded: true })
        .ariaLabel('Close')
        .task(async () => {})
        .cssVariables({ accent: 'red' }),
      Toggle(false).onHover(() => {}).ariaLabel('x').task(() => {}).cssVariables({ a: 1 }),
      Divider().aria({ hidden: true }).cssVariables({ a: 1 }),
    ] })

    // @ts-expect-error the callback receives a boolean
    Text('x').onHover((hovered: string) => hovered)
    // @ts-expect-error ariaLabel takes a string
    Text('x').ariaLabel(1)
  })

  it('applies any factory instance through .applyModifier()', () => {
    VStack({ children: [
      Text('a').applyModifier(glow('gold')).padding(2),
      BasicInput({ text }).applyModifier(onHover(() => {})),
      Toggle(false).applyModifier(glow('gold')),
      Divider().applyModifier(glow('gold')),
      Picker(selection, options).applyModifier(glow('gold')),
      Text('b').modifier.applyModifier(glow('gold')).build(),
    ] })

    // @ts-expect-error takes a modifier instance, not a factory
    Text('x').applyModifier(glow)
    // @ts-expect-error `.modifier` is the builder, not a function
    Text('x').modifier(glow('gold'))
  })
})
