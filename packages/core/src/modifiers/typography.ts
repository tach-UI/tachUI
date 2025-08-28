/**
 * Typography Modifier - comprehensive text styling
 *
 * Provides a unified interface for text styling properties
 * including size, weight, alignment, transformation, and more.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'
import type { FontAsset } from '../assets/FontAsset'

export interface TypographyOptions {
  size?: number | string
  weight?: FontWeight | number
  family?: string | FontAsset
  lineHeight?: number | string
  letterSpacing?: number | string
  wordSpacing?: number | string
  align?: TextAlign
  transform?: TextTransform
  decoration?: TextDecoration
  variant?: FontVariant
  style?: FontStyle
  color?: string
  textOverflow?: 'clip' | 'ellipsis' | 'fade' | string
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces'
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
}

export type FontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
export type TextAlign = 'left' | 'center' | 'right' | 'justify' | 'start' | 'end'
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'
export type TextDecoration = 'none' | 'underline' | 'overline' | 'line-through'
export type FontVariant = 'normal' | 'small-caps'
export type FontStyle = 'normal' | 'italic' | 'oblique'

export type ReactiveTypographyOptions = ReactiveModifierProps<TypographyOptions>

export class TypographyModifier extends BaseModifier<TypographyOptions> {
  readonly type = 'typography'
  readonly priority = 30 // Priority 30 for text styling

  constructor(options: ReactiveTypographyOptions) {
    // Convert reactive options to regular options for immediate use
    const resolvedOptions: TypographyOptions = {}
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

    const styles = this.computeTypographyStyles(this.properties)
    this.applyStyles(context.element, styles)
    
    return undefined
  }

  private computeTypographyStyles(props: TypographyOptions) {
    const styles: Record<string, string> = {}

    if (props.size !== undefined) {
      styles.fontSize = this.toCSSValue(props.size)
    }
    if (props.weight !== undefined) {
      styles.fontWeight = String(props.weight)
    }
    if (props.family !== undefined) {
      // Handle FontAsset
      if (typeof props.family === 'object' && props.family !== null && 'resolve' in props.family) {
        styles.fontFamily = (props.family as FontAsset).resolve()
      } else {
        styles.fontFamily = props.family as string
      }
    }
    if (props.lineHeight !== undefined) {
      styles.lineHeight =
        typeof props.lineHeight === 'number' ? props.lineHeight.toString() : props.lineHeight
    }
    if (props.letterSpacing !== undefined) {
      styles.letterSpacing = this.toCSSValue(props.letterSpacing)
    }
    if (props.wordSpacing !== undefined) {
      styles.wordSpacing = this.toCSSValue(props.wordSpacing)
    }
    if (props.align !== undefined) {
      styles.textAlign = props.align
    }
    if (props.transform !== undefined) {
      // Use !important to ensure text-transform overrides any conflicting CSS
      styles.textTransform = `${props.transform} !important`
    }
    if (props.decoration !== undefined) {
      // Use !important to ensure text-decoration overrides any conflicting CSS
      styles.textDecoration = `${props.decoration} !important`
    }
    if (props.variant !== undefined) {
      styles.fontVariant = props.variant
    }
    if (props.style !== undefined) {
      styles.fontStyle = props.style
    }
    if (props.color !== undefined) {
      // Handle Asset objects
      if (typeof props.color === 'object' && props.color !== null && 'resolve' in props.color) {
        styles.color = (props.color as any).resolve()
      } else {
        styles.color = props.color as string
      }
    }
    if (props.textOverflow !== undefined) {
      styles.textOverflow = props.textOverflow
    }
    if (props.whiteSpace !== undefined) {
      styles.whiteSpace = props.whiteSpace
    }
    if (props.overflow !== undefined) {
      styles.overflow = props.overflow
    }

    return styles
  }
}

/**
 * Create a typography modifier with comprehensive text styling
 *
 * @example
 * ```typescript
 * // Complete text styling
 * .typography({
 *   size: 18,
 *   weight: '600',
 *   align: 'center',
 *   transform: 'uppercase',
 *   letterSpacing: '0.5px'
 * })
 *
 * // Font family and sizing
 * .typography({
 *   family: 'Inter, sans-serif',
 *   size: 16,
 *   lineHeight: 1.5
 * })
 * ```
 */
