/**
 * `.css()`: public type surface
 *
 * Resolves against `packages/*​/dist/*.d.ts`, so it checks what an installed
 * consumer gets. Run `bun run build` before `bun run test:types`.
 *
 * The `ModifierBuilder` published at `@tachui/modifiers/types` typed `.css()`
 * as `string | number | undefined` per value, while the `CSSStyleProperties`
 * interface beside it, and every typed modifier, took a `Signal` too — so the
 * one place without a typed alternative rejected reactive values. The
 * `@ts-expect-error` lines keep this from passing vacuously: the builder in
 * `@tachui/types` has a `[key: string]: any` fallback, so a looser import
 * here would accept anything.
 */

import { describe, expectTypeOf, it } from 'vitest'
import { createMemo, createSignal } from '@tachui/core'
import type { ModifierBuilder } from '@tachui/modifiers/types'
import { cssVendor } from '@tachui/modifiers/utility'

declare const builder: ModifierBuilder

describe('css() type surface', () => {
  const [dark] = createSignal(false)
  const background = createMemo(() => (dark() ? 'black' : 'white'))
  const [opacity] = createSignal(0.5)

  it('takes signal values beside static ones', () => {
    expectTypeOf(
      builder.css({ background, opacity, cursor: 'pointer', zIndex: 2 })
    ).not.toBeNever()
    expectTypeOf(builder.cssProperty('outline', background)).not.toBeNever()
    expectTypeOf(builder.cssVariable('accent', background)).not.toBeNever()
  })

  // A signal that switches between a number and a string, such as `16` and
  // `'1rem'`, is neither `Signal<string>` nor `Signal<number>`.
  it('takes a signal of a number or a string', () => {
    const [size] = createSignal<string | number>(16)

    expectTypeOf(builder.css({ width: size })).not.toBeNever()
    expectTypeOf(builder.cssProperty('width', size)).not.toBeNever()
    expectTypeOf(builder.cssVariable('gap', size)).not.toBeNever()
    expectTypeOf(cssVendor('webkit', 'line-clamp', size)).not.toBeNever()
  })

  // A signal that can be empty clears the property when it is, so it has to
  // be accepted without a cast.
  it('takes a signal that can be empty', () => {
    const [token] = createSignal<string | undefined>('red')
    const [size] = createSignal<number | null>(null)

    expectTypeOf(builder.css({ color: token, width: size })).not.toBeNever()
    expectTypeOf(builder.cssProperty('color', token)).not.toBeNever()
    expectTypeOf(builder.cssVariable('accent', token)).not.toBeNever()
  })

  it('still rejects a value that is not CSS', () => {
    // @ts-expect-error a boolean is not a CSS value
    builder.css({ display: true })
    // @ts-expect-error nor is a signal of one
    builder.cssProperty('display', dark)
  })
})
