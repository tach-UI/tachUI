/**
 * Decorative Pseudo-element Modifiers
 *
 * Common decorative patterns using pseudo-elements for icons, lines, badges,
 * tooltips, ribbons, and loading indicators.
 */

import {
  before,
  after,
  type PseudoElementStyles,
  PseudoElementModifier,
} from './pseudo-elements'

// ============================================================================
// Icon Modifiers
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
    ...styles,
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
    ...styles,
  })
}

// ============================================================================
// Line Decorations
// ============================================================================

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
    verticalAlign: 'middle',
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
    verticalAlign: 'middle',
  })
}

// ============================================================================
// Text Decorations
// ============================================================================

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
      marginRight: 4,
    },
    after: {
      content: closeQuote,
      fontSize: '1.2em',
      color: '#666',
      marginLeft: 4,
    },
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
    opacity,
  })
}

// ============================================================================
// Interactive Decorations
// ============================================================================

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
    justifyContent: 'center',
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
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: 5,
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: 5,
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: 5,
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: 5,
    },
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
    ...positionStyles[position],
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
    zIndex: 10,
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
  // Add spinner animation to global styles if not already present
  if (!document.getElementById('tachui-spinner-animation')) {
    const style = document.createElement('style')
    style.id = 'tachui-spinner-animation'
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }

  return before({
    content: '',
    display: 'inline-block',
    width: size,
    height: size,
    border: `${borderWidth}px solid transparent`,
    borderTop: `${borderWidth}px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  })
}

// Re-export PseudoElementModifier for testing
export { PseudoElementModifier }
