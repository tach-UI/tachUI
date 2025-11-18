/**
 * Effects Modifiers - Hover effects and cursor styling
 *
 * Provides comprehensive hover effect system with SwiftUI-style effects
 * and enhanced cursor styling with complete CSS cursor support.
 */

import type { Signal } from '@tachui/types/reactive'
import type { DOMNode } from '@tachui/types/runtime'
import { BaseModifier } from '@tachui/core/modifiers/base'
import type { ModifierContext, ReactiveModifierProps } from '@tachui/types/modifiers'

// ============================================================================
// Cursor System
// ============================================================================

export type CSSCursorValue =
  // Existing values (8 values) - no breaking changes
  | 'auto'
  | 'default'
  | 'pointer'
  | 'text'
  | 'wait'
  | 'help'
  | 'not-allowed'
  | 'none'

  // New additions (7 values) - additive enhancement
  | 'grab'
  | 'grabbing'
  | 'zoom-in'
  | 'zoom-out'
  | 'alias'
  | 'cell'
  | 'copy'

  // Custom cursor support
  | string // CSS cursor syntax: 'url(...), fallback'

export interface CursorOptions {
  cursor: CSSCursorValue
}

export type ReactiveCursorOptions = ReactiveModifierProps<CursorOptions>

export class CursorModifier extends BaseModifier<CursorOptions> {
  readonly type = 'cursor'
  readonly priority = 10

