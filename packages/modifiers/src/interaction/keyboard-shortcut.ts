/**
 * KeyboardShortcut Modifier
 *
 * Implements keyboard shortcut handling with support for modifier keys.
 * Supports cross-platform key combinations including cmd/ctrl normalization.
 */

import { BaseModifier } from '../base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '../types'

export interface KeyboardShortcutOptions {
  key: string
  modifiers?: ('cmd' | 'ctrl' | 'shift' | 'alt' | 'meta')[]
  action: () => void
}

export class KeyboardShortcutModifier extends BaseModifier<KeyboardShortcutOptions> {
  readonly type = 'keyboardShortcut'
  readonly priority = 80

  constructor(options: KeyboardShortcutOptions) {
    // Ensure modifiers defaults to empty array
    const normalizedOptions = {
      ...options,
      modifiers: options.modifiers || [],
    }
    super(normalizedOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    this.setupKeyboardShortcut(context.element, this.properties)
    return undefined
  }

  private setupKeyboardShortcut(
    element: Element,
    shortcut: KeyboardShortcutOptions
  ): void {
    const modifiers = shortcut.modifiers || []

    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent

      // Check if the pressed key matches
      if (keyboardEvent.key.toLowerCase() !== shortcut.key.toLowerCase()) {
        return
      }

      // Check modifier keys
      const requiredModifiers = new Set(modifiers)
      const activeModifiers = new Set<string>()

      // Normalize platform differences (cmd vs ctrl)
      if (keyboardEvent.ctrlKey || keyboardEvent.metaKey) {
        if (navigator.platform.includes('Mac')) {
          if (keyboardEvent.metaKey) {
            activeModifiers.add('cmd')
            activeModifiers.add('meta')
          }
          if (keyboardEvent.ctrlKey) {
            activeModifiers.add('ctrl')
          }
        } else {
          if (keyboardEvent.ctrlKey) {
            activeModifiers.add('ctrl')
            activeModifiers.add('cmd') // Allow 'cmd' to work on non-Mac platforms as 'ctrl'
          }
          if (keyboardEvent.metaKey) {
            activeModifiers.add('meta')
          }
        }
      }

      if (keyboardEvent.shiftKey) {
        activeModifiers.add('shift')
      }

      if (keyboardEvent.altKey) {
        activeModifiers.add('alt')
      }

      // Check if all required modifiers are active
      const hasRequiredModifiers = Array.from(requiredModifiers).every(
        modifier => activeModifiers.has(modifier)
      )

      // Check if there are extra modifiers that shouldn't be there
      const allowedModifiers = new Set([...requiredModifiers])
      if (requiredModifiers.has('cmd')) {
        allowedModifiers.add('meta') // cmd and meta are equivalent
        allowedModifiers.add('ctrl') // ctrl can act as cmd on non-Mac platforms
      }
      if (requiredModifiers.has('meta')) {
        allowedModifiers.add('cmd') // cmd and meta are equivalent
      }
      if (requiredModifiers.has('ctrl')) {
        allowedModifiers.add('cmd') // cmd can map to ctrl on non-Mac platforms
      }

      const hasExtraModifiers = Array.from(activeModifiers).some(
        modifier =>
          !allowedModifiers.has(
            modifier as 'cmd' | 'ctrl' | 'shift' | 'alt' | 'meta'
          )
      )

      // Execute action if key combination matches exactly
      if (hasRequiredModifiers && !hasExtraModifiers) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.action()
      }
    }

    // Add keydown listener
    // For keyboard shortcuts, we usually want global scope, so add to document
    // But also support element-scoped shortcuts
    const targetElement =
      element instanceof HTMLElement && element.tabIndex >= 0
        ? element
        : document

    targetElement.addEventListener('keydown', handleKeyDown as EventListener)

    // Store cleanup function for later removal
    const cleanup = () => {
      targetElement.removeEventListener(
        'keydown',
        handleKeyDown as EventListener
      )
    }

    ;(element as any)._keyboardShortcutCleanup = cleanup
  }
}

/**
 * Factory function for keyboardShortcut modifier
 */
export function keyboardShortcut(
  options: KeyboardShortcutOptions
): KeyboardShortcutModifier {
  return new KeyboardShortcutModifier(options)
}

/**
 * Convenience factory for common shortcut patterns
 */
export function keyboardShortcutBuilder(
  key: string,
  modifiers: ('cmd' | 'ctrl' | 'shift' | 'alt' | 'meta')[],
  action: () => void
): KeyboardShortcutModifier {
  return keyboardShortcut({ key, modifiers, action })
}
