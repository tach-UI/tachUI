/**
 * CSS Modifier - raw CSS properties
 *
 * Provides an escape hatch for applying raw CSS properties
 * that may not have dedicated modifiers yet, or for experimental
 * CSS features.
 */
import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'
export interface CSSOptions {
  [property: string]: string | number | undefined
}
export type ReactiveCSSOptions = ReactiveModifierProps<CSSOptions>
export declare class CSSModifier extends BaseModifier<CSSOptions> {
  readonly type = 'css'
  readonly priority = 5
  constructor(options: ReactiveCSSOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeCSSStyles
}
/**
 * Create a CSS modifier with raw CSS properties
 *
 * @example
 * ```typescript
 * // Apply raw CSS properties
 * .css({
 *   backdropFilter: 'blur(10px)',
 *   maskImage: 'linear-gradient(to bottom, black, transparent)',
 *   scrollBehavior: 'smooth',
 *   containerType: 'inline-size'
 * })
 *
 * // Mix camelCase and kebab-case (both work)
 * .css({
 *   backgroundColor: 'red',        // camelCase (recommended)
 *   'background-color': 'red',     // kebab-case (also works)
 *   WebkitTransform: 'scale(1.1)', // vendor prefixes
 *   '--custom-property': '42px'    // CSS custom properties
 * })
 *
 * // Experimental CSS features
 * .css({
 *   aspectRatio: '16/9',
 *   scrollSnapType: 'y mandatory',
 *   containIntrinsicSize: '300px',
 *   accentColor: '#007AFF'
 * })
 * ```
 */
export declare function css(properties: ReactiveCSSOptions): CSSModifier
/**
 * Convenience function for setting a single CSS property
 *
 * @example
 * ```typescript
 * .cssProperty('backdrop-filter', 'blur(10px)')
 * .cssProperty('scrollBehavior', 'smooth')
 * .cssProperty('aspectRatio', '16/9')
 * ```
 */
export declare function cssProperty(
  property: string,
  value: string | number
): CSSModifier
/**
 * Convenience function for CSS custom properties (CSS variables)
 *
 * @example
 * ```typescript
 * .cssVariable('primary-color', '#007AFF')
 * .cssVariable('spacing-unit', '8px')
 * .cssVariable('border-radius', '12px')
 * ```
 */
export declare function cssVariable(
  name: string,
  value: string | number
): CSSModifier
/**
 * Convenience function for vendor-prefixed properties
 *
 * @example
 * ```typescript
 * .cssVendor('webkit', 'transform', 'scale(1.1)')
 * .cssVendor('moz', 'user-select', 'none')
 * .cssVendor('ms', 'filter', 'blur(5px)')
 * ```
 */
export declare function cssVendor(
  prefix: 'webkit' | 'moz' | 'ms' | 'o',
  property: string,
  value: string | number
): CSSModifier
//# sourceMappingURL=css.d.ts.map
