/**
 * Mouse Event Modifiers
 *
 * Basic mouse event handlers that were missing from the framework.
 * Provides onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, onDoubleClick, onContextMenu
 */

import { BaseModifier } from '../base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '../types'

// ============================================================================
// Mouse Enter/Leave Events
// ============================================================================

export interface OnMouseEnterOptions {
  onMouseEnter: (event: MouseEvent) => void
}

export class OnMouseEnterModifier extends BaseModifier<OnMouseEnterOptions> {
  readonly type = 'onMouseEnter'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleMouseEnter = (event: Event) => {
      this.properties.onMouseEnter(event as MouseEvent)
    }

    context.element.addEventListener('mouseenter', handleMouseEnter)

    // Store cleanup
    ;(context.element as any)._mouseEnterCleanup = () => {
      context.element!.removeEventListener('mouseenter', handleMouseEnter)
    }

    return undefined
  }
}

export interface OnMouseLeaveOptions {
  onMouseLeave: (event: MouseEvent) => void
}

export class OnMouseLeaveModifier extends BaseModifier<OnMouseLeaveOptions> {
  readonly type = 'onMouseLeave'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleMouseLeave = (event: Event) => {
      this.properties.onMouseLeave(event as MouseEvent)
    }

    context.element.addEventListener('mouseleave', handleMouseLeave)

    // Store cleanup
    ;(context.element as any)._mouseLeaveCleanup = () => {
      context.element!.removeEventListener('mouseleave', handleMouseLeave)
    }

    return undefined
  }
}

// ============================================================================
// Mouse Press Events
// ============================================================================

export interface OnMouseDownOptions {
  onMouseDown: (event: MouseEvent) => void
}

export class OnMouseDownModifier extends BaseModifier<OnMouseDownOptions> {
  readonly type = 'onMouseDown'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleMouseDown = (event: Event) => {
      this.properties.onMouseDown(event as MouseEvent)
    }

    context.element.addEventListener('mousedown', handleMouseDown)

    // Store cleanup
    ;(context.element as any)._mouseDownCleanup = () => {
      context.element!.removeEventListener('mousedown', handleMouseDown)
    }

    return undefined
  }
}

export interface OnMouseUpOptions {
  onMouseUp: (event: MouseEvent) => void
}

export class OnMouseUpModifier extends BaseModifier<OnMouseUpOptions> {
  readonly type = 'onMouseUp'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleMouseUp = (event: Event) => {
      this.properties.onMouseUp(event as MouseEvent)
    }

    context.element.addEventListener('mouseup', handleMouseUp)

    // Store cleanup
    ;(context.element as any)._mouseUpCleanup = () => {
      context.element!.removeEventListener('mouseup', handleMouseUp)
    }

    return undefined
  }
}

// ============================================================================
// Double Click and Context Menu
// ============================================================================

export interface OnDoubleClickOptions {
  onDoubleClick: (event: MouseEvent) => void
}

export class OnDoubleClickModifier extends BaseModifier<OnDoubleClickOptions> {
  readonly type = 'onDoubleClick'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleDoubleClick = (event: Event) => {
      this.properties.onDoubleClick(event as MouseEvent)
    }

    context.element.addEventListener('dblclick', handleDoubleClick)

    // Store cleanup
    ;(context.element as any)._doubleClickCleanup = () => {
      context.element!.removeEventListener('dblclick', handleDoubleClick)
    }

    return undefined
  }
}

export interface OnContextMenuOptions {
  onContextMenu: (event: MouseEvent) => void
}

export class OnContextMenuModifier extends BaseModifier<OnContextMenuOptions> {
  readonly type = 'onContextMenu'
  readonly priority = 50

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const handleContextMenu = (event: Event) => {
      this.properties.onContextMenu(event as MouseEvent)
    }

    context.element.addEventListener('contextmenu', handleContextMenu)

    // Store cleanup
    ;(context.element as any)._contextMenuCleanup = () => {
      context.element!.removeEventListener('contextmenu', handleContextMenu)
    }

    return undefined
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Mouse enter event handler
 *
 * @example
 * ```typescript
 * .onMouseEnter((event: MouseEvent) => {
 *   console.log('Mouse entered', event)
 * })
 * ```
 */
export function onMouseEnter(
  callback: (event: MouseEvent) => void
): OnMouseEnterModifier {
  return new OnMouseEnterModifier({ onMouseEnter: callback })
}

/**
 * Mouse leave event handler
 *
 * @example
 * ```typescript
 * .onMouseLeave((event: MouseEvent) => {
 *   console.log('Mouse left', event)
 * })
 * ```
 */
export function onMouseLeave(
  callback: (event: MouseEvent) => void
): OnMouseLeaveModifier {
  return new OnMouseLeaveModifier({ onMouseLeave: callback })
}

/**
 * Mouse down event handler
 *
 * @example
 * ```typescript
 * .onMouseDown((event: MouseEvent) => {
 *   console.log('Mouse pressed', event.button)
 * })
 * ```
 */
export function onMouseDown(
  callback: (event: MouseEvent) => void
): OnMouseDownModifier {
  return new OnMouseDownModifier({ onMouseDown: callback })
}

/**
 * Mouse up event handler
 *
 * @example
 * ```typescript
 * .onMouseUp((event: MouseEvent) => {
 *   console.log('Mouse released', event.button)
 * })
 * ```
 */
export function onMouseUp(
  callback: (event: MouseEvent) => void
): OnMouseUpModifier {
  return new OnMouseUpModifier({ onMouseUp: callback })
}

/**
 * Double click event handler
 *
 * @example
 * ```typescript
 * .onDoubleClick((event: MouseEvent) => {
 *   console.log('Double clicked!')
 * })
 * ```
 */
export function onDoubleClick(
  callback: (event: MouseEvent) => void
): OnDoubleClickModifier {
  return new OnDoubleClickModifier({ onDoubleClick: callback })
}

/**
 * Context menu (right-click) event handler
 *
 * @example
 * ```typescript
 * .onContextMenu((event: MouseEvent) => {
 *   event.preventDefault()
 *   showCustomMenu()
 * })
 * ```
 */
export function onContextMenu(
  callback: (event: MouseEvent) => void
): OnContextMenuModifier {
  return new OnContextMenuModifier({ onContextMenu: callback })
}
