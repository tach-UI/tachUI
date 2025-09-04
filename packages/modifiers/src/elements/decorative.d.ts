/**
 * Decorative Pseudo-element Modifiers
 *
 * Common decorative patterns using pseudo-elements for icons, lines, badges,
 * tooltips, ribbons, and loading indicators.
 */
import {
  type PseudoElementStyles,
  PseudoElementModifier,
} from './pseudo-elements'
/**
 * Icon before content using a Unicode character
 *
 * @example
 * ```typescript
 * .iconBefore('★', { color: '#ffd700', marginRight: 8 })
 * .iconBefore('→', { color: '#007AFF' })
 * ```
 */
export declare function iconBefore(
  icon: string,
  styles?: Omit<PseudoElementStyles, 'content'>
): PseudoElementModifier
/**
 * Icon after content using a Unicode character
 *
 * @example
 * ```typescript
 * .iconAfter('→', { color: '#007AFF', marginLeft: 8 })
 * .iconAfter('✓', { color: '#34c759' })
 * ```
 */
export declare function iconAfter(
  icon: string,
  styles?: Omit<PseudoElementStyles, 'content'>
): PseudoElementModifier
/**
 * Decorative line before content
 *
 * @example
 * ```typescript
 * .lineBefore()                    // Default line
 * .lineBefore('#007AFF', 2, 20)    // Blue line, 2px thick, 20px long
 * ```
 */
export declare function lineBefore(
  color?: string,
  thickness?: number,
  length?: number
): PseudoElementModifier
/**
 * Decorative line after content
 *
 * @example
 * ```typescript
 * .lineAfter()                     // Default line
 * .lineAfter('#007AFF', 2, 20)     // Blue line, 2px thick, 20px long
 * ```
 */
export declare function lineAfter(
  color?: string,
  thickness?: number,
  length?: number
): PseudoElementModifier
/**
 * Quote marks around content
 *
 * @example
 * ```typescript
 * .quotes()                        // Default quotes (" ")
 * .quotes('«', '»')               // Custom quote characters
 * ```
 */
export declare function quotes(
  openQuote?: string,
  closeQuote?: string
): PseudoElementModifier
/**
 * Underline decoration using ::after
 *
 * @example
 * ```typescript
 * .underline()                     // Default underline
 * .underline('#007AFF', 2, 0.2)    // Blue underline, 2px thick, 20% opacity
 * ```
 */
export declare function underline(
  color?: string,
  thickness?: number,
  opacity?: number
): PseudoElementModifier
/**
 * Badge or notification dot using ::after
 *
 * @example
 * ```typescript
 * .badge()                         // Default red dot
 * .badge('#007AFF', 8, '2')        // Blue badge with "2" text
 * ```
 */
export declare function badge(
  color?: string,
  size?: number,
  text?: string
): PseudoElementModifier
/**
 * Tooltip using ::before with positioning
 *
 * @example
 * ```typescript
 * .tooltip('This is a tooltip')
 * .tooltip('Custom tooltip', 'bottom', '#333')
 * ```
 */
export declare function tooltip(
  text: string,
  position?: 'top' | 'bottom' | 'left' | 'right',
  backgroundColor?: string,
  textColor?: string
): PseudoElementModifier
/**
 * Corner ribbon using ::before
 *
 * @example
 * ```typescript
 * .cornerRibbon('New!')            // Default red ribbon
 * .cornerRibbon('Sale', '#ff9500') // Orange sale ribbon
 * ```
 */
export declare function cornerRibbon(
  text: string,
  color?: string,
  textColor?: string
): PseudoElementModifier
/**
 * Loading spinner using ::before with animation
 *
 * @example
 * ```typescript
 * .spinner()                       // Default spinner
 * .spinner(16, '#007AFF', 2)       // Custom size, color, border width
 * ```
 */
export declare function spinner(
  size?: number,
  color?: string,
  borderWidth?: number
): PseudoElementModifier
export { PseudoElementModifier }
//# sourceMappingURL=decorative.d.ts.map
