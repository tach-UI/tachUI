/**
 * Keyboard Event Modifiers
 *
 * Basic keyboard event handlers that were missing from the framework.
 * Provides onKeyDown, onKeyUp, onKeyPress
 */

import { BaseModifier } from '../base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '../types'

// ============================================================================
// Keyboard Events
// ============================================================================

export interface OnKeyDownOptions {
  onKeyDown: (event: KeyboardEvent) => void
}

export class OnKeyDownModifier extends BaseModifier<OnKeyDownOptions> {
  readonly type = 'onKeyDown'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleKeyDown = (event: Event) => {
      this.properties.onKeyDown(event as KeyboardEvent)
    }

    context.element.addEventListener('keydown', handleKeyDown)

    // Store cleanup
    ;(context.element as any)._keyDownCleanup = () => {
      context.element!.removeEventListener('keydown', handleKeyDown)
    }

    return undefined
  }
}

export interface OnKeyUpOptions {
  onKeyUp: (event: KeyboardEvent) => void
}

export class OnKeyUpModifier extends BaseModifier<OnKeyUpOptions> {
  readonly type = 'onKeyUp'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleKeyUp = (event: Event) => {
      this.properties.onKeyUp(event as KeyboardEvent)
    }

    context.element.addEventListener('keyup', handleKeyUp)

    // Store cleanup
    ;(context.element as any)._keyUpCleanup = () => {
      context.element!.removeEventListener('keyup', handleKeyUp)
    }

    return undefined
  }
}

export interface OnKeyPressOptions {
  onKeyPress: (event: KeyboardEvent) => void
}

export class OnKeyPressModifier extends BaseModifier<OnKeyPressOptions> {
  readonly type = 'onKeyPress'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleKeyPress = (event: Event) => {
      this.properties.onKeyPress(event as KeyboardEvent)
    }

    // Note: keypress is deprecated, but we'll support it for backwards compatibility
    context.element.addEventListener('keypress', handleKeyPress)

    // Store cleanup
    ;(context.element as any)._keyPressCleanup = () => {
      context.element!.removeEventListener('keypress', handleKeyPress)
    }

    return undefined
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Key down event handler
 *
 * @example
 * ```typescript
 * .onKeyDown((event: KeyboardEvent) => {
 *   if (event.key === 'Enter') {
 *     handleSubmit()
 *   }
 * })
 * ```
 */
export function onKeyDown(
  callback: (event: KeyboardEvent) => void
): OnKeyDownModifier {
  return new OnKeyDownModifier({ onKeyDown: callback })
}

/**
 * Key up event handler
 *
 * @example
 * ```typescript
 * .onKeyUp((event: KeyboardEvent) => {
 *   console.log('Key released:', event.key)
 * })
 * ```
 */
export function onKeyUp(
  callback: (event: KeyboardEvent) => void
): OnKeyUpModifier {
  return new OnKeyUpModifier({ onKeyUp: callback })
}

/**
 * Key press event handler (deprecated but supported)
 *
 * @example
 * ```typescript
 * .onKeyPress((event: KeyboardEvent) => {
 *   console.log('Key pressed:', event.key)
 * })
 * ```
 */
export function onKeyPress(
  callback: (event: KeyboardEvent) => void
): OnKeyPressModifier {
  return new OnKeyPressModifier({ onKeyPress: callback })
}