export function typography(options: ReactiveTypographyOptions): TypographyModifier {
  return new TypographyModifier(options)
}

/**
 * Convenience function for text alignment
 *
 * @example
 * ```typescript
 * .textAlign('center')
 * .textAlign('right')
 * ```
 */
export function textAlign(value: TextAlign): TypographyModifier {
  return new TypographyModifier({ align: value })
}

/**
 * Convenience function for text transformation
 *
 * @example
 * ```typescript
 * .textTransform('uppercase')
 * .textTransform('capitalize')
 * ```
 */
export function textTransform(value: TextTransform): TypographyModifier {
  return new TypographyModifier({ transform: value })
}

/**
 * Convenience function for text decoration
 *
 * @example
 * ```typescript
 * .textDecoration('underline')
 * .textDecoration('line-through')
 * .textDecoration('overline')
 * .textDecoration('none')
 * ```
 */
export function textDecoration(value: TextDecoration): TypographyModifier {
  return new TypographyModifier({ decoration: value })
}

/**
 * Convenience function for font size
 *
 * @example
 * ```typescript
 * .fontSize(16)
 * .fontSize('1.2rem')
 * ```
 */
export function fontSize(value: number | string): TypographyModifier {
  return new TypographyModifier({ size: value })
}

/**
 * Convenience function for font weight
 *
 * @example
 * ```typescript
 * .fontWeight('600')
 * .fontWeight('bold')
 * .fontWeight(700)
 * ```
 */
export function fontWeight(value: FontWeight | number): TypographyModifier {
  return new TypographyModifier({ weight: value })
}

/**
 * Convenience function for line height
 *
 * @example
 * ```typescript
 * .lineHeight(1.5)
 * .lineHeight('1.4rem')
 * ```
 */
export function lineHeight(value: number | string): TypographyModifier {
  return new TypographyModifier({ lineHeight: value })
}

/**
 * Convenience function for letter spacing
 *
 * @example
 * ```typescript
 * .letterSpacing('0.5px')
 * .letterSpacing(2)
 * ```
 */
export function letterSpacing(value: number | string): TypographyModifier {
  return new TypographyModifier({ letterSpacing: value })
}

/**
 * Convenience function for text overflow
 *
 * @example
 * ```typescript
 * .textOverflow('ellipsis')
 * .textOverflow('clip')
 * ```
 */
export function textOverflow(value: 'clip' | 'ellipsis' | 'fade' | string): TypographyModifier {
  return new TypographyModifier({ textOverflow: value } as any)
}

/**
 * Convenience function for white space handling
 *
 * @example
 * ```typescript
 * .whiteSpace('nowrap')
 * .whiteSpace('pre-wrap')
 * ```
 */
export function whiteSpace(
  value: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces'
): TypographyModifier {
  return new TypographyModifier({ whiteSpace: value } as any)
}

/**
 * Convenience function for overflow behavior
 *
 * @example
 * ```typescript
 * .overflow('hidden')
 * .overflow('scroll')
 * ```
 */
export function overflow(value: 'visible' | 'hidden' | 'scroll' | 'auto'): TypographyModifier {
  return new TypographyModifier({ overflow: value } as any)
}

/**
 * Convenience function for text case transformation (alias for textTransform)
 *
 * @example
 * ```typescript
 * .textCase('uppercase')
 * .textCase('capitalize')
 * ```
 */
export function textCase(value: TextTransform): TypographyModifier {
  return textTransform(value)
}

/**
 * Convenience function for font family
 *
 * @example
 * ```typescript
 * // With string
 * .fontFamily('Inter, sans-serif')
 * 
 * // With FontAsset
 * import { Assets } from '@tachui/core'
 * .fontFamily(Assets.bodyFont)
 * ```
 */
export function fontFamily(value: string | FontAsset): TypographyModifier {
  return new TypographyModifier({ family: value })
}
