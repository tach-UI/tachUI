/**
 * Border Modifier - comprehensive border styling
 *
 * Provides a unified interface for border properties
 * with support for directional borders and shorthand.
 */

import { createComputed } from '../reactive/computed'
import type { Signal } from '../reactive/types'
import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps, ColorValue } from './types'
// Corner radius types (extracted from enhanced.ts)
export type CornerRadiusValue = number | string

export interface CornerRadiusConfig {
  // Individual corners (CSS terminology)
  topLeft?: CornerRadiusValue
  topRight?: CornerRadiusValue
  bottomLeft?: CornerRadiusValue
  bottomRight?: CornerRadiusValue
  
  // SwiftUI terminology (aliases)
  topLeading?: CornerRadiusValue
  topTrailing?: CornerRadiusValue
  bottomLeading?: CornerRadiusValue
  bottomTrailing?: CornerRadiusValue
  
  // Shorthand properties
  top?: CornerRadiusValue     // topLeft and topRight
  bottom?: CornerRadiusValue  // bottomLeft and bottomRight
  left?: CornerRadiusValue    // topLeft and bottomLeft
  right?: CornerRadiusValue   // topRight and bottomRight
}

export interface BorderSide {
  width?: number | string | Signal<number>
  color?: ColorValue
  style?: BorderStyle
}

export interface BorderOptions {
  // Individual sides (CSS terminology)
  top?: BorderSide
  right?: BorderSide
  bottom?: BorderSide
  left?: BorderSide
  all?: BorderSide
  
  // SwiftUI terminology (aliases)
  leading?: BorderSide
  trailing?: BorderSide
  
  // Shorthand properties
  horizontal?: BorderSide  // left and right
  vertical?: BorderSide    // top and bottom

  // Convenience properties (applied to all sides if no specific sides are set)
  width?: number | string | Signal<number>
  color?: ColorValue
  style?: BorderStyle
  
  // Advanced features
  image?: string | Signal<string>           // CSS border-image
  radius?: CornerRadiusConfig | Signal<CornerRadiusConfig>  // Integrated corner radius
}

export type BorderStyle =
  | 'none'
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'double'
  | 'groove'
  | 'ridge'
  | 'inset'
  | 'outset'

export type ReactiveBorderOptions = ReactiveModifierProps<BorderOptions>


export class BorderModifier extends BaseModifier<BorderOptions> {
  readonly type = 'border'
  readonly priority = 40 // Priority 40 for borders

  constructor(options: ReactiveBorderOptions) {
    // Convert reactive options to regular options for immediate use
    const resolvedOptions: BorderOptions = {}
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

    const styles = this.computeBorderStyles(this.properties)
    this.applyStyles(context.element, styles)
    
    return undefined
  }

