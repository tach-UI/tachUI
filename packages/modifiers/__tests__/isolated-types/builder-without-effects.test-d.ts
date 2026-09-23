/**
 * The builder's types without the effects preload
 *
 * The effect modifiers (`shadow`, `backdropFilter` and the rest) are
 * registered by `@tachui/modifiers/preload/effects`, which nothing imports for
 * you. They used to be declared on the builder regardless, so a call
 * typechecked and then failed at runtime. Now the preload adds them to the
 * builder's type itself, so without that import they are not declared.
 *
 * That augmentation applies to the whole program once any file imports the
 * preload, and `builder-types.test-d.ts` does. So this file is compiled on its
 * own, as the `isolated` project in `vitest.typecheck.config.ts`, where nothing
 * imports it. Resolves against `dist`, like the other type tests.
 */

import { describe, it } from 'vitest'
import { Text, VStack } from '@tachui/primitives'
import '@tachui/modifiers'

describe('modifier builder types without the effects preload', () => {
  it('does not declare the effect modifiers', () => {
    // @ts-expect-error shadow is registered by the effects preload
    VStack({ children: [] }).modifier.shadow({ x: 0, y: 6, blur: 18, color: 'red' })
    // @ts-expect-error shadow is registered by the effects preload
    Text('x').shadow({ x: 0, y: 6, blur: 18, color: 'red' })
    // @ts-expect-error backdropFilter is registered by the effects preload
    Text('x').modifier.backdropFilter('blur(20px)')
    // @ts-expect-error textShadow is registered by the effects preload
    Text('x').textShadow({ x: 1, y: 1, blur: 2, color: 'red' })
  })

  it('declares the basic modifiers', () => {
    Text('x').padding(4).margin('0 auto').modifier.margin({ top: 4 }).build()
  })
})
