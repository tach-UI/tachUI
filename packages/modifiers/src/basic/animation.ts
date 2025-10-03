/**
 * Animation Modifiers
 *
 * Factory functions for creating animation and transition modifiers
 */

import { AnimationModifier } from './base'
import type { DOMNode } from '@tachui/core/runtime/types'
import type { ModifierContext } from '@tachui/core/modifiers/types'

/**
 * Transition configuration options
 */
export interface TransitionConfig {
  property?: string
  duration?: number
  easing?: string
  delay?: number
}

/**
 * TransitionModifier - Dedicated modifier for CSS transitions
 * Extends AnimationModifier but with specific type for testing/debugging
 */
export class TransitionModifier extends AnimationModifier {
  readonly type = 'transition' as const
}

/**
 * Transition modifier for CSS transitions
 * Supports both object and individual parameter signatures
 *
 * @example
 * ```ts
 * // Object signature
 * div().modifier(transition({ property: 'opacity', duration: 200 }))
 *
 * // Parameter signature
 * div().modifier(transition('all', 300, 'ease-in-out'))
 *
 * // Disable transitions
 * div().modifier(transition('none'))
 * ```
 */
export function transition(options: TransitionConfig): TransitionModifier
export function transition(property: string, duration?: number, easing?: string, delay?: number): TransitionModifier
export function transition(
  optionsOrProperty: TransitionConfig | string,
  duration?: number,
  easing?: string,
  delay?: number
): TransitionModifier {
  // Object signature: transition({ property, duration, easing, delay })
  if (typeof optionsOrProperty === 'object') {
    return new TransitionModifier({ transition: optionsOrProperty })
  }

  // String 'none' to disable transitions
  const property = optionsOrProperty
  if (property === 'none') {
    return new TransitionModifier({
      transition: {
        property: 'none',
        duration: 0,
        easing: 'ease',
        delay: 0,
      },
    })
  }

  // Individual parameters: transition('all', 200, 'ease', 0)
  return new TransitionModifier({
    transition: {
      property,
      duration: duration || 300,
      easing: easing || 'ease',
      delay: delay || 0,
    },
  })
}
