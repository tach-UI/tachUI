/**
 * Modifier Factory Functions
 *
 * Factory functions for creating custom modifiers, combining modifiers,
 * and building advanced modifier behaviors. These are the building blocks
 * for creating your own modifier implementations.
 */

import { createEffect } from '../reactive'
import { isSignal } from '../reactive/signal'
import type { Signal } from '../reactive/types'
import type { DOMNode, ComponentInstance } from '../runtime/types'
import { BaseModifier } from './base'
import type {
  Modifier,
  ModifierContext,
  ModifierFactory,
  ReactiveModifierProps,
} from './types'

/**
 * Helper functions for working with modifiers
 */
export const modifierHelpers = {
  /**
   * Check if a value is a reactive signal
   */
  isReactive<T>(value: T | Signal<T>): value is Signal<T> {
    return isSignal(value)
  },

  /**
   * Resolve a potentially reactive value
   */
  resolveValue<T>(value: T | Signal<T>): T {
    return isSignal(value) ? value() : value
  },

  /**
   * Create a reactive effect for a value
   */
  createReactiveEffect<T>(
    value: T | Signal<T>,
    onChange: (newValue: T) => void
  ): (() => void) | null {
    if (isSignal(value)) {
      const effect = createEffect(() => {
        const newValue = value()
        onChange(newValue)
      })
      return () => effect.dispose()
    }
    return null
  },

  /**
   * Merge modifier properties
   */
  mergeProperties<T extends Record<string, any>>(
    base: T,
    override: Partial<T>
  ): T {
    const result = { ...base }

    for (const [key, value] of Object.entries(override)) {
      if (value !== undefined) {
        result[key as keyof T] = value
      }
    }

    return result
  },

  /**
   * Convert a CSS property name to camelCase
   */
  toCamelCase(cssProperty: string): string {
    return cssProperty.replace(/-([a-z])/g, (_match, letter) =>
      letter.toUpperCase()
    )
  },

  /**
   * Convert a camelCase property to CSS kebab-case
   */
  toKebabCase(camelProperty: string): string {
    return camelProperty.replace(/([A-Z])/g, '-$1').toLowerCase()
  },

  /**
   * Normalize a CSS value
   */
  normalizeCSSValue(value: any): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    if (typeof value === 'string') {
      return value
    }
    return String(value)
  },
}

/**
 * Create a custom modifier
 */
export function createCustomModifier<TProps extends Record<string, any>>(
  type: string,
  priority: number,
  applyFn: (
    node: DOMNode,
    context: ModifierContext,
    props: TProps
  ) => DOMNode | undefined
): ModifierFactory<TProps> {
  class CustomModifier extends BaseModifier<TProps> {
    readonly type = type
    readonly priority = priority

    apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
      return applyFn(node, context, this.properties)
    }
  }

  return (props: ReactiveModifierProps<TProps>) =>
    new CustomModifier(props as TProps)
}

/**
 * Create a simple style modifier (convenience wrapper)
 */
export function createStyleModifier<TProps extends Record<string, any>>(
  type: string,
  styles: (props: TProps) => Record<string, any>,
  priority: number = 100
): ModifierFactory<TProps> {
  return createCustomModifier(type, priority, (node, context, props) => {
    if (context.element instanceof HTMLElement) {
      const styleObject = styles(props)
      Object.assign(context.element.style, styleObject)
    }
    return node
  })
}

/**
 * Create a preset modifier (no props, just applies fixed styles)
 */
export function createPresetModifier(
  type: string,
  styles: Record<string, any>,
  priority: number = 100
): () => Modifier {
  return () =>
    createCustomModifier(type, priority, (node, context) => {
      if (context.element instanceof HTMLElement) {
        Object.assign(context.element.style, styles)
      }
      return node
    })({})
}

/**
 * Create a component variant (wrapped component with preset modifiers)
 */
export function createComponentVariant<T extends ComponentInstance>(
  baseComponent: T,
  ...modifiers: Modifier[]
): T {
  // This function needs to be implemented properly
  // For now, return the base component as-is
  console.warn('createComponentVariant is not yet implemented')
  return baseComponent
}

/**
 * Combine multiple modifiers into a single modifier
 */
export function combineModifiers(
  modifiers: Modifier[],
  type: string = 'combined',
  priority: number = 999
): Modifier {
  return createCustomModifier(type, priority, (node, context, _props) => {
    let currentNode = node

    // Apply all modifiers in sequence
    for (const modifier of modifiers) {
      const result = modifier.apply(currentNode, context)
      if (result && typeof result === 'object' && 'type' in result) {
        currentNode = result
      }
    }

    return currentNode
  })({})
}

/**
 * Create a conditional modifier that only applies if a condition is met
 */
export function conditionalModifier(
  condition: boolean | Signal<boolean>,
  modifier: Modifier
): Modifier {
  return createCustomModifier(
    `conditional-${modifier.type}`,
    modifier.priority,
    (node, context, _props) => {
      const shouldApply = modifierHelpers.resolveValue(condition)

      if (shouldApply) {
        return modifier.apply(node, context)
      }

      // If reactive, set up effect to watch condition changes
      if (isSignal(condition)) {
        const effect = createEffect(() => {
          const newCondition = condition()
          if (context.element) {
            if (newCondition) {
              modifier.apply(node, context)
            } else {
              // Remove the modifier's effects
              // This would need more sophisticated state tracking
            }
          }
        })

        // Store cleanup
        if (!node.dispose) {
          node.dispose = () => effect.dispose()
        } else {
          const existingDispose = node.dispose
          node.dispose = () => {
            effect.dispose()
            existingDispose()
          }
        }
      }

      return node
    }
  )({})
}

