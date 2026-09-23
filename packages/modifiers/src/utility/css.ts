/**
 * CSS Modifier - raw CSS properties
 *
 * Provides an escape hatch for applying raw CSS properties
 * that may not have dedicated modifiers yet, or for experimental
 * CSS features.
 */

import type { DOMNode } from '@tachui/types/runtime'
import { BaseModifier } from '../basic/base'
import type {
  CSSStyleProperties,
  ModifierContext,
} from '@tachui/types/modifiers'
import type { Signal } from '@tachui/types/reactive'

export type CSSValue =
  | string
  | number
  | Signal<string>
  | Signal<number>
  | Signal<string | number>

export interface CSSOptions {
  [property: string]: CSSValue | undefined
}

export type ReactiveCSSOptions = CSSOptions

export class CSSModifier extends BaseModifier<CSSOptions> {
  readonly type = 'css'
  readonly priority = 5 // Very low priority so raw CSS doesn't override specific modifiers

  // Signals are kept as they are: `applyStyles` binds each one and updates the
  // property in place. Reading them here would freeze them at their first value.
  // The object itself is copied, so changing it after the call does not change
  // this modifier.
  constructor(options: CSSOptions) {
    super({ ...options })
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeCSSStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  // Values pass through unconverted: `applyStyles` turns each into CSS the
  // same way whether it is static or a signal's current value, which keeps a
  // number unitless where the property is (`opacity`, `z-index`) instead of
  // making it `0.5px`.
  private computeCSSStyles(props: CSSOptions): CSSStyleProperties {
    // No prototype, so a `__proto__` key is an ordinary (ignored) entry
    // rather than a write to the accumulator's prototype.
    const styles: CSSStyleProperties = Object.create(null)

    for (const [property, value] of Object.entries(props)) {
      if (value === undefined) continue
      if (isDevelopment()) warnIfNotADeclaration(property, value)
      // Convert camelCase to kebab-case for CSS properties
      styles[this.toCSSProperty(property)] = value
    }

    return styles
  }
}

function isDevelopment(): boolean {
  return (
    typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
  )
}

// Inline styles hold declarations only. A rule — an at-rule, a pseudo-class,
// a nested selector — or an object value is dropped by the browser without a
// word, so say so while developing.
function warnIfNotADeclaration(property: string, value: unknown): void {
  const isRule = /^[@&:]/.test(property) || /[{}\s]/.test(property.trim())
  const isObject =
    typeof value === 'object' && value !== null && !Array.isArray(value)

  if (isRule || isObject) {
    console.warn(
      `.css(): "${property}" is not an inline style declaration, so it was ` +
        'not applied. Rules such as @media, @supports and :hover belong in a ' +
        'stylesheet; give the component a class with the `css` prop.'
    )
  }
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
export function css(properties: ReactiveCSSOptions): CSSModifier {
  return new CSSModifier(properties)
}

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
export function cssProperty(property: string, value: CSSValue): CSSModifier {
  return new CSSModifier({ [property]: value })
}

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
export function cssVariable(name: string, value: CSSValue): CSSModifier {
  // Ensure the property starts with --
  const propertyName = name.startsWith('--') ? name : `--${name}`
  return new CSSModifier({ [propertyName]: value })
}

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
export function cssVendor(
  prefix: 'webkit' | 'moz' | 'ms' | 'o',
  property: string,
  value: CSSValue
): CSSModifier {
  // Convert to proper vendor prefix format
  const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1)
  const vendorProperty = `-${prefix.toLowerCase()}-${property}`
  const camelCaseProperty =
    capitalizedPrefix + property.charAt(0).toUpperCase() + property.slice(1)

  return new CSSModifier({
    [vendorProperty]: value,
    [camelCaseProperty]: value,
  })
}
