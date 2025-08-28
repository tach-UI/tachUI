/**
 * Pseudo-element Modifiers - ::before and ::after styling
 *
 * Provides comprehensive pseudo-element support for ::before and ::after
 * with dynamic stylesheet generation and flexible styling options.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'

export interface PseudoElementStyles {
  content?: string                    // Content for pseudo-element (required)
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
  [key: string]: any  // Allow any CSS property
}

export interface PseudoElementOptions {
  before?: PseudoElementStyles
  after?: PseudoElementStyles
}

export type ReactivePseudoElementOptions = ReactiveModifierProps<PseudoElementOptions>

export class PseudoElementModifier extends BaseModifier<PseudoElementOptions> {
  readonly type = 'pseudoElement'
  readonly priority = 50  // High priority to ensure pseudo-elements are applied last
  private static styleSheetId = 'tachui-pseudo-elements'
  private static elementCount = 0

  constructor(options: ReactivePseudoElementOptions) {
    const resolvedOptions: PseudoElementOptions = {}
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
      console.warn('Failed to add pseudo-element rule:', e)
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
      if (typeof value === 'string' && !value.startsWith('"') && !value.startsWith("'")) {
        return `"${value}"`
      }
      return value
    }

    if (typeof value === 'number') {
      // Properties that should be unitless
      const unitlessProperties = [
        'opacity', 'z-index', 'line-height', 'flex-grow', 'flex-shrink', 
        'order', 'column-count', 'font-weight'
      ]
      
      if (unitlessProperties.includes(this.toCSSProperty(property))) {
        return String(value)
      }
      
      return `${value}px`
    }

    return String(value)
  }

  private getOrCreateStyleSheet(): CSSStyleSheet {
    const existingStyle = document.getElementById(PseudoElementModifier.styleSheetId)
    
    if (existingStyle && existingStyle instanceof HTMLStyleElement) {
      return existingStyle.sheet!
    }

    const style = document.createElement('style')
    style.id = PseudoElementModifier.styleSheetId
    document.head.appendChild(style)
    return style.sheet!
  }
}

// ============================================================================
// Pseudo-element Functions
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
export function pseudoElements(options: PseudoElementOptions): PseudoElementModifier {
  return new PseudoElementModifier(options)
}

// ============================================================================
// Common Pseudo-element Patterns
// ============================================================================

/**
 * Icon before content using a Unicode character
 *
 * @example
 * ```typescript
 * .iconBefore('★', { color: '#ffd700', marginRight: 8 })
 * .iconBefore('→', { color: '#007AFF' })
 * ```
 */
export function iconBefore(
  icon: string, 
  styles: Omit<PseudoElementStyles, 'content'> = {}
): PseudoElementModifier {
  return before({
    content: icon,
    display: 'inline-block',
    ...styles
  })
}

/**
 * Icon after content using a Unicode character
 *
 * @example
 * ```typescript
 * .iconAfter('→', { color: '#007AFF', marginLeft: 8 })
 * .iconAfter('✓', { color: '#34c759' })
 * ```
 */
export function iconAfter(
  icon: string, 
  styles: Omit<PseudoElementStyles, 'content'> = {}
): PseudoElementModifier {
  return after({
    content: icon,
    display: 'inline-block',
    ...styles
  })
}

/**
 * Decorative line before content
 *
 * @example
 * ```typescript
 * .lineBefore()                    // Default line
 * .lineBefore('#007AFF', 2, 20)    // Blue line, 2px thick, 20px long
 * ```
 */
export function lineBefore(
  color: string = '#ddd',
  thickness: number = 1,
  length: number = 16
): PseudoElementModifier {
  return before({
    content: '',
    display: 'inline-block',
    width: length,
    height: thickness,
    backgroundColor: color,
    marginRight: 8,
    verticalAlign: 'middle'
  })
}

/**
 * Decorative line after content
 *
 * @example
 * ```typescript
 * .lineAfter()                     // Default line
 * .lineAfter('#007AFF', 2, 20)     // Blue line, 2px thick, 20px long
 * ```
 */