/**
 * Create a modifier that applies different styles based on state
 */
export function stateModifier<T extends string>(
  stateSignal: Signal<T>,
  stateModifiers: Record<T, Modifier[]>
): Modifier {
  return createCustomModifier('state', 500, (node, context, _props) => {
    let currentNode = node

    const applyStateModifiers = (state: T) => {
      const modifiers = stateModifiers[state] || []

      for (const modifier of modifiers) {
        const result = modifier.apply(currentNode, context)
        if (result && typeof result === 'object' && 'type' in result) {
          currentNode = result
        }
      }
    }

    // Apply initial state
    applyStateModifiers(stateSignal())

    // Set up reactive effect
    const effect = createEffect(() => {
      const newState = stateSignal()
      applyStateModifiers(newState)
    })

    // Store cleanup
    if (!node.dispose) {
      node.dispose = () => effect.dispose()
    } else {
      const existingDispose = node.dispose
      node.dispose = () => {
        effect.dispose()
        existingDispose()
      }
    }

    return currentNode
  })({})
}

/**
 * Create a responsive modifier that applies different modifiers based on screen size
 */
export function responsiveModifier(
  breakpoints: Record<string, Modifier[]>,
  defaultModifiers: Modifier[] = []
): Modifier {
  return createCustomModifier('responsive', 100, (node, context, _props) => {
    let currentNode = node

    const applyResponsiveModifiers = () => {
      const width = window.innerWidth
      let modifiersToApply = defaultModifiers

      // Determine which breakpoint applies
      for (const [breakpoint, modifiers] of Object.entries(breakpoints)) {
        const breakpointWidth = parseInt(breakpoint)
        if (width >= breakpointWidth) {
          modifiersToApply = modifiers
        }
      }

      // Apply the modifiers
      for (const modifier of modifiersToApply) {
        const result = modifier.apply(currentNode, context)
        if (result && typeof result === 'object' && 'type' in result) {
          currentNode = result
        }
      }
    }

    // Apply initial modifiers
    applyResponsiveModifiers()

    // Set up resize listener
    const handleResize = () => applyResponsiveModifiers()
    window.addEventListener('resize', handleResize)

    // Store cleanup
    const cleanup = () => window.removeEventListener('resize', handleResize)
    if (!node.dispose) {
      node.dispose = cleanup
    } else {
      const existingDispose = node.dispose
      node.dispose = () => {
        cleanup()
        existingDispose()
      }
    }

    return currentNode
  })({})
}

/**
 * Create a modifier that applies CSS classes
 */
export function classModifier(
  classes: string | string[] | Signal<string | string[]>
): Modifier {
  return createCustomModifier('class', 50, (node, context, _props) => {
    if (!context.element) return node

    const applyClasses = (classNames: string | string[]) => {
      const classList = Array.isArray(classNames)
        ? classNames
        : classNames.split(' ').filter(Boolean)

      if (context.element instanceof HTMLElement) {
        context.element.classList.add(...classList)
      }
    }

    if (isSignal(classes)) {
      // Reactive classes
      let previousClasses: string[] = []

      const effect = createEffect(() => {
        const newClasses = classes()
        const newClassList = Array.isArray(newClasses)
          ? newClasses
          : newClasses.split(' ').filter(Boolean)

        if (context.element instanceof HTMLElement) {
          // Remove previous classes
          context.element.classList.remove(...previousClasses)
          // Add new classes
          context.element.classList.add(...newClassList)
          previousClasses = newClassList
        }
      })

      // Store cleanup
      if (!node.dispose) {
        node.dispose = () => effect.dispose()
      } else {
        const existingDispose = node.dispose
        node.dispose = () => {
          effect.dispose()
          existingDispose()
        }
      }
    } else {
      // Static classes
      applyClasses(classes)
    }

    return node
  })({})
}

/**
 * Create a modifier that applies inline styles
 */
export function styleModifier(
  styles:
    | Record<string, string | number>
    | Signal<Record<string, string | number>>
): Modifier {
  return createCustomModifier('style', 200, (node, context, _props) => {
    if (!context.element) return node

    const applyStyles = (styleObj: Record<string, string | number>) => {
      if (context.element instanceof HTMLElement) {
        for (const [property, value] of Object.entries(styleObj)) {
          const cssProperty = modifierHelpers.toKebabCase(property)
          const cssValue = modifierHelpers.normalizeCSSValue(value)
          context.element.style.setProperty(cssProperty, cssValue)
        }
      }
    }

    if (isSignal(styles)) {
      // Reactive styles
      const effect = createEffect(() => {
        const newStyles = styles()
        applyStyles(newStyles)
      })

      // Store cleanup
      if (!node.dispose) {
        node.dispose = () => effect.dispose()
      } else {
        const existingDispose = node.dispose
        node.dispose = () => {
          effect.dispose()
          existingDispose()
        }
      }
    } else {
      // Static styles
      applyStyles(styles)
    }

    return node
  })({})
}

/**
 * Utility to create a modifier that adds event listeners
 */
export function eventModifier(events: Record<string, EventListener>): Modifier {
  return createCustomModifier('event', 300, (node, context, _props) => {
    if (!context.element) return node

    const cleanupFunctions: (() => void)[] = []

    for (const [eventType, handler] of Object.entries(events)) {
      context.element.addEventListener(eventType, handler)
      cleanupFunctions.push(() => {
        context.element?.removeEventListener(eventType, handler)
      })
    }

    // Store cleanup
    const cleanup = () => cleanupFunctions.forEach(fn => fn())
    if (!node.dispose) {
      node.dispose = cleanup
    } else {
      const existingDispose = node.dispose
      node.dispose = () => {
        cleanup()
        existingDispose()
      }
    }

    return node
  })({})
}