  private computeBorderStyles(props: BorderOptions) {
    const styles: Record<string, any> = {}

    // Helper to format border width
    const formatBorderWidth = (width: number | string | Signal<number>) => {
      if (typeof width === 'function') {
        // For Signal values, create a computed that returns the px value
        return createComputed(() => `${width()}px`)
      }
      if (typeof width === 'number') {
        return `${width}px`
      }
      return width
    }

    // Helper to resolve color value (including Assets)
    const resolveColor = (color: ColorValue) => {
      if (typeof color === 'function') {
        // Handle Signal
        return createComputed(() => {
          const value = color()
          return this.resolveColorValue(value)
        })
      }
      return this.resolveColorValue(color)
    }

    // Resolve shorthand and SwiftUI terminology
    const resolvedSides = this.resolveBorderSides(props)

    // Apply convenience properties to all sides (if no specific sides are defined)
    const hasSpecificSides = resolvedSides.top || resolvedSides.right || resolvedSides.bottom || resolvedSides.left || props.all
    if (
      !hasSpecificSides &&
      (props.width !== undefined || props.color !== undefined || props.style !== undefined)
    ) {
      if (props.width !== undefined) styles.borderWidth = formatBorderWidth(props.width)
      if (props.color !== undefined) styles.borderColor = resolveColor(props.color)
      if (props.style !== undefined) styles.borderStyle = props.style
    }

    // Apply 'all' border (overrides convenience properties)
    if (props.all !== undefined) {
      if (props.all.width !== undefined) styles.borderWidth = formatBorderWidth(props.all.width)
      if (props.all.color !== undefined) styles.borderColor = resolveColor(props.all.color)
      if (props.all.style !== undefined) styles.borderStyle = props.all.style
    }

    // Apply specific sides (highest priority)
    if (resolvedSides.top !== undefined) {
      this.applySideBorder(styles, resolvedSides.top, 'Top', formatBorderWidth, resolveColor)
    }
    if (resolvedSides.right !== undefined) {
      this.applySideBorder(styles, resolvedSides.right, 'Right', formatBorderWidth, resolveColor)
    }
    if (resolvedSides.bottom !== undefined) {
      this.applySideBorder(styles, resolvedSides.bottom, 'Bottom', formatBorderWidth, resolveColor)
    }
    if (resolvedSides.left !== undefined) {
      this.applySideBorder(styles, resolvedSides.left, 'Left', formatBorderWidth, resolveColor)
    }

    // Advanced features
    if (props.image !== undefined) {
      if (typeof props.image === 'function') {
        styles.borderImage = createComputed(() => (props.image as Signal<string>)())
      } else {
        styles.borderImage = props.image
      }
    }

    // Integrated corner radius
    if (props.radius !== undefined) {
      const radiusValue = typeof props.radius === 'function' ? (props.radius as Signal<CornerRadiusConfig>)() : props.radius
      Object.assign(styles, this.generateCornerRadiusStyles(radiusValue))
    }

    return styles
  }

  private resolveBorderSides(props: BorderOptions) {
    return {
      top: props.top || props.vertical,
      right: props.right || props.trailing || props.horizontal,
      bottom: props.bottom || props.vertical,
      left: props.left || props.leading || props.horizontal
    }
  }

  private applySideBorder(
    styles: Record<string, any>,
    side: BorderSide,
    sideName: string,
    formatBorderWidth: (width: number | string | Signal<number>) => any,
    resolveColor: (color: ColorValue) => any
  ) {
    if (side.width !== undefined) {
      styles[`border${sideName}Width`] = formatBorderWidth(side.width)
    }
    if (side.color !== undefined) {
      styles[`border${sideName}Color`] = resolveColor(side.color)
    }
    if (side.style !== undefined) {
      styles[`border${sideName}Style`] = side.style
    }
  }

  private resolveColorValue(color: string | any): string {
    // Handle Asset objects with resolve method
    if (typeof color === 'object' && color !== null && 'resolve' in color) {
      return (color as any).resolve()
    }
    // Handle Asset objects with value property
    if (typeof color === 'object' && color !== null && 'value' in color) {
      return (color as any).value
    }
    // Handle ColorAssetProxy objects with toString method
    if (typeof color === 'object' && color !== null && typeof color.toString === 'function') {
      return color.toString()
    }
    // Handle string colors
    return String(color)
  }

  private generateCornerRadiusStyles(radius: CornerRadiusConfig): Record<string, string> {
    const styles: Record<string, string> = {}
    
    if (typeof radius === 'number' || typeof radius === 'string') {
      styles.borderRadius = typeof radius === 'number' ? `${radius}px` : radius
      return styles
    }
    
    // Handle CornerRadiusConfig object
    const corners = {
      topLeft: radius.topLeft ?? radius.topLeading ?? radius.top ?? radius.left,
      topRight: radius.topRight ?? radius.topTrailing ?? radius.top ?? radius.right,
      bottomLeft: radius.bottomLeft ?? radius.bottomLeading ?? radius.bottom ?? radius.left,
      bottomRight: radius.bottomRight ?? radius.bottomTrailing ?? radius.bottom ?? radius.right
    }
    
    Object.entries(corners).forEach(([corner, value]) => {
      if (value !== undefined) {
        const cssProperty = this.cornerToCSSProperty(corner as keyof typeof corners)
        styles[cssProperty] = typeof value === 'number' ? `${value}px` : value
      }
    })
    
    return styles
  }

