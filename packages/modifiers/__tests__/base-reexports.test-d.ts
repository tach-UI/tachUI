/**
 * `@tachui/modifiers/base` and the package root publish core's classes
 *
 * Both entries re-export `BaseModifier`, `AnimationModifier`,
 * `LifecycleModifier` and `LayoutModifier` from `@tachui/core/modifiers/base`,
 * so their declared types are core's own, not structurally similar copies.
 */

import { describe, expectTypeOf, it } from 'vitest'
import type {
  AnimationModifier as CoreAnimationModifier,
  AppearanceModifier as CoreAppearanceModifier,
  BaseModifier as CoreBaseModifier,
  LayoutModifier as CoreLayoutModifier,
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

  it('publishes core LayoutModifier from both entries', () => {
    expectTypeOf<SubpathLayoutModifier>().toEqualTypeOf<CoreLayoutModifier>()
    expectTypeOf<RootLayoutModifier>().toEqualTypeOf<CoreLayoutModifier>()
  })

  it('builds AppearanceModifier on core AppearanceModifier', () => {
    expectTypeOf<SubpathAppearanceModifier>().toEqualTypeOf<RootAppearanceModifier>()
    expectTypeOf<SubpathAppearanceModifier>().toMatchTypeOf<CoreAppearanceModifier>()
  })

  it('keeps the interaction class on core BaseModifier', () => {
    expectTypeOf<SubpathInteractionModifier>().toMatchTypeOf<CoreBaseModifier>()
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
