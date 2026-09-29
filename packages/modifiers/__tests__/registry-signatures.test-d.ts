/**
 * Registry modifiers expose their declared signatures
 *
 * Resolves against `packages/*​/dist/*.d.ts`, so it checks what an installed
 * consumer gets. Run `bun run build` before `bun run test:types`.
 *
 * A chain method typed `any` accepts every argument, so each `@ts-expect-error`
 * below would pass vacuously if the method it calls had lost its signature.
 * The `not.toBeAny()` assertions rule that out: they fail first, and say why.
 */

import { describe, expectTypeOf, it } from 'vitest'
import { createSignal } from '@tachui/core'
import { Circle } from '@tachui/primitives/shapes'
import { Text } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'
import type {
  ClipShapeName,
  OverlayAlignment,
  OverlayContent,
} from '@tachui/modifiers'

type TextComponent = ReturnType<typeof Text>

describe('registry modifier signatures', () => {
  it('are declared, not any', () => {
    expectTypeOf(Text('x').overlay).not.toBeAny()
    expectTypeOf(Text('x').padding).not.toBeAny()
    expectTypeOf(Text('x').clipShape).not.toBeAny()

    expectTypeOf(Text('x').modifier.overlay).not.toBeAny()
    expectTypeOf(Text('x').modifier.padding).not.toBeAny()
    expectTypeOf(Text('x').modifier.clipShape).not.toBeAny()
  })

  it('return the component they are chained on', () => {
    expectTypeOf(Text('x').overlay('badge')).toEqualTypeOf<TextComponent>()
    expectTypeOf(Text('x').padding(8)).toEqualTypeOf<TextComponent>()
    expectTypeOf(Text('x').clipShape('circle')).toEqualTypeOf<TextComponent>()
  })

  it('type overlay content as OverlayContent', () => {
    expectTypeOf<
      Parameters<TextComponent['overlay']>[0]
    >().toEqualTypeOf<OverlayContent>()
  })

  it('accept every OverlayContent form', () => {
    const [label] = createSignal<string | number>('new')

    Text('x').overlay(Text('badge'))
    Text('x').overlay(document.createElement('span'))
    Text('x').overlay('badge')
    Text('x').overlay(3)
    Text('x').overlay(label)
    Text('x').overlay(() => Text('badge'))
    Text('x').overlay(() => 'badge')

    const alignment: OverlayAlignment = 'topTrailing'
    Text('x').overlay('badge', alignment)
    Text('x').overlay('badge', { alignment: 'bottom', offset: 4 })
  })

  it('reject overlay content and alignment outside the declared types', () => {
    // @ts-expect-error a boolean is not overlay content
    Text('x').overlay(true)
    // @ts-expect-error a signal of booleans is not overlay content
    Text('x').overlay(createSignal(true)[0])
    // @ts-expect-error not an alignment
    Text('x').overlay('badge', 'middle')
    // @ts-expect-error overlay needs content
    Text('x').overlay()
  })

  it('accept and reject padding arguments by their declared type', () => {
    Text('x').padding(8).padding('1rem')
    Text('x').padding({ top: 4, horizontal: 8 })

    // @ts-expect-error a boolean is not padding
    Text('x').padding(true)
    // @ts-expect-error padding takes one argument
    Text('x').padding(8, 8)
    // @ts-expect-error not a padding edge
    Text('x').padding({ middle: 4 })
  })

  it('accept and reject clipShape arguments by their declared type', () => {
    const name: ClipShapeName = 'ellipse'
    Text('x').clipShape(name).clipShape(Circle())
    Text('x').clipShape('polygon', { points: '0,0 1,1' })

    // @ts-expect-error not a clip shape name
    Text('x').clipShape('hexagon')
    // @ts-expect-error a number is not a shape
    Text('x').clipShape(4)
    // @ts-expect-error clipShape needs a shape
    Text('x').clipShape()
  })
})
