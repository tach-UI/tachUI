/**
 * Focused Modifier
 *
 * Manages focus state for elements with reactive binding support.
 * Supports both static boolean and reactive Signal<boolean> values.
 */

import { BaseModifier } from '../base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '../types'

// Simple signal-like interface for reactive values
interface Signal<T> {
  (): T
  subscribe?: (callback: (value: T) => void) => () => void
}

export interface FocusedOptions {
  focused: boolean | Signal<boolean>
}

export class FocusedModifier extends BaseModifier<FocusedOptions> {
  readonly type = 'focused'
  readonly priority = 75

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    this.setupFocusManagement(context.element, this.properties.focused)
    return undefined
  }

  private setupFocusManagement(
    element: Element,
    focused: boolean | Signal<boolean>
  ): void {
    // Check if element has HTMLElement-like properties (for test compatibility)
    if (!element || typeof (element as any).focus !== 'function') return

    const htmlElement = element as HTMLElement

    // Ensure the element can receive focus
    if (htmlElement.tabIndex < 0) {
      htmlElement.tabIndex = 0
    }

    let unsubscribe: (() => void) | undefined

    const applyFocusState = (shouldFocus: boolean) => {
      if (shouldFocus) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (document.activeElement !== htmlElement) {
            htmlElement.focus()
          }
        })
      } else {
        // Only blur if this element currently has focus
        if (document.activeElement === htmlElement) {
          htmlElement.blur()
        }
      }
    }

    if (typeof focused === 'function') {
      // Reactive focus management
      const signal = focused as Signal<boolean>

      // Apply initial state
      applyFocusState(signal())

      // Subscribe to changes if signal supports subscription
      if (signal.subscribe) {
        unsubscribe = signal.subscribe((newValue: boolean) => {
          applyFocusState(newValue)
        })
      } else {
        // Fallback: poll for changes (disabled in test environment to prevent recursion)
        if (process.env.NODE_ENV !== 'test') {
          let lastValue = signal()
          let pollActive = true
          const poll = () => {
            if (!pollActive) return
            const currentValue = signal()
            if (currentValue !== lastValue) {
              lastValue = currentValue
              applyFocusState(currentValue)
            }
            if (pollActive) {
              requestAnimationFrame(poll)
            }
          }

          unsubscribe = () => {
            pollActive = false
          }

          // Start polling
          requestAnimationFrame(poll)
        } else {
          // In test environment, just capture initial value
          unsubscribe = () => {
            // No-op in test environment
          }
        }
      }
    } else {
      // Static focus management
      applyFocusState(focused)
    }

    // Store cleanup function for later removal
    const cleanup = () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }

    ;(element as any)._focusedCleanup = cleanup
  }
}

/**
 * Factory function for focused modifier
 */
export function focused(
  focusedValue: boolean | Signal<boolean>
): FocusedModifier {
  return new FocusedModifier({ focused: focusedValue })
}