export function lineAfter(
  color: string = '#ddd',
  thickness: number = 1,
  length: number = 16
): PseudoElementModifier {
  return after({
    content: '',
    display: 'inline-block',
    width: length,
    height: thickness,
    backgroundColor: color,
    marginLeft: 8,
    verticalAlign: 'middle'
  })
}

/**
 * Quote marks around content
 *
 * @example
 * ```typescript
 * .quotes()                        // Default quotes (" ")
 * .quotes('«', '»')               // Custom quote characters
 * ```
 */
export function quotes(
  openQuote: string = '"',
  closeQuote: string = '"'
): PseudoElementModifier {
  return new PseudoElementModifier({
    before: {
      content: openQuote,
      fontSize: '1.2em',
      color: '#666',
      marginRight: 4
    },
    after: {
      content: closeQuote,
      fontSize: '1.2em',
      color: '#666',
      marginLeft: 4
    }
  })
}

/**
 * Underline decoration using ::after
 *
 * @example
 * ```typescript
 * .underline()                     // Default underline
 * .underline('#007AFF', 2, 0.2)    // Blue underline, 2px thick, 20% opacity
 * ```
 */
export function underline(
  color: string = 'currentColor',
  thickness: number = 1,
  opacity: number = 1
): PseudoElementModifier {
  return after({
    content: '',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: thickness,
    backgroundColor: color,
    opacity
  })
}

/**
 * Badge or notification dot using ::after
 *
 * @example
 * ```typescript
 * .badge()                         // Default red dot
 * .badge('#007AFF', 8, '2')        // Blue badge with "2" text
 * ```
 */
export function badge(
  color: string = '#ff3b30',
  size: number = 6,
  text: string = ''
): PseudoElementModifier {
  return after({
    content: text,
    position: 'absolute',
    top: -2,
    right: -2,
    width: text ? 'auto' : size,
    height: size,
    minWidth: size,
    backgroundColor: color,
    borderRadius: '50%',
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    lineHeight: text ? size / 10 : 1,
    padding: text ? '2px 4px' : 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  })
}

/**
 * Tooltip using ::before with positioning
 *
 * @example
 * ```typescript
 * .tooltip('This is a tooltip')
 * .tooltip('Custom tooltip', 'bottom', '#333')
 * ```
 */
export function tooltip(
  text: string,
  position: 'top' | 'bottom' | 'left' | 'right' = 'top',
  backgroundColor: string = '#333',
  textColor: string = 'white'
): PseudoElementModifier {
  const positionStyles: Record<string, any> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 5 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 5 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 5 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 5 }
  }

  return before({
    content: text,
    position: 'absolute',
    backgroundColor,
    color: textColor,
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12,
    whiteSpace: 'nowrap',
    zIndex: 1000,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease',
    ...positionStyles[position]
  })
}

/**
 * Corner ribbon using ::before
 *
 * @example
 * ```typescript
 * .cornerRibbon('New!')            // Default red ribbon
 * .cornerRibbon('Sale', '#ff9500') // Orange sale ribbon
 * ```
 */
export function cornerRibbon(
  text: string,
  color: string = '#ff3b30',
  textColor: string = 'white'
): PseudoElementModifier {
  return before({
    content: text,
    position: 'absolute',
    top: 8,
    right: -8,
    backgroundColor: color,
    color: textColor,
    padding: '2px 12px',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    transform: 'rotate(45deg)',
    transformOrigin: 'center',
    zIndex: 10
  })
}

/**
 * Loading spinner using ::before with animation
 *
 * @example
 * ```typescript
 * .spinner()                       // Default spinner
 * .spinner(16, '#007AFF', 2)       // Custom size, color, border width
 * ```
 */
export function spinner(
  size: number = 20,
  color: string = '#007AFF',
  borderWidth: number = 2
): PseudoElementModifier {
  return before({
    content: '',
    display: 'inline-block',
    width: size,
    height: size,
    border: `${borderWidth}px solid transparent`,
    borderTop: `${borderWidth}px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  })
}