  private cornerToCSSProperty(corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'): string {
    const map = {
      topLeft: 'borderTopLeftRadius',
      topRight: 'borderTopRightRadius',
      bottomLeft: 'borderBottomLeftRadius',
      bottomRight: 'borderBottomRightRadius'
    }
    return map[corner]
  }
}

/**
 * Create a border modifier with flexible options and advanced features
 *
 * @example
 * ```typescript
 * // Simple border - all sides
 * .border({ width: 1, color: '#e0e0e0' })
 * .border(1, '#e0e0e0', 'solid')  // Shorthand
 *
 * // Specific sides
 * .border({
 *   top: { width: 2, color: '#007AFF' },
 *   bottom: { width: 1, color: '#ddd' }
 * })
 *
 * // SwiftUI terminology
 * .border({
 *   leading: { width: 2, color: '#007AFF' },
 *   trailing: { width: 1, color: '#ddd' }
 * })
 *
 * // Shorthand properties
 * .border({
 *   horizontal: { width: 2, color: '#007AFF' },
 *   vertical: { width: 1, color: '#ddd' }
 * })
 *
 * // Advanced features
 * .border({
 *   width: 1,
 *   color: '#007AFF',
 *   image: 'url(border-pattern.png)',
 *   radius: { topLeft: 8, topRight: 8 }
 * })
 *
 * // Reactive values with Signals
 * .border({
 *   width: () => isActive() ? 2 : 1,
 *   color: () => theme().borderColor,
 *   style: 'dashed'
 * })
 * ```
 */
export function border(options: ReactiveBorderOptions): BorderModifier
export function border(
  width: number | string | Signal<number>,
  color?: ColorValue,
  style?: BorderStyle
): BorderModifier
export function border(
  optionsOrWidth: ReactiveBorderOptions | number | string | Signal<number>,
  color?: ColorValue,
  style?: BorderStyle
): BorderModifier {
  if (typeof optionsOrWidth === 'number' || typeof optionsOrWidth === 'string' || typeof optionsOrWidth === 'function') {
    return new BorderModifier({ 
      width: optionsOrWidth, 
      color: color || 'currentColor', 
      style: style || 'solid'
    })
  }
  return new BorderModifier(optionsOrWidth)
}

/**
 * Convenience function for top border only with enhanced support
 *
 * @example
 * ```typescript
 * .borderTop(1, '#e0e0e0')
 * .borderTop('2px', signalColor(), 'dashed')
 * .borderTop(() => isActive() ? 2 : 1, '#007AFF')
 * ```
 */
export function borderTop(
  width: number | string | Signal<number>,
  color: ColorValue,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ top: { width, color, style } })
}

/**
 * Convenience function for right border only with enhanced support
 *
 * @example
 * ```typescript
 * .borderRight(1, '#ddd')
 * .borderRight('1px', () => theme().borderColor, 'dotted')
 * ```
 */
export function borderRight(
  width: number | string | Signal<number>,
  color: ColorValue,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ right: { width, color, style } })
}

/**
 * Convenience function for bottom border only with enhanced support
 *
 * @example
 * ```typescript
 * .borderBottom(2, '#007AFF')
 * .borderBottom('1px', '#e0e0e0', 'solid')
 * .borderBottom(() => isHovered() ? 3 : 1, Assets.accent)
 * ```
 */
export function borderBottom(
  width: number | string | Signal<number>,
  color: ColorValue,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ bottom: { width, color, style } })
}

/**
 * Convenience function for left border only with enhanced support
 *
 * @example
 * ```typescript
 * .borderLeft(3, '#34C759')
 * .borderLeft('2px', () => statusColor(), 'dashed')
 * ```
 */
export function borderLeft(
  width: number | string | Signal<number>,
  color: ColorValue,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ left: { width, color, style } })
}

/**
 * SwiftUI-style leading border (LTR-aware)
 *
 * @example
 * ```typescript
 * .borderLeading(2, '#007AFF', 'solid')
 * ```
 */
export function borderLeading(
  width: number | string | Signal<number>,
  color: ColorValue,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ leading: { width, color, style } })
}

