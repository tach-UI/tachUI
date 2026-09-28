/**
 * `@tachui/modifiers/base` and the package root publish core's classes
 *
 * Both entries re-export `BaseModifier`, `AnimationModifier` and
 * `LifecycleModifier` from `@tachui/core/modifiers/base`, so their declared
 * types are core's own, not structurally similar copies.
 */

import { describe, expectTypeOf, it } from 'vitest'
import type {
  AnimationModifier as CoreAnimationModifier,
  BaseModifier as CoreBaseModifier,
  LifecycleModifier as CoreLifecycleModifier,
} from '@tachui/core/modifiers/base'
import type {
  AnimationModifier as SubpathAnimationModifier,
  AppearanceModifier as SubpathAppearanceModifier,
  BaseModifier as SubpathBaseModifier,
  InteractionModifier as SubpathInteractionModifier,
  LayoutModifier as SubpathLayoutModifier,
  LifecycleModifier as SubpathLifecycleModifier,
} from '@tachui/modifiers/base'
import type {
  AnimationModifier as RootAnimationModifier,
  AppearanceModifier as RootAppearanceModifier,
  BaseModifier as RootBaseModifier,
  InteractionModifier as RootInteractionModifier,
  LayoutModifier as RootLayoutModifier,
  LifecycleModifier as RootLifecycleModifier,
  TransitionModifier,
} from '@tachui/modifiers'

describe('base class re-exports', () => {
  it('publishes core classes from the base subpath', () => {
    expectTypeOf<SubpathAnimationModifier>().toEqualTypeOf<CoreAnimationModifier>()
    expectTypeOf<SubpathBaseModifier>().toEqualTypeOf<CoreBaseModifier>()
    expectTypeOf<SubpathLifecycleModifier>().toEqualTypeOf<CoreLifecycleModifier>()
  })

  it('publishes core classes from the package root', () => {
    expectTypeOf<RootAnimationModifier>().toEqualTypeOf<CoreAnimationModifier>()
    expectTypeOf<RootBaseModifier>().toEqualTypeOf<CoreBaseModifier>()
    expectTypeOf<RootLifecycleModifier>().toEqualTypeOf<CoreLifecycleModifier>()
  })

  it('keeps the layout, appearance and interaction classes on core BaseModifier', () => {
    expectTypeOf<SubpathLayoutModifier>().toMatchTypeOf<CoreBaseModifier>()
    expectTypeOf<SubpathAppearanceModifier>().toMatchTypeOf<CoreBaseModifier>()
    expectTypeOf<SubpathInteractionModifier>().toMatchTypeOf<CoreBaseModifier>()
    expectTypeOf<RootLayoutModifier>().toMatchTypeOf<CoreBaseModifier>()
    expectTypeOf<RootAppearanceModifier>().toMatchTypeOf<CoreBaseModifier>()
    expectTypeOf<RootInteractionModifier>().toMatchTypeOf<CoreBaseModifier>()
  })

  it('types AnimationModifier as animation or transition', () => {
    expectTypeOf<CoreAnimationModifier['type']>().toEqualTypeOf<
      'animation' | 'transition'
    >()
    expectTypeOf<TransitionModifier['type']>().toEqualTypeOf<'transition'>()
    expectTypeOf<TransitionModifier>().toMatchTypeOf<CoreAnimationModifier>()
  })
})
