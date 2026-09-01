/**
 * Animation helper factories for core builder integration.
 */

import { AnimationModifier } from '@tachui/core/modifiers'
import type { AnimationModifierProps, Modifier } from '@tachui/types/modifiers'
import type { Signal } from '@tachui/types/reactive'

type AnimationConfig = NonNullable<AnimationModifierProps['animation']>

export function transform(
  value: string | Signal<string>
): Modifier {
  return new AnimationModifier({ transform: value })
}

export function animation(
  options?: AnimationModifierProps['animation']
): Modifier {
  if (!options) {
    return new AnimationModifier({})
  }
  return new AnimationModifier({ animation: options as AnimationConfig })
}
