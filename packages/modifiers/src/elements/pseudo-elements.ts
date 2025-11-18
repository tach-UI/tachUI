/**
 * Pseudo-element Modifiers - ::before and ::after styling
 *
 * Provides comprehensive pseudo-element support for ::before and ::after
 * with dynamic stylesheet generation and flexible styling options.
 */

import type { DOMNode } from '@tachui/types/runtime'
import { BaseModifier } from '../base'
import type { ModifierContext } from '@tachui/types/modifiers'

export interface PseudoElementStyles {
  content?: string // Content for pseudo-element (required)
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  width?: number | string
  height?: number | string
  backgroundColor?: string
  color?: string
  fontSize?: number | string
  fontWeight?: string | number
  fontFamily?: string
  lineHeight?: number | string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  margin?: number | string
  marginTop?: number | string
  marginRight?: number | string
  marginBottom?: number | string
  marginLeft?: number | string
  padding?: number | string
  paddingTop?: number | string
  paddingRight?: number | string
  paddingBottom?: number | string
  paddingLeft?: number | string
  border?: string
  borderTop?: string
  borderRight?: string
  borderBottom?: string
  borderLeft?: string
  borderRadius?: number | string
  borderWidth?: number | string
  borderStyle?: string
  borderColor?: string
  boxShadow?: string
  textShadow?: string
  opacity?: number
  transform?: string
  transformOrigin?: string
  zIndex?: number
  display?: string
  flexDirection?: string
  flexWrap?: string
  alignItems?: string
  justifyContent?: string
  alignSelf?: string
  flex?: string
  flexGrow?: number
  flexShrink?: number
  flexBasis?: string
  order?: number
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto'
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'
  textOverflow?: 'clip' | 'ellipsis'
  cursor?: string
  pointerEvents?: 'auto' | 'none'
  visibility?: 'visible' | 'hidden'
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  filter?: string
  backdropFilter?: string
  transition?: string
  animation?: string
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase'
  verticalAlign?: string
  minWidth?: number | string
  minHeight?: number | string
  maxWidth?: number | string
  maxHeight?: number | string
  [key: string]: any // Allow any CSS property
}

export interface PseudoElementOptions {
  before?: PseudoElementStyles
  after?: PseudoElementStyles
}

export class PseudoElementModifier extends BaseModifier<PseudoElementOptions> {
  readonly type = 'pseudoElement'
  readonly priority = 50 // High priority to ensure pseudo-elements are applied last
  private static styleSheetId = 'tachui-pseudo-elements'
  private static elementCount = 0

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return undefined

    // Generate unique class for pseudo-element styles
    const pseudoClass = `tachui-pseudo-${++PseudoElementModifier.elementCount}`
    context.element.classList.add(pseudoClass)

    // Add pseudo-element styles to stylesheet
    if (this.properties.before) {
      this.addPseudoElementRule(pseudoClass, 'before', this.properties.before)
    }

    if (this.properties.after) {
      this.addPseudoElementRule(pseudoClass, 'after', this.properties.after)
    }

    return undefined
  }

  private addPseudoElementRule(
    className: string,
    pseudoType: 'before' | 'after',
    styles: PseudoElementStyles
  ): void {
    const styleSheet = this.getOrCreateStyleSheet()
    const cssRule = this.generatePseudoElementCSS(className, pseudoType, styles)

    try {
      styleSheet.insertRule(cssRule)
    } catch (e) {
      // Only log in non-test environments to avoid stderr noise
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        console.warn('Failed to add pseudo-element rule:', e)
      }
    }
  }

  private generatePseudoElementCSS(
    className: string,
    pseudoType: 'before' | 'after',
    styles: PseudoElementStyles
  ): string {
    const selector = `.${className}::${pseudoType}`
    const cssProperties: string[] = []

    // Ensure content property is set (required for pseudo-elements)
    if (!styles.content) {
      styles.content = '""'
    }

    Object.entries(styles).forEach(([prop, value]) => {
      if (value !== undefined) {
        const cssProperty = this.toCSSProperty(prop)
        const cssValue = this.formatCSSValue(prop, value)
        cssProperties.push(`${cssProperty}: ${cssValue}`)
      }
    })

    return `${selector} { ${cssProperties.join('; ')} }`
  }

  private formatCSSValue(property: string, value: any): string {
    // Handle special cases for pseudo-element properties
    if (property === 'content') {
      // Ensure content is properly quoted if it's not already
      if (typeof value === 'string') {
        if (!value.startsWith('"') && !value.startsWith("'")) {
          // Escape any existing quotes and wrap in quotes
          const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
          return `"${escapedValue}"`
        }
        return value
      }
      return '""'
    }

    if (typeof value === 'number') {
      // Properties that should be unitless
      const unitlessProperties = [
        'opacity',
        'z-index',
        'line-height',
        'flex-grow',
        'flex-shrink',
        'order',
        'column-count',
        'font-weight',
      ]

      if (unitlessProperties.includes(this.toCSSProperty(property))) {
        return String(value)
      }

      return `${value}px`
    }

    return String(value)
  }

  private getOrCreateStyleSheet(): CSSStyleSheet {
    const existingStyle = document.getElementById(
      PseudoElementModifier.styleSheetId
    )

    if (existingStyle && existingStyle instanceof HTMLStyleElement) {
      return existingStyle.sheet!
    }

    const style = document.createElement('style')
    style.id = PseudoElementModifier.styleSheetId

    try {
      document.head.appendChild(style)
    } catch (e) {
      // Handle case where document.head is missing or appendChild fails
      // Only log in non-test environments to avoid stderr noise
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        console.warn('Failed to append stylesheet to document.head:', e)
      }
    }

    return style.sheet!
  }

  protected toCSSProperty(prop: string): string {
    return prop.replace(/([A-Z])/g, '-$1').toLowerCase()
  }
}

// ============================================================================
// Core Pseudo-element Functions
// ============================================================================

/**
 * ::before pseudo-element modifier
 *
 * @example
 * ```typescript
 * .before({
 *   content: '★',
 *   position: 'absolute',
 *   left: -20,
 *   color: '#ffd700'
 * })
 * ```
 */
export function before(styles: PseudoElementStyles): PseudoElementModifier {
  return new PseudoElementModifier({ before: styles })
}

/**
 * ::after pseudo-element modifier
 *
 * @example
 * ```typescript
 * .after({
 *   content: '',
 *   position: 'absolute',
 *   bottom: 0,
 *   left: 0,
 *   right: 0,
 *   height: 2,
 *   backgroundColor: '#007AFF'
 * })
 * ```
 */
export function after(styles: PseudoElementStyles): PseudoElementModifier {
  return new PseudoElementModifier({ after: styles })
}

/**
 * Both ::before and ::after pseudo-elements
 *
 * @example
 * ```typescript
 * .pseudoElements({
 *   before: { content: '"', fontSize: 24, color: '#666' },
 *   after: { content: '"', fontSize: 24, color: '#666' }
 * })
 * ```
 */
export function pseudoElements(
  options: PseudoElementOptions
): PseudoElementModifier {
  return new PseudoElementModifier(options)
}
