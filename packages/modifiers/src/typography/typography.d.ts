/**
 * Typography Modifiers
 *
 * Comprehensive text styling modifiers
 */
import { BaseModifier } from '../basic/base'
import type { ModifierContext, FontWeight } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
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
  family?: string | any
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
export declare class TypographyModifier extends BaseModifier<TypographyOptions> {
  readonly type = 'typography'
  readonly priority = 30
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeTypographyStyles
  protected toCSSValue(value: number | string): string
}
export declare function typography(
  options: TypographyOptions
): TypographyModifier
export declare function textAlign(value: TextAlign): TypographyModifier
export declare function textTransform(value: TextTransform): TypographyModifier
export declare function textDecoration(
  value: TextDecoration
): TypographyModifier
export declare function fontSize(value: number | string): TypographyModifier
export declare function fontWeight(
  value: FontWeight | number
): TypographyModifier
export declare function lineHeight(value: number | string): TypographyModifier
export declare function letterSpacing(
  value: number | string
): TypographyModifier
export declare function textOverflow(
  value: 'clip' | 'ellipsis' | 'fade' | string
): TypographyModifier
export declare function whiteSpace(
  value: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces'
): TypographyModifier
export declare function overflow(
  value: 'visible' | 'hidden' | 'scroll' | 'auto'
): TypographyModifier
export declare function textCase(value: TextTransform): TypographyModifier
export declare function fontFamily(value: string | any): TypographyModifier
//# sourceMappingURL=typography.d.ts.map
