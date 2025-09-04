/**
 * Border Modifiers
 *
 * Comprehensive border styling with radius support
 */
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
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
export interface BorderSide {
  width?: number | string
  color?: string
  style?: BorderStyle
}
export interface BorderOptions {
  top?: BorderSide
  right?: BorderSide
  bottom?: BorderSide
  left?: BorderSide
  all?: BorderSide
  leading?: BorderSide
  trailing?: BorderSide
  horizontal?: BorderSide
  vertical?: BorderSide
  width?: number | string
  color?: string
  style?: BorderStyle
}
export declare class BorderModifier extends BaseModifier<BorderOptions> {
  readonly type = 'border'
  readonly priority = 40
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeBorderStyles
  private resolveBorderSides
  private applySideBorder
  private formatBorderWidth
}
export type CornerRadiusValue = number | string
export interface CornerRadiusConfig {
  topLeft?: CornerRadiusValue
  topRight?: CornerRadiusValue
  bottomLeft?: CornerRadiusValue
  bottomRight?: CornerRadiusValue
  topLeading?: CornerRadiusValue
  topTrailing?: CornerRadiusValue
  bottomLeading?: CornerRadiusValue
  bottomTrailing?: CornerRadiusValue
  top?: CornerRadiusValue
  bottom?: CornerRadiusValue
  left?: CornerRadiusValue
  right?: CornerRadiusValue
}
export interface CornerRadiusOptions {
  radius: number | string | CornerRadiusConfig
}
export declare class CornerRadiusModifier extends BaseModifier<CornerRadiusOptions> {
  readonly type = 'cornerRadius'
  readonly priority = 35
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeCornerRadiusStyles
  private generateCornerRadiusCSS
  private cornerToCSSProperty
  private resolveCornerValues
  private formatRadius
}
export declare function border(options: BorderOptions): BorderModifier
export declare function border(
  width: number | string,
  color?: string,
  style?: BorderStyle
): BorderModifier
export declare function borderTop(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier
export declare function borderRight(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier
export declare function borderBottom(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier
export declare function borderLeft(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier
export declare function borderLeading(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier
export declare function borderTrailing(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier
export declare function borderHorizontal(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier
export declare function borderVertical(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier
export declare function cornerRadius(
  value: number | string
): CornerRadiusModifier
export declare function cornerRadius(
  config: CornerRadiusConfig
): CornerRadiusModifier
//# sourceMappingURL=border.d.ts.map