  constructor(options: ReactiveCursorOptions) {
    const resolvedOptions: CursorOptions = { cursor: 'auto' }
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

    // Validate cursor value in development mode
    if (process.env.NODE_ENV === 'development') {
      this.validateCursorValue(this.properties.cursor)
    }

    this.applyStyles(context.element, { cursor: this.properties.cursor })

    return undefined
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

// ============================================================================
// Hover Effects System
// ============================================================================

export type SwiftUIHoverEffect =
  | 'automatic' // SwiftUI default - subtle scaling and shadow
  | 'highlight' // Subtle background change
  | 'lift' // Elevation effect with shadow
  | 'scale' // Scale transform on hover

export interface HoverStyles {
  backgroundColor?: string
  color?: string
  transform?: string
  opacity?: number
  boxShadow?: string
  borderColor?: string
  filter?: string
  [key: string]: any // Allow any CSS property
}

export interface HoverOptions {
  effect?: SwiftUIHoverEffect
  hoverStyles?: HoverStyles
  transition?: string | number
  isEnabled?: boolean
}

export type ReactiveHoverOptions = ReactiveModifierProps<HoverOptions>

export class HoverModifier extends BaseModifier<HoverOptions> {
  readonly type = 'hover'
  readonly priority = 15
  private static hoverCount = 0

  constructor(options: ReactiveHoverOptions) {
    const resolvedOptions: HoverOptions = {}
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

    // Check if hover effects are enabled
    const isEnabled = this.properties.isEnabled !== false
    if (!isEnabled) return undefined

    // Generate unique class for hover states
    const hoverClass = `tachui-hover-${++HoverModifier.hoverCount}`
    context.element.classList.add(hoverClass)

    // Add hover styles to stylesheet
    this.addHoverStyles(hoverClass, this.properties)

    return undefined
  }

  private addHoverStyles(className: string, props: HoverOptions): void {
    const styleSheet = this.getOrCreateStyleSheet()

    // Base transition styles
    const transition = this.formatTransition(props.transition)
    if (transition) {
      const transitionRule = `.${className} { transition: ${transition}; }`
      try {
        styleSheet.insertRule(transitionRule)
      } catch (e) {
        console.warn('Failed to add transition rule:', e)
      }
    }

    // Hover effect styles
    const hoverStyles = this.computeHoverStyles(props)
    if (Object.keys(hoverStyles).length > 0) {
      // Use !important for critical hover properties that might conflict with inline styles
      const cssPropertiesWithImportant = Object.entries(hoverStyles)
        .map(([prop, value]) => {
          const cssProperty = this.toCSSProperty(prop)
          // Add !important to properties commonly overridden by inline styles
          // Note: Exclude 'transform' to prevent conflicts with button press states
          const needsImportant = [
            'background-color',
            'background',
            'border-color',
            'color',
          ].includes(cssProperty)
          return `${cssProperty}: ${value}${needsImportant ? ' !important' : ''}`
        })
        .join('; ')

      const hoverRule = `.${className}:hover { ${cssPropertiesWithImportant} }`

      try {
        styleSheet.insertRule(hoverRule)
      } catch (e) {
        console.warn('Failed to add hover rule:', e)
      }
    }
  }

  private computeHoverStyles(props: HoverOptions): HoverStyles {
    const styles: HoverStyles = {}

    // Apply preset SwiftUI effect if specified
    if (props.effect) {
      Object.assign(styles, this.getSwiftUIEffectStyles(props.effect))
    }

    // Apply custom hover styles (these override preset effects)
    if (props.hoverStyles) {
      Object.assign(styles, props.hoverStyles)
    }

    return styles
  }

  private getSwiftUIEffectStyles(effect: SwiftUIHoverEffect): HoverStyles {
    switch (effect) {
      case 'automatic':
        return {
          transform: 'scale(1.02)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }

      case 'highlight':
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          filter: 'brightness(0.95)',
        }

      case 'lift':
        return {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        }

      case 'scale':
        return {
          transform: 'scale(1.05)',
        }

      default:
        return {}
    }
  }

  private formatTransition(transition?: string | number): string {
    if (transition === undefined) {
      return 'all 200ms ease' // Default transition
    }

    if (typeof transition === 'number') {
      return `all ${transition}ms ease`
    }

    return transition
  }

  private getOrCreateStyleSheet(): CSSStyleSheet {
    const existingStyle = document.getElementById('tachui-hover-styles')

    if (existingStyle && existingStyle instanceof HTMLStyleElement) {
      return existingStyle.sheet!
    }

    const style = document.createElement('style')
    style.id = 'tachui-hover-styles'
    document.head.appendChild(style)
    return style.sheet!
  }
}

// ============================================================================
// Effects Functions
// ============================================================================

/**
 * Enhanced cursor modifier with complete CSS cursor support
 *
 * @example
 * ```typescript
 * .cursor('pointer')           // Standard pointer cursor
 * .cursor('grab')              // Grab cursor for draggable elements
 * .cursor('zoom-in')           // Zoom cursor for zoomable content
 * .cursor('url(custom.cur), pointer')  // Custom cursor with fallback
 * ```
 */
export function cursor(value: CSSCursorValue): CursorModifier {
  return new CursorModifier({ cursor: value })
}

/**
 * SwiftUI-style hover effect modifier with preset effects
 *
 * @example
 * ```typescript
 * .hoverEffect('automatic')     // Default SwiftUI hover with scale + shadow
 * .hoverEffect('lift')          // Elevation effect with shadow
 * .hoverEffect('highlight')     // Subtle background change
 * .hoverEffect('scale')         // Scale transform only
 * ```
 */
export function hoverEffect(
  effect: SwiftUIHoverEffect,
  isEnabled?: boolean | Signal<boolean>
): HoverModifier {
  return new HoverModifier({ effect, isEnabled })
}

/**
 * Custom hover styles with optional transition
 *
 * @example
 * ```typescript
 * .hover({
 *   backgroundColor: '#f0f0f0',
 *   transform: 'scale(1.05)'
 * })
 * .hover({
 *   opacity: 0.8,
 *   filter: 'blur(2px)'
 * }, 300)
 * ```
 */
export function hover(
  styles: HoverStyles,
  transition?: string | number
): HoverModifier {
  return new HoverModifier({ hoverStyles: styles, transition })
}

/**
 * Hover styles with explicit transition duration
 *
 * @example
 * ```typescript
 * .hoverWithTransition({
 *   transform: 'rotate(5deg)',
 *   color: '#007AFF'
 * }, 250)
 * ```
 */
export function hoverWithTransition(
  styles: HoverStyles,
  duration: number = 200
): HoverModifier {
  return new HoverModifier({ hoverStyles: styles, transition: duration })
}

/**
 * Conditional hover effect - can be toggled on/off
 *
 * @example
 * ```typescript
 * .conditionalHover('lift', isInteractive)  // Signal<boolean>
 * .conditionalHover('highlight', false)     // Disabled
 * ```
 */
export function conditionalHover(
  effect: SwiftUIHoverEffect,
  isEnabled: boolean | Signal<boolean>
): HoverModifier {
  return new HoverModifier({ effect, isEnabled })
}

// ============================================================================
// Cursor Presets - Common cursor patterns
// ============================================================================

/**
 * Interactive cursor - pointer with hover effect
 */
export function interactiveCursor(): CursorModifier {
  return cursor('pointer')
}

/**
 * Draggable cursor - grab when idle, grabbing when active
 */
export function draggableCursor(): CursorModifier {
  return cursor('grab')
}

/**
 * Text selection cursor
 */
export function textCursor(): CursorModifier {
  return cursor('text')
}

/**
 * Disabled/not-allowed cursor
 */
export function disabledCursor(): CursorModifier {
  return cursor('not-allowed')
}

/**
 * Loading cursor
 */
export function loadingCursor(): CursorModifier {
  return cursor('wait')
}

/**
 * Help cursor
 */
export function helpCursor(): CursorModifier {
  return cursor('help')
}

/**
 * Zoom cursor for zoomable content
 */
export function zoomCursor(mode: 'in' | 'out' = 'in'): CursorModifier {
  return cursor(mode === 'in' ? 'zoom-in' : 'zoom-out')
}

// ============================================================================
// Hover Effect Presets - Common interaction patterns
// ============================================================================

/**
 * Button hover effect - lift with shadow
 */
export function buttonHover(): HoverModifier {
  return hoverEffect('lift')
}

/**
 * Card hover effect - subtle scale and shadow
 */
export function cardHover(): HoverModifier {
  return hoverEffect('automatic')
}

/**
 * Link hover effect - highlight background
 */
export function linkHover(): HoverModifier {
  return hoverEffect('highlight')
}

/**
 * Image hover effect - scale on hover
 */
export function imageHover(): HoverModifier {
  return hoverEffect('scale')
}

/**
 * Active state effect for pressed/mousedown states
 *
 * @example
 * ```typescript
 * .active({ opacity: 0.8, transform: 'scale(0.95)' })  // Pressed effect
 * .active({ backgroundColor: '#e0e0e0' })             // Active background
 * ```
 */
export function active(styles: HoverStyles): HoverModifier {
  return new HoverModifier({ hoverStyles: styles })
}

/**
 * Focus state effect for keyboard navigation and accessibility
 *
 * @example
 * ```typescript
 * .focus({ outline: '2px solid #007AFF' })              // Focus outline
 * .focus({ boxShadow: '0 0 0 3px rgba(0,122,255,0.3)' }) // Focus glow
 * .focus({ borderColor: '#007AFF' })                    // Focus border
 * ```
 */
export function focus(styles: HoverStyles): HoverModifier {
  return new HoverModifier({ hoverStyles: styles })
}

/**
 * Pressed state effect (alias for active)
 *
 * @example
 * ```typescript
 * .pressed({ opacity: 0.9 })                          // Slightly transparent when pressed
 * .pressed({ transform: 'scale(0.98)' })              // Slight scale reduction
 * ```
 */
export function pressed(styles: HoverStyles): HoverModifier {
  return new HoverModifier({ hoverStyles: styles })
}
