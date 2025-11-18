/**
 * Focus Event Modifiers
 *
 * Focus and blur event handlers that were missing from the framework.
 * Provides onFocus, onBlur with boolean callbacks (similar to onHover pattern)
 */

import { BaseModifier } from '../base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '../types'

// ============================================================================
// Focus Events
// ============================================================================

export interface OnFocusOptions {
  onFocus: (isFocused: boolean) => void
}

export class OnFocusModifier extends BaseModifier<OnFocusOptions> {
  readonly type = 'onFocus'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleFocus = () => {
      this.properties.onFocus(true)
    }

    const handleBlur = () => {
      this.properties.onFocus(false)
    }

    context.element.addEventListener('focus', handleFocus)
    context.element.addEventListener('blur', handleBlur)

    // Store cleanup
    ;(context.element as any)._focusCleanup = () => {
      context.element!.removeEventListener('focus', handleFocus)
      context.element!.removeEventListener('blur', handleBlur)
      // Reset focus state
      this.properties.onFocus(false)
    }

    return undefined
  }
}

export interface OnBlurOptions {
  onBlur: (isFocused: boolean) => void
}

export class OnBlurModifier extends BaseModifier<OnBlurOptions> {
  readonly type = 'onBlur'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleFocus = () => {
      this.properties.onBlur(true)
    }

    const handleBlur = () => {
      this.properties.onBlur(false)
    }

    context.element.addEventListener('focus', handleFocus)
    context.element.addEventListener('blur', handleBlur)

    // Store cleanup
    ;(context.element as any)._blurCleanup = () => {
      context.element!.removeEventListener('focus', handleFocus)
      context.element!.removeEventListener('blur', handleBlur)
      // Reset focus state
      this.properties.onBlur(false)
    }

    return undefined
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Focus state change handler
 *
 * @example
 * ```typescript
 * .onFocus((isFocused: boolean) => {
 *   if (isFocused) {
 *     console.log('Element gained focus')
 *   } else {
 *     console.log('Element lost focus')
 *   }
 * })
 * ```
 */
export function onFocus(
  callback: (isFocused: boolean) => void
): OnFocusModifier {
  return new OnFocusModifier({ onFocus: callback })
}

/**
 * Blur state change handler (same as onFocus but with different semantic name)
 *
 * @example
 * ```typescript
 * .onBlur((isFocused: boolean) => {
 *   if (!isFocused) {
 *     validateInput()
 *   }
 * })
 * ```
 */
export function onBlur(callback: (isFocused: boolean) => void): OnBlurModifier {
  return new OnBlurModifier({ onBlur: callback })
}
