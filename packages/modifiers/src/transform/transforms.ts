/**
 * Transform Modifiers
 *
 * 2D and 3D transformation modifiers for rotation, scale, and translation
 */

import { BaseModifier } from '@tachui/core/modifiers/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

export interface TransformConfig {
  scale?: number | { x?: number; y?: number }
  rotate?: string
  translate?: { x?: number | string; y?: number | string }
  skew?: { x?: string; y?: string }
  perspective?: number
}

export interface Transform3DConfig extends TransformConfig {
  rotateX?: string
  rotateY?: string
  rotateZ?: string
  translate?: { x?: number | string; y?: number | string; z?: number | string }
  translateZ?: number | string
  scaleZ?: number
}

export interface ModifierTransformOptions {
  transform?: TransformConfig | Transform3DConfig
  transformOrigin?: string
  backfaceVisibility?: 'visible' | 'hidden'
  transformStyle?: 'flat' | 'preserve-3d'
}

export class TransformModifier extends BaseModifier<ModifierTransformOptions> {
  readonly type = 'transform'
  readonly priority = 45

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeTransformStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeTransformStyles(props: ModifierTransformOptions) {
    const styles: Record<string, string> = {}

    if (props.transform) {
      styles.transform = this.generateTransformCSS(props.transform)
    }

    if (props.transformOrigin) {
      styles.transformOrigin = props.transformOrigin
    }

    if (props.backfaceVisibility) {
      styles.backfaceVisibility = props.backfaceVisibility
    }

    if (props.transformStyle) {
      styles.transformStyle = props.transformStyle
    }

    return styles
  }

  private generateTransformCSS(
    config: TransformConfig | Transform3DConfig
  ): string {
    const transforms: string[] = []

    if ('perspective' in config && config.perspective !== undefined) {
      transforms.push(`perspective(${config.perspective}px)`)
    }

    if (config.scale !== undefined) {
      if (typeof config.scale === 'number') {
        transforms.push(`scale(${config.scale})`)
      } else {
        const x = config.scale.x ?? 1
        const y = config.scale.y ?? 1
        transforms.push(`scale(${x}, ${y})`)
      }
    }

    if (config.rotate !== undefined) {
      transforms.push(`rotate(${config.rotate})`)
    }

    if ('rotateX' in config && config.rotateX !== undefined) {
      transforms.push(`rotateX(${config.rotateX})`)
    }

    if ('rotateY' in config && config.rotateY !== undefined) {
      transforms.push(`rotateY(${config.rotateY})`)
    }

    if ('rotateZ' in config && config.rotateZ !== undefined) {
      transforms.push(`rotateZ(${config.rotateZ})`)
    }

    if (config.translate !== undefined) {
      const { x = 0, y = 0 } = config.translate
      const z = 'z' in config.translate ? config.translate.z : undefined

      const xValue = typeof x === 'number' ? `${x}px` : x
      const yValue = typeof y === 'number' ? `${y}px` : y

      if (z !== undefined) {
        const zValue = typeof z === 'number' ? `${z}px` : z
        transforms.push(`translate3d(${xValue}, ${yValue}, ${zValue})`)
      } else {
        transforms.push(`translate(${xValue}, ${yValue})`)
      }
    }

    if ('translateZ' in config && config.translateZ !== undefined) {
      const zValue =
        typeof config.translateZ === 'number'
          ? `${config.translateZ}px`
          : config.translateZ
      transforms.push(`translateZ(${zValue})`)
    }

    if ('scaleZ' in config && config.scaleZ !== undefined) {
      transforms.push(`scaleZ(${config.scaleZ})`)
    }

    if (config.skew !== undefined) {
      const { x = '0deg', y = '0deg' } = config.skew
      transforms.push(`skew(${x}, ${y})`)
    }

    return transforms.join(' ')
  }
}

export function transform(
  config: TransformConfig | Transform3DConfig
): TransformModifier {
  return new TransformModifier({ transform: config })
}

export function scale(value: number): TransformModifier
export function scale(x: number, y: number): TransformModifier
export function scale(x: number, y?: number): TransformModifier {
  if (y === undefined) {
    return new TransformModifier({ transform: { scale: x } })
  }
  return new TransformModifier({ transform: { scale: { x, y } } })
}

export function rotate(degrees: string): TransformModifier {
  return new TransformModifier({ transform: { rotate: degrees } })
}

export function translate(
  x: number | string,
  y: number | string
): TransformModifier {
  return new TransformModifier({ transform: { translate: { x, y } } })
}

export function skew(x: string, y: string): TransformModifier {
  return new TransformModifier({ transform: { skew: { x, y } } })
}

export function rotateX(degrees: string): TransformModifier {
  return new TransformModifier({ transform: { rotateX: degrees } })
}

export function rotateY(degrees: string): TransformModifier {
  return new TransformModifier({ transform: { rotateY: degrees } })
}

export function rotateZ(degrees: string): TransformModifier {
  return new TransformModifier({ transform: { rotateZ: degrees } })
}

export function perspective(value: number): TransformModifier {
  return new TransformModifier({ transform: { perspective: value } })
}

export function scaleEffect(value: number): TransformModifier {
  return scale(value)
}

export function offset(
  x: number | string,
  y: number | string
): TransformModifier {
  return translate(x, y)
}
