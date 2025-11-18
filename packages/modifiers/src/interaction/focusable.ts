/**
 * Focusable Modifier
 *
 * Controls whether an element can receive focus and defines interaction behaviors.
 * Supports accessibility attributes and role management.
 */

import { BaseModifier } from '../base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '../types'

export interface FocusableOptions {
  isFocusable?: boolean
  interactions?: ('activate' | 'edit')[]
}

export class FocusableModifier extends BaseModifier<FocusableOptions> {
  readonly type = 'focusable'
  readonly priority = 75

  constructor(options: FocusableOptions = {}) {
    // Ensure interactions defaults to empty array
    const normalizedOptions = {
      ...options,
      interactions: options.interactions || [],
    }
    super(normalizedOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    this.setupFocusable(context.element, this.properties)
    return undefined
  }

  private setupFocusable(element: Element, options: FocusableOptions): void {
    // Check if element has HTMLElement-like properties (for test compatibility)
    if (!element || typeof (element as any).focus !== 'function') return

    const htmlElement = element as HTMLElement
    const isFocusable = options.isFocusable ?? true
    const interactions = options.interactions ?? []

    if (isFocusable) {
      // Make element focusable
      if (htmlElement.tabIndex < 0) {
        htmlElement.tabIndex = 0
      }

      // Handle role assignment - edit takes precedence over activate, but don't override existing roles
      const existingRole = htmlElement.getAttribute('role')

      if (interactions.includes('edit')) {
        // Element can be edited - this takes precedence (but only if no existing role)
        if (!existingRole) {
          htmlElement.setAttribute('role', 'textbox')
        }
        htmlElement.setAttribute('contenteditable', 'true')
        htmlElement.setAttribute(
          'aria-label',
          htmlElement.getAttribute('aria-label') || 'Editable content'
        )
      } else if (interactions.includes('activate')) {
        // Element can be activated (like a button) - only if no role set
        if (!existingRole) {
          htmlElement.setAttribute('role', 'button')
        }
        htmlElement.setAttribute(
          'aria-label',
          htmlElement.getAttribute('aria-label') || 'Activatable element'
        )
      }

      // Add keyboard activation support if activate interaction is present
      if (interactions.includes('activate')) {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault()
            // Trigger a click event to activate
            htmlElement.click()
          }
        }

        htmlElement.addEventListener('keydown', handleKeyDown)

        // Store cleanup function
        const existingCleanup =
          (htmlElement as any)._focusableCleanup || (() => {})
        ;(htmlElement as any)._focusableCleanup = () => {
          existingCleanup()
          htmlElement.removeEventListener('keydown', handleKeyDown)
        }
      }

      // Ensure element appears focusable to screen readers
      if (
        !htmlElement.getAttribute('aria-label') &&
        !htmlElement.getAttribute('aria-labelledby')
      ) {
        htmlElement.setAttribute('aria-label', 'Focusable element')
      }

      // Ensure we always have a cleanup function, even if it's just a no-op
      if (!(htmlElement as any)._focusableCleanup) {
        ;(htmlElement as any)._focusableCleanup = () => {
          // Default cleanup - no specific actions needed for basic focusable
        }
      }
    } else {
      // Make element non-focusable
      htmlElement.tabIndex = -1
      htmlElement.removeAttribute('role')
      htmlElement.removeAttribute('aria-label')
      htmlElement.removeAttribute('contenteditable')

      // Clean up any existing event listeners
      const existingCleanup = (htmlElement as any)._focusableCleanup
      if (existingCleanup) {
        existingCleanup()
        delete (htmlElement as any)._focusableCleanup
      }
    }
  }
}

/**
 * Factory function for focusable modifier
 */
export function focusable(
  isFocusable?: boolean,
  interactions?: ('activate' | 'edit')[]
): FocusableModifier {
  return new FocusableModifier({
    isFocusable: isFocusable ?? true,
    interactions: interactions ?? [],
  })
}

/**
 * Convenience factory for activatable elements
 */
export function activatable(): FocusableModifier {
  return focusable(true, ['activate'])
}

/**
 * Convenience factory for editable elements
 */
export function editable(): FocusableModifier {
  return focusable(true, ['edit'])
}
