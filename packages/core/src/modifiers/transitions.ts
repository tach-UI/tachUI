/**
 * Transition Modifiers - CSS transition system
 *
 * Provides comprehensive CSS transition capabilities with support for
 * individual property transitions and complex multi-property animations.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'

export interface TransitionConfig {
  property?: string
  duration?: number
  easing?: string
  delay?: number
}

export interface TransitionsConfig {
  [property: string]: TransitionConfig
}

export interface ModifierTransitionOptions {
  transition?: string
  transitions?: TransitionsConfig
}

export type ReactiveTransitionOptions =
  ReactiveModifierProps<ModifierTransitionOptions>

export class TransitionModifier extends BaseModifier<ModifierTransitionOptions> {
  readonly type = 'transition'
  readonly priority = 25

  constructor(options: ReactiveTransitionOptions) {
    const resolvedOptions: ModifierTransitionOptions = {}
    for (const [key, value] of Object.entries(options)) {
      if (typeof value === 'function' && 'peek' in value) {
        ;(resolvedOptions as any)[key] = (value as any).peek()
      } else {
        ;(resolvedOptions as any)[key] = value
      }
    }
    super(resolvedOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeTransitionStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeTransitionStyles(props: ModifierTransitionOptions) {
    const styles: Record<string, string> = {}

    if (props.transition) {
      styles.transition = props.transition
    }

    if (props.transitions) {
      const transitionValue = this.generateTransitionsCSS(props.transitions)
      styles.transition = transitionValue
    }

    return styles
  }

  private generateTransitionsCSS(config: TransitionsConfig): string {
    return Object.entries(config)
      .map(([property, settings]) => {
        const prop = this.toCSSProperty(property)
        const duration = settings.duration || 300
        const easing = settings.easing || 'ease'
        const delay = settings.delay || 0

        return `${prop} ${duration}ms ${easing}${delay > 0 ? ` ${delay}ms` : ''}`
      })
      .join(', ')
  }
}

// ============================================================================
// Transition Functions
// ============================================================================

/**
 * Simple transition modifier with sensible defaults
 *
 * @example
 * ```typescript
 * .transition()                          // All properties, 300ms, ease
 * .transition('opacity')                 // Just opacity
 * .transition('all', 200)                // All properties, 200ms
 * .transition('transform', 300, 'ease-out')  // Transform with custom easing
 * .transition('opacity', 150, 'ease-in', 50)  // With delay
 * ```
 */
export function transition(
  property: string = 'all',
  duration: number = 300,
  easing: string = 'ease',
  delay: number = 0
): TransitionModifier {
  // Special case: if property is 'none', disable transitions entirely
  if (property === 'none') {
    return new TransitionModifier({ transition: 'none' })
  }

  const transitionValue = `${property} ${duration}ms ${easing}${delay > 0 ? ` ${delay}ms` : ''}`
  return new TransitionModifier({ transition: transitionValue })
}

/**
 * Complex transitions with multiple properties
 *
 * @example
 * ```typescript
 * .transitions({
 *   opacity: { duration: 200, easing: 'ease-out' },
 *   transform: { duration: 300, easing: 'ease-in-out', delay: 100 },
 *   backgroundColor: { duration: 150 }
 * })
 * ```
 */
export function transitions(config: TransitionsConfig): TransitionModifier {
  return new TransitionModifier({ transitions: config })
}

// ============================================================================
// Common Transition Presets
// ============================================================================

/**
 * Quick fade transition
 */
export function fadeTransition(duration: number = 200): TransitionModifier {
  return transition('opacity', duration, 'ease-out')
}

/**
 * Smooth transform transition
 */
export function transformTransition(
  duration: number = 300
): TransitionModifier {
  return transition('transform', duration, 'ease-out')
}

/**
 * Color change transition
 */
export function colorTransition(duration: number = 150): TransitionModifier {
  return transitions({
    color: { duration, easing: 'ease-out' },
    backgroundColor: { duration, easing: 'ease-out' },
    borderColor: { duration, easing: 'ease-out' },
  })
}

/**
 * Layout transition for size changes
 */
export function layoutTransition(duration: number = 250): TransitionModifier {
  return transitions({
    width: { duration, easing: 'ease-out' },
    height: { duration, easing: 'ease-out' },
    margin: { duration, easing: 'ease-out' },
    padding: { duration, easing: 'ease-out' },
  })
}

/**
 * Button hover transition
 */
export function buttonTransition(): TransitionModifier {
  return transitions({
    backgroundColor: { duration: 150, easing: 'ease-out' },
    transform: { duration: 200, easing: 'ease-out' },
    boxShadow: { duration: 200, easing: 'ease-out' },
  })
}

/**
 * Card hover transition
 */
export function cardTransition(): TransitionModifier {
  return transitions({
    transform: { duration: 200, easing: 'ease-out' },
    boxShadow: { duration: 300, easing: 'ease-out' },
    borderColor: { duration: 150, easing: 'ease-out' },
  })
}

/**
 * Modal/dialog transition
 */
export function modalTransition(): TransitionModifier {
  return transitions({
    opacity: { duration: 200, easing: 'ease-out' },
    transform: { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  })
}

/**
 * Smooth all-properties transition
 */
export function smoothTransition(duration: number = 300): TransitionModifier {
  return transition('all', duration, 'ease-out')
}

/**
 * Quick transition for interactive elements
 */
export function quickTransition(duration: number = 150): TransitionModifier {
  return transition('all', duration, 'ease-out')
}

/**
 * Slow transition for dramatic effects
 */
export function slowTransition(duration: number = 500): TransitionModifier {
  return transition('all', duration, 'ease-out')
}
