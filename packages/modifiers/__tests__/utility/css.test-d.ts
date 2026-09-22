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

  it('still rejects a value that is not CSS', () => {
    // @ts-expect-error a boolean is not a CSS value
    builder.css({ display: true })
    // @ts-expect-error nor is a signal of one
    builder.cssProperty('display', dark)
  })
})