/**
 * SwiftUI-style trailing border (LTR-aware)
 *
 * @example
 * ```typescript
 * .borderTrailing(1, '#ddd', 'dotted')
 * ```
 */
export function borderTrailing(
  width: number | string | Signal<number>,
  color: ColorValue,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ trailing: { width, color, style } })
}

/**
 * Horizontal borders (left + right)
 *
 * @example
 * ```typescript
 * .borderHorizontal(1, '#e0e0e0')
 * ```
 */
export function borderHorizontal(
  width: number | string | Signal<number>,
  color: ColorValue,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ horizontal: { width, color, style } })
}

/**
 * Vertical borders (top + bottom)
 *
 * @example
 * ```typescript
 * .borderVertical(2, '#007AFF', 'dashed')
 * ```
 */
export function borderVertical(
  width: number | string | Signal<number>,
  color: ColorValue,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ vertical: { width, color, style } })
}

// ============================================================================
// Corner Radius Functions (Moved from enhanced.ts)
// ============================================================================

export interface CornerRadiusOptions {
  radius: number | string | CornerRadiusConfig
}

export type ReactiveCornerRadiusOptions = ReactiveModifierProps<CornerRadiusOptions>

export class CornerRadiusModifier extends BaseModifier<CornerRadiusOptions> {
  readonly type = 'cornerRadius'
  readonly priority = 35

  constructor(options: ReactiveCornerRadiusOptions) {
    const resolvedOptions: CornerRadiusOptions = { radius: 0 }
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

    const styles = this.computeCornerRadiusStyles(this.properties.radius)
    this.applyStyles(context.element, styles)
    
    return undefined
  }

  private computeCornerRadiusStyles(radius: number | string | CornerRadiusConfig) {
    if (typeof radius === 'number' || typeof radius === 'string') {
      // Existing API - single value for all corners
      return { borderRadius: this.formatRadius(radius) }
    }
    
    // New object-based API
    return this.generateCornerRadiusCSS(radius)
  }

  private generateCornerRadiusCSS(config: CornerRadiusConfig): Record<string, string> {
    const corners = this.resolveCornerValues(config)
    const styles: Record<string, string> = {}
    
    // Only apply styles for corners that have actual values
    Object.entries(corners).forEach(([corner, value]) => {
      if (value !== undefined) {
        const cssProperty = this.cornerToCSSProperty(corner as keyof typeof corners)
        styles[cssProperty] = this.formatRadius(value)
      }
    })
    
    return styles
  }

  private cornerToCSSProperty(corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'): string {
    const map = {
      topLeft: 'borderTopLeftRadius',
      topRight: 'borderTopRightRadius',
      bottomLeft: 'borderBottomLeftRadius',
      bottomRight: 'borderBottomRightRadius'
    }
    return map[corner]
  }

  private resolveCornerValues(config: CornerRadiusConfig) {
    return {
      topLeft: config.topLeft ?? config.topLeading ?? config.top ?? config.left,
      topRight: config.topRight ?? config.topTrailing ?? config.top ?? config.right,
      bottomLeft: config.bottomLeft ?? config.bottomLeading ?? config.bottom ?? config.left,
      bottomRight: config.bottomRight ?? config.bottomTrailing ?? config.bottom ?? config.right
    }
  }

  private formatRadius(value: CornerRadiusValue): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    return value
  }
}

/**
 * Enhanced cornerRadius modifier with backward compatibility
 *
 * @example
 * ```typescript
 * .cornerRadius(8)                          // All corners
 * .cornerRadius('50%')                      // Circular/oval shape
 * .cornerRadius({ topLeft: 8, topRight: 8}) // Top corners only
 * .cornerRadius({ 
 *   topLeading: 12, 
 *   topTrailing: 12,
 *   bottomLeading: 4,
 *   bottomTrailing: 4
 * })
 * ```
 */
export function cornerRadius(value: number | string): CornerRadiusModifier
export function cornerRadius(config: CornerRadiusConfig): CornerRadiusModifier
export function cornerRadius(value: number | string | CornerRadiusConfig): CornerRadiusModifier {
  return new CornerRadiusModifier({ radius: value })
}
