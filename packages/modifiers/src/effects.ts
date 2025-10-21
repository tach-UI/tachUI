/**
 * Effects Modifiers - Essential effects for the modifier system
 *
 * Key interactive effects integrated into the core modifier registry
 */

import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from './basic/base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/core/modifiers/types'

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
      const cssPropertiesWithImportant = Object.entries(hoverStyles)
        .map(([prop, value]) => {
          const cssProperty = this.toCSSProperty(prop)
          const needsImportant = [
            'background-color',
            'background',
            'border-color',
            'color',
            'transform',
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
// Effects Factory Functions
// ============================================================================

/**
 * Custom hover styles with optional transition
 */
export function hover(
  styles: HoverStyles,
  transition?: string | number
): HoverModifier {
  return new HoverModifier({ hoverStyles: styles, transition })
}

// NOTE: Other effects (cursor, filter, blur, brightness, contrast, transform, shadow)
// should be imported from @tachui/effects package to avoid architectural violations.
//
// Use:
//   import { blur, shadow, transform } from '@tachui/effects'
//   myComponent.apply(blur(5)).apply(shadow({...}))
