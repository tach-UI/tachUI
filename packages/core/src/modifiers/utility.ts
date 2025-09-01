/**
 * Utility Modifier - miscellaneous CSS properties
 *
 * Provides access to various CSS properties that don't fit
 * into other specific modifier categories.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'

export interface UtilityOptions {
  cursor?:
    | 'auto'
    | 'default'
    | 'pointer'
    | 'text'
    | 'wait'
    | 'help'
    | 'not-allowed'
    | 'none'
    | 'grab'
    | 'grabbing'
    | 'zoom-in'
    | 'zoom-out'
    | 'alias'
    | 'cell'
    | 'copy'
    | string // CSS cursor syntax: 'url(...), fallback'
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto'
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  zIndex?: number
  display?:
    | 'block'
    | 'inline'
    | 'inline-block'
    | 'flex'
    | 'inline-flex'
    | 'grid'
    | 'none'
  visibility?: 'visible' | 'hidden' | 'collapse'
  pointerEvents?: 'auto' | 'none'
  userSelect?: 'auto' | 'none' | 'text' | 'all'
  boxSizing?: 'content-box' | 'border-box'
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  objectPosition?: string
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  outline?: string
  outlineOffset?: number | string
}

export type ReactiveUtilityOptions = ReactiveModifierProps<UtilityOptions>

export class UtilityModifier extends BaseModifier<UtilityOptions> {
  readonly type = 'utility'
  readonly priority = 10 // Lower priority for utility properties

  constructor(options: ReactiveUtilityOptions) {
    // Convert reactive options to regular options for immediate use
    const resolvedOptions: UtilityOptions = {}
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

    const styles = this.computeUtilityStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeUtilityStyles(props: UtilityOptions) {
    const styles: Record<string, string> = {}

    if (props.cursor !== undefined) {
      // Validate cursor value in development mode
      if (process.env.NODE_ENV === 'development') {
        this.validateCursorValue(props.cursor)
      }
      styles.cursor = props.cursor
    }
    if (props.overflow !== undefined) {
      styles.overflow = props.overflow
    }
    if (props.overflowX !== undefined) {
      styles.overflowX = props.overflowX
    }
    if (props.overflowY !== undefined) {
      styles.overflowY = props.overflowY
    }
    if (props.position !== undefined) {
      styles.position = props.position
    }
    if (props.top !== undefined) {
      styles.top = this.toCSSValue(props.top)
    }
    if (props.right !== undefined) {
      styles.right = this.toCSSValue(props.right)
    }
    if (props.bottom !== undefined) {
      styles.bottom = this.toCSSValue(props.bottom)
    }
    if (props.left !== undefined) {
      styles.left = this.toCSSValue(props.left)
    }
    if (props.zIndex !== undefined) {
      styles.zIndex = props.zIndex.toString()
    }
    if (props.display !== undefined) {
      styles.display = props.display
    }
    if (props.visibility !== undefined) {
      styles.visibility = props.visibility
    }
    if (props.pointerEvents !== undefined) {
      styles.pointerEvents = props.pointerEvents
    }
    if (props.userSelect !== undefined) {
      styles.userSelect = props.userSelect
    }
    if (props.boxSizing !== undefined) {
      styles.boxSizing = props.boxSizing
    }
    if (props.objectFit !== undefined) {
      styles.objectFit = props.objectFit
    }
    if (props.objectPosition !== undefined) {
      styles.objectPosition = props.objectPosition
    }
    if (props.resize !== undefined) {
      styles.resize = props.resize
    }
    if (props.outline !== undefined) {
      styles.outline = props.outline
    }
    if (props.outlineOffset !== undefined) {
      styles.outlineOffset = this.toCSSValue(props.outlineOffset)
    }

    return styles
  }

  private validateCursorValue(value: string): void {
    const validCursors = [
      'auto',
      'default',
      'pointer',
      'text',
      'wait',
      'help',
      'not-allowed',
      'none',
      'grab',
      'grabbing',
      'zoom-in',
      'zoom-out',
      'alias',
      'cell',
      'copy',
    ]

    if (!validCursors.includes(value) && !value.includes('url(')) {
      console.warn(
        `Unknown cursor value: "${value}". See documentation for valid cursor values.`
      )
    }
  }
}

/**
 * Create a utility modifier with miscellaneous CSS properties
 */
export function utility(options: ReactiveUtilityOptions): UtilityModifier {
  return new UtilityModifier(options)
}

/**
 * Convenience function for cursor
 */
export function cursor(value: UtilityOptions['cursor']): UtilityModifier {
  return new UtilityModifier({ cursor: value })
}

/**
 * Convenience function for overflow-y
 */
export function overflowY(value: UtilityOptions['overflowY']): UtilityModifier {
  return new UtilityModifier({ overflowY: value })
}

/**
 * Convenience function for overflow-x
 */
export function overflowX(value: UtilityOptions['overflowX']): UtilityModifier {
  return new UtilityModifier({ overflowX: value })
}

/**
 * Convenience function for position
 */
export function position(value: UtilityOptions['position']): UtilityModifier {
  return new UtilityModifier({ position: value })
}

/**
 * Convenience function for z-index
 */
export function zIndex(value: number): UtilityModifier {
  return new UtilityModifier({ zIndex: value })
}

/**
 * Convenience function for display
 */
export function display(value: UtilityOptions['display']): UtilityModifier {
  return new UtilityModifier({ display: value })
}

/**
 * Convenience function for outline
 */
export function outline(value: string): UtilityModifier {
  return new UtilityModifier({ outline: value })
}

/**
 * Convenience function for outline-offset
 */
export function outlineOffset(value: number | string): UtilityModifier {
  return new UtilityModifier({ outlineOffset: value })
}
