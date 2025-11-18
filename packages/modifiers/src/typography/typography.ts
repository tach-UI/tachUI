/**
 * Typography Modifiers
 *
 * Comprehensive text styling modifiers
 */

import { BaseModifier } from '../basic/base'
import type { ModifierContext, FontWeight } from '@tachui/types/modifiers'
import type { DOMNode } from '@tachui/types/runtime'
import type {
  Asset,
  ColorAssetProxy,
  ImageAssetProxy,
  FontAssetProxy,
} from '@tachui/core/assets'

type FontAssetInput = Asset | ColorAssetProxy | ImageAssetProxy | FontAssetProxy

// Re-export FontWeight for convenience
export type { FontWeight }

export type TextAlign =
  | 'left'
  | 'center'
  | 'right'
  | 'justify'
  | 'start'
  | 'end'
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'
export type TextDecoration = 'none' | 'underline' | 'overline' | 'line-through'
export type FontVariant = 'normal' | 'small-caps'
export type FontStyle = 'normal' | 'italic' | 'oblique'

export interface TypographyOptions {
  size?: number | string
  weight?: FontWeight | number
  family?: string | FontAssetInput
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
  whiteSpace?:
    | 'normal'
    | 'nowrap'
    | 'pre'
    | 'pre-wrap'
    | 'pre-line'
    | 'break-spaces'
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
}

export class TypographyModifier extends BaseModifier<TypographyOptions> {
  readonly type = 'typography'
  readonly priority = 30

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
      if (
        typeof props.family === 'object' &&
        props.family !== null
      ) {
        const familyObj = props.family as any
        if (typeof familyObj.resolve === 'function') {
          styles.fontFamily = familyObj.resolve()
        } else if (typeof familyObj.value === 'string') {
          styles.fontFamily = familyObj.value
        } else if (typeof familyObj.toString === 'function') {
          styles.fontFamily = familyObj.toString()
        } else {
          styles.fontFamily = String(familyObj)
        }
      } else {
        styles.fontFamily = props.family as string
      }
    }
    if (props.lineHeight !== undefined) {
      styles.lineHeight =
        typeof props.lineHeight === 'number'
          ? props.lineHeight.toString()
          : props.lineHeight
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
      styles.textTransform = `${props.transform} !important`
    }
    if (props.decoration !== undefined) {
      styles.textDecoration = `${props.decoration} !important`
    }
    if (props.variant !== undefined) {
      styles.fontVariant = props.variant
    }
    if (props.style !== undefined) {
      styles.fontStyle = props.style
    }
    if (props.color !== undefined) {
      if (
        typeof props.color === 'object' &&
        props.color !== null &&
        'resolve' in props.color
      ) {
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

  protected toCSSValue(value: number | string): string {
    return typeof value === 'number' ? `${value}px` : value
  }
}

export function typography(options: TypographyOptions): TypographyModifier {
  return new TypographyModifier(options)
}

export function textAlign(value: TextAlign): TypographyModifier {
  return new TypographyModifier({ align: value })
}

export function textTransform(value: TextTransform): TypographyModifier {
  return new TypographyModifier({ transform: value })
}

export function textDecoration(value: TextDecoration): TypographyModifier {
  return new TypographyModifier({ decoration: value })
}

export function fontSize(value: number | string): TypographyModifier {
  return new TypographyModifier({ size: value })
}

export function fontWeight(value: FontWeight | number): TypographyModifier {
  return new TypographyModifier({ weight: value })
}

export function lineHeight(value: number | string): TypographyModifier {
  return new TypographyModifier({ lineHeight: value })
}

export function letterSpacing(value: number | string): TypographyModifier {
  return new TypographyModifier({ letterSpacing: value })
}

export function textOverflow(
  value: 'clip' | 'ellipsis' | 'fade' | string
): TypographyModifier {
  return new TypographyModifier({ textOverflow: value })
}

export function whiteSpace(
  value: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces'
): TypographyModifier {
  return new TypographyModifier({ whiteSpace: value })
}

export function overflow(
  value: 'visible' | 'hidden' | 'scroll' | 'auto'
): TypographyModifier {
  return new TypographyModifier({ overflow: value })
}

export function textCase(value: TextTransform): TypographyModifier {
  return textTransform(value)
}

export function fontFamily(value: string | FontAssetInput): TypographyModifier {
  return new TypographyModifier({ family: value })
}
