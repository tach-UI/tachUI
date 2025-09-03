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

export class BorderModifier extends BaseModifier<BorderOptions> {
  readonly type = 'border'
  readonly priority = 40

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeBorderStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeBorderStyles(props: BorderOptions) {
    const styles: Record<string, any> = {}

    const resolvedSides = this.resolveBorderSides(props)

    const hasSpecificSides =
      resolvedSides.top ||
      resolvedSides.right ||
      resolvedSides.bottom ||
      resolvedSides.left ||
      props.all
    if (
      !hasSpecificSides &&
      (props.width !== undefined ||
        props.color !== undefined ||
        props.style !== undefined)
    ) {
      if (props.width !== undefined)
        styles.borderWidth = this.formatBorderWidth(props.width)
      if (props.color !== undefined) styles.borderColor = props.color
      if (props.style !== undefined) styles.borderStyle = props.style
    }

    if (props.all !== undefined) {
      if (props.all.width !== undefined)
        styles.borderWidth = this.formatBorderWidth(props.all.width)
      if (props.all.color !== undefined) styles.borderColor = props.all.color
      if (props.all.style !== undefined) styles.borderStyle = props.all.style
    }

    if (resolvedSides.top !== undefined) {
      this.applySideBorder(styles, resolvedSides.top, 'Top')
    }
    if (resolvedSides.right !== undefined) {
      this.applySideBorder(styles, resolvedSides.right, 'Right')
    }
    if (resolvedSides.bottom !== undefined) {
      this.applySideBorder(styles, resolvedSides.bottom, 'Bottom')
    }
    if (resolvedSides.left !== undefined) {
      this.applySideBorder(styles, resolvedSides.left, 'Left')
    }

    return styles
  }

  private resolveBorderSides(props: BorderOptions) {
    return {
      top: props.top || props.vertical,
      right: props.right || props.trailing || props.horizontal,
      bottom: props.bottom || props.vertical,
      left: props.left || props.leading || props.horizontal,
    }
  }

  private applySideBorder(
    styles: Record<string, any>,
    side: BorderSide,
    sideName: string
  ) {
    if (side.width !== undefined) {
      styles[`border${sideName}Width`] = this.formatBorderWidth(side.width)
    }
    if (side.color !== undefined) {
      styles[`border${sideName}Color`] = side.color
    }
    if (side.style !== undefined) {
      styles[`border${sideName}Style`] = side.style
    }
  }

  private formatBorderWidth(width: number | string): string {
    return typeof width === 'number' ? `${width}px` : width
  }
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

export class CornerRadiusModifier extends BaseModifier<CornerRadiusOptions> {
  readonly type = 'cornerRadius'
  readonly priority = 35

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeCornerRadiusStyles(this.properties.radius)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeCornerRadiusStyles(
    radius: number | string | CornerRadiusConfig
  ) {
    if (typeof radius === 'number' || typeof radius === 'string') {
      return { borderRadius: this.formatRadius(radius) }
    }

    return this.generateCornerRadiusCSS(radius)
  }

  private generateCornerRadiusCSS(
    config: CornerRadiusConfig
  ): Record<string, string> {
    const corners = this.resolveCornerValues(config)
    const styles: Record<string, string> = {}

    Object.entries(corners).forEach(([corner, value]) => {
      if (value !== undefined) {
        const cssProperty = this.cornerToCSSProperty(
          corner as keyof typeof corners
        )
        styles[cssProperty] = this.formatRadius(value)
      }
    })

    return styles
  }

  private cornerToCSSProperty(
    corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  ): string {
    const map = {
      topLeft: 'borderTopLeftRadius',
      topRight: 'borderTopRightRadius',
      bottomLeft: 'borderBottomLeftRadius',
      bottomRight: 'borderBottomRightRadius',
    }
    return map[corner]
  }

  private resolveCornerValues(config: CornerRadiusConfig) {
    return {
      topLeft: config.topLeft ?? config.topLeading ?? config.top ?? config.left,
      topRight:
        config.topRight ?? config.topTrailing ?? config.top ?? config.right,
      bottomLeft:
        config.bottomLeft ??
        config.bottomLeading ??
        config.bottom ??
        config.left,
      bottomRight:
        config.bottomRight ??
        config.bottomTrailing ??
        config.bottom ??
        config.right,
    }
  }

  private formatRadius(value: CornerRadiusValue): string {
    return typeof value === 'number' ? `${value}px` : value
  }
}

export function border(options: BorderOptions): BorderModifier
export function border(
  width: number | string,
  color?: string,
  style?: BorderStyle
): BorderModifier
export function border(
  optionsOrWidth: BorderOptions | number | string,
  color?: string,
  style?: BorderStyle
): BorderModifier {
  if (
    typeof optionsOrWidth === 'number' ||
    typeof optionsOrWidth === 'string'
  ) {
    return new BorderModifier({
      width: optionsOrWidth,
      color: color || 'currentColor',
      style: style || 'solid',
    })
  }
  return new BorderModifier(optionsOrWidth)
}

export function borderTop(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ top: { width, color, style } })
}

export function borderRight(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ right: { width, color, style } })
}

export function borderBottom(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ bottom: { width, color, style } })
}

export function borderLeft(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ left: { width, color, style } })
}

export function borderLeading(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ leading: { width, color, style } })
}

export function borderTrailing(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ trailing: { width, color, style } })
}

export function borderHorizontal(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ horizontal: { width, color, style } })
}

export function borderVertical(
  width: number | string,
  color: string,
  style?: BorderStyle
): BorderModifier {
  return new BorderModifier({ vertical: { width, color, style } })
}

export function cornerRadius(value: number | string): CornerRadiusModifier
export function cornerRadius(config: CornerRadiusConfig): CornerRadiusModifier
export function cornerRadius(
  value: number | string | CornerRadiusConfig
): CornerRadiusModifier {
  return new CornerRadiusModifier({ radius: value })
}
