/**
 * Animation helper factories for core builder integration.
 */

import { AnimationModifier } from '@tachui/core/modifiers'
import { AnimationModifier as ComposingAnimationModifier } from '../basic/base'
import type { AnimationModifierProps, Modifier } from '@tachui/types/modifiers'
import type { Signal } from '@tachui/types/reactive'

type AnimationConfig = NonNullable<AnimationModifierProps['animation']>

// Built on the modifiers package's own AnimationModifier, which writes the
// value as one part of a composed transform rather than replacing the whole
// property, so it does not erase an offset, scale or rotation.
export function transform(
  value: string | Signal<string>
): Modifier {
  return new ComposingAnimationModifier({ transform: value })
}

export function animation(
  options?: AnimationModifierProps['animation']
): Modifier {
  if (!options) {
    return new AnimationModifier({})
  }
  return new AnimationModifier({ animation: options as AnimationConfig })
}
