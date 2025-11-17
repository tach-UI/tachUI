/**
 * Animation helper factories for core builder integration.
 */

import { AnimationModifier } from '@tachui/core/modifiers'
import type { AnimationModifierProps, Modifier } from '@tachui/core/modifiers/types'
import type { Signal } from '@tachui/core/reactive/types'

type TransitionConfig = NonNullable<AnimationModifierProps['transition']>
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

export function transitions(
  config: TransitionConfig | Record<string, any>
): Modifier {
  // Preserve existing behavior where arbitrary config objects were stored
  // on a `transitions` property even though AnimationModifier ignores it.
  // Future refactors can map this shape to the concrete transition support.
  return new AnimationModifier({ transitions: config })
}
