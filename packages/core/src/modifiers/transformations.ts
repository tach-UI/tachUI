/**
 * Transformation Modifiers - CSS Transform System
 *
 * Provides comprehensive 2D and 3D transform capabilities including
 * scale, rotate, translate, skew, perspective, and matrix transforms.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'

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

export type ReactiveTransformOptions = ReactiveModifierProps<ModifierTransformOptions>

export class TransformModifier extends BaseModifier<ModifierTransformOptions> {
  readonly type = 'transform'
  readonly priority = 45

  constructor(options: ReactiveTransformOptions) {
    const resolvedOptions: ModifierTransformOptions = {}
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

  private generateTransformCSS(config: TransformConfig | Transform3DConfig): string {
    const transforms: string[] = []

    // Handle perspective first (for 3D transforms)
    if ('perspective' in config && config.perspective !== undefined) {
      transforms.push(`perspective(${config.perspective}px)`)
    }

    // Handle scale
    if (config.scale !== undefined) {
      if (typeof config.scale === 'number') {
        transforms.push(`scale(${config.scale})`)
      } else {
        const x = config.scale.x ?? 1
        const y = config.scale.y ?? 1
        transforms.push(`scale(${x}, ${y})`)
      }
    }

    // Handle rotate (2D)
    if (config.rotate !== undefined) {
      transforms.push(`rotate(${config.rotate})`)
    }

    // Handle 3D rotations
    if ('rotateX' in config && config.rotateX !== undefined) {
      transforms.push(`rotateX(${config.rotateX})`)
    }
    if ('rotateY' in config && config.rotateY !== undefined) {
      transforms.push(`rotateY(${config.rotateY})`)
    }
    if ('rotateZ' in config && config.rotateZ !== undefined) {
      transforms.push(`rotateZ(${config.rotateZ})`)
    }

    // Handle translate
    if (config.translate !== undefined) {
      const x = this.formatLength(config.translate.x ?? 0)
      const y = this.formatLength(config.translate.y ?? 0)

      // Check for Z value in translate object or translateZ property
      let z = '0'
      if ('z' in config.translate && config.translate.z !== undefined) {
        z = this.formatLength(config.translate.z)
      } else if ('translateZ' in config && config.translateZ !== undefined) {
        z = this.formatLength(config.translateZ)
      }

      // Always use translate3d for hardware acceleration
      transforms.push(`translate3d(${x}, ${y}, ${z})`)
    }

    // Handle 3D scale
    if ('scaleZ' in config && config.scaleZ !== undefined) {
      transforms.push(`scaleZ(${config.scaleZ})`)
    }

    // Handle skew
    if (config.skew !== undefined) {
      if (config.skew.x !== undefined && config.skew.y !== undefined) {
        transforms.push(`skew(${config.skew.x}, ${config.skew.y})`)
      } else if (config.skew.x !== undefined) {
        transforms.push(`skewX(${config.skew.x})`)
      } else if (config.skew.y !== undefined) {
        transforms.push(`skewY(${config.skew.y})`)
      }
    }

    return transforms.join(' ')
  }

  private formatLength(value: number | string): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    return value
  }
}

// ============================================================================
// Advanced Transform System for Matrix and Extended 3D
// ============================================================================

export interface MatrixTransformConfig {
  matrix?: [number, number, number, number, number, number]
  matrix3d?: [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number
  ]
}

export interface Advanced3DTransformConfig {
  rotate3d?: { x: number; y: number; z: number; angle: string }
  scale3d?: { x: number; y: number; z: number }
  translate3d?: { x?: number | string; y?: number | string; z?: number | string }
  scaleX?: number
  scaleY?: number
  scaleZ?: number
  translateX?: number | string
  translateY?: number | string
  translateZ?: number | string
}

export interface ModifierAdvancedTransformOptions {
  transform?: TransformConfig | Transform3DConfig | MatrixTransformConfig | Advanced3DTransformConfig
  transformOrigin?: string
  perspectiveOrigin?: string
  transformStyle?: 'flat' | 'preserve-3d'
  backfaceVisibility?: 'visible' | 'hidden'
}

export type ReactiveAdvancedTransformOptions = ReactiveModifierProps<ModifierAdvancedTransformOptions>

export class AdvancedTransformModifier extends BaseModifier<ModifierAdvancedTransformOptions> {
  readonly type = 'advancedTransform'
  readonly priority = 45

  constructor(options: ReactiveAdvancedTransformOptions) {
    const resolvedOptions: ModifierAdvancedTransformOptions = {}
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

    const styles = this.computeAdvancedTransformStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeAdvancedTransformStyles(props: ModifierAdvancedTransformOptions) {
    const styles: Record<string, string> = {}

    if (props.transform) {
      styles.transform = this.generateAdvancedTransformCSS(props.transform)
    }

    if (props.transformOrigin) {
      styles.transformOrigin = props.transformOrigin
    }

    if (props.perspectiveOrigin) {
      styles.perspectiveOrigin = props.perspectiveOrigin
    }

    if (props.backfaceVisibility) {
      styles.backfaceVisibility = props.backfaceVisibility
    }

    if (props.transformStyle) {
      styles.transformStyle = props.transformStyle
    }

    return styles
  }

  private generateAdvancedTransformCSS(config: any): string {
    const transforms: string[] = []

    // Handle matrix transforms
    if ('matrix' in config && config.matrix) {
      transforms.push(`matrix(${config.matrix.join(', ')})`)
    }
    if ('matrix3d' in config && config.matrix3d) {
      transforms.push(`matrix3d(${config.matrix3d.join(', ')})`)
    }

    // Handle advanced 3D transforms
    if ('rotate3d' in config && config.rotate3d) {
      const { x, y, z, angle } = config.rotate3d
      transforms.push(`rotate3d(${x}, ${y}, ${z}, ${angle})`)
    }

    if ('scale3d' in config && config.scale3d) {
      const { x, y, z } = config.scale3d
      transforms.push(`scale3d(${x}, ${y}, ${z})`)
    }

    if ('translate3d' in config && config.translate3d) {
      const x = this.formatLength(config.translate3d.x ?? 0)
      const y = this.formatLength(config.translate3d.y ?? 0)
      const z = this.formatLength(config.translate3d.z ?? 0)
      transforms.push(`translate3d(${x}, ${y}, ${z})`)
    }

    // Individual axis transforms
    if ('scaleX' in config && config.scaleX !== undefined) {
      transforms.push(`scaleX(${config.scaleX})`)
    }
    if ('scaleY' in config && config.scaleY !== undefined) {
      transforms.push(`scaleY(${config.scaleY})`)
    }
    if ('scaleZ' in config && config.scaleZ !== undefined) {
      transforms.push(`scaleZ(${config.scaleZ})`)
    }
    if ('translateX' in config && config.translateX !== undefined) {
      transforms.push(`translateX(${this.formatLength(config.translateX)})`)
    }
    if ('translateY' in config && config.translateY !== undefined) {
      transforms.push(`translateY(${this.formatLength(config.translateY)})`)
    }
    if ('translateZ' in config && config.translateZ !== undefined) {
      transforms.push(`translateZ(${this.formatLength(config.translateZ)})`)
    }

    // Fallback to basic transform generation
    if (transforms.length === 0) {
      return this.generateTransformCSS(config)
    }

    return transforms.join(' ')
  }

  private generateTransformCSS(config: TransformConfig | Transform3DConfig): string {
    // Reuse the basic transform generation logic
    const transformModifier = new TransformModifier({ transform: config })
    return (transformModifier as any).generateTransformCSS(config)
  }

  private formatLength(value: number | string): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    return value
  }
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * General transform modifier with flexible configuration
 *
 * @example
 * ```typescript
 * .transform({
 *   scale: 1.1,
 *   rotate: '45deg',
 *   translate: { x: 10, y: 20 }
 * })
 * ```
 */
export function transform(config: TransformConfig | Transform3DConfig): TransformModifier {
  return new TransformModifier({ transform: config })
}

/**
 * Scale transformation
 *
 * @example
 * ```typescript
 * .scale(1.2)                    // Uniform scale
 * .scale({ x: 1.5, y: 0.8 })     // Non-uniform scale
 * ```
 */
export function scale(value: number | { x?: number; y?: number }): TransformModifier {
  return new TransformModifier({ transform: { scale: value } })
}

/**
 * 2D rotation transformation
 *
 * @example
 * ```typescript
 * .rotate('45deg')
 * .rotate('-90deg')
 * .rotate('0.5turn')
 * ```
 */
export function rotate(angle: string): TransformModifier {
  return new TransformModifier({ transform: { rotate: angle } })
}

/**
 * Translation transformation
 *
 * @example
 * ```typescript
 * .translate({ x: 10, y: 20 })
 * .translate({ x: '50%', y: '-10px' })
 * ```
 */
export function translate(offset: { x?: number | string; y?: number | string }): TransformModifier {
  return new TransformModifier({ transform: { translate: offset } })
}

/**
 * Skew transformation
 *
 * @example
 * ```typescript
 * .skew({ x: '15deg', y: '10deg' })
 * .skew({ x: '20deg' })  // Only X axis
 * ```
 */
export function skew(angles: { x?: string; y?: string }): TransformModifier {
  return new TransformModifier({ transform: { skew: angles } })
}

// ============================================================================
// 3D Transform Functions
// ============================================================================

/**
 * X-axis rotation (3D)
 *
 * @example
 * ```typescript
 * .rotateX('45deg')
 * .rotateX('1rad')
 * ```
 */
export function rotateX(angle: string): TransformModifier {
  return new TransformModifier({ transform: { rotateX: angle } })
}

/**
 * Y-axis rotation (3D)
 *
 * @example
 * ```typescript
 * .rotateY('90deg')
 * .rotateY('-45deg')
 * ```
 */
export function rotateY(angle: string): TransformModifier {
  return new TransformModifier({ transform: { rotateY: angle } })
}

/**
 * Z-axis rotation (3D)
 *
 * @example
 * ```typescript
 * .rotateZ('180deg')
 * .rotateZ('0.25turn')
 * ```
 */
export function rotateZ(angle: string): TransformModifier {
  return new TransformModifier({ transform: { rotateZ: angle } })
}

/**
 * 3D perspective
 *
 * @example
 * ```typescript
 * .perspective(1000)  // 1000px perspective
 * .perspective(500)   // Closer perspective
 * ```
 */
export function perspective(value: number): TransformModifier {
  return new TransformModifier({ transform: { perspective: value } })
}

// ============================================================================
// Advanced Transform Functions (Matrix, Extended 3D)
// ============================================================================

/**
 * Advanced transform modifier with matrix and extended 3D support
 *
 * @example
 * ```typescript
 * .advancedTransform({
 *   rotate3d: { x: 1, y: 1, z: 0, angle: '45deg' },
 *   scale3d: { x: 1.2, y: 1.2, z: 1 }
 * })
 * ```
 */
export function advancedTransform(config: Advanced3DTransformConfig | MatrixTransformConfig): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: config })
}

/**
 * 2D matrix transformation
 *
 * @example
 * ```typescript
 * .matrix([1, 0, 0, 1, 50, 100])  // Translate(50, 100)
 * ```
 */
export function matrix(values: [number, number, number, number, number, number]): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { matrix: values } })
}

/**
 * 3D matrix transformation
 *
 * @example
 * ```typescript
 * .matrix3d([1,0,0,0, 0,1,0,0, 0,0,1,0, 50,100,0,1])
 * ```
 */
export function matrix3d(values: [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
]): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { matrix3d: values } })
}

/**
 * 3D rotation around arbitrary axis
 *
 * @example
 * ```typescript
 * .rotate3d(1, 1, 0, '45deg')  // Rotate around X and Y axis
 * ```
 */
export function rotate3d(x: number, y: number, z: number, angle: string): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { rotate3d: { x, y, z, angle } } })
}

/**
 * 3D scale transformation
 *
 * @example
 * ```typescript
 * .scale3d(1.2, 1.2, 0.8)  // Scale XY up, Z down
 * ```
 */
export function scale3d(x: number, y: number, z: number): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { scale3d: { x, y, z } } })
}

/**
 * 3D translation transformation
 *
 * @example
 * ```typescript
 * .translate3d(10, 20, 30)      // Hardware accelerated
 * .translate3d('50%', 0, 0)     // Percentage values
 * ```
 */
export function translate3d(x?: number | string, y?: number | string, z?: number | string): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { translate3d: { x, y, z } } })
}

// Individual axis scale functions
export function scaleX(value: number): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { scaleX: value } })
}

export function scaleY(value: number): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { scaleY: value } })
}

export function scaleZ(value: number): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { scaleZ: value } })
}

// Individual axis translate functions
export function translateX(value: number | string): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { translateX: value } })
}

export function translateY(value: number | string): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { translateY: value } })
}

export function translateZ(value: number | string): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transform: { translateZ: value } })
}

// Transform utility functions
export function perspectiveOrigin(value: string): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ perspectiveOrigin: value })
}

export function transformStyle(value: 'flat' | 'preserve-3d'): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ transformStyle: value })
}

export function backfaceVisibility(value: 'visible' | 'hidden'): AdvancedTransformModifier {
  return new AdvancedTransformModifier({ backfaceVisibility: value })
}

// ============================================================================
// SwiftUI Compatibility Functions
// ============================================================================

type AnchorPoint = 'center' | 'top' | 'bottom' | 'leading' | 'trailing' | 
                   'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'

/**
 * SwiftUI-compatible scaleEffect modifier
 * 
 * @example
 * ```typescript
 * .scaleEffect(1.5)                    // Uniform scale
 * .scaleEffect(1.5, 2.0)               // Non-uniform scale  
 * .scaleEffect(1.2, undefined, 'topLeading')  // Scale from top-leading corner
 * ```
 */
export function scaleEffect(
  x: number,
  y?: number,
  anchor: AnchorPoint = 'center'
): AdvancedTransformModifier {
  const scaleX = x
  const scaleY = y ?? x
  const transformOrigin = getTransformOrigin(anchor)
  
  return new AdvancedTransformModifier({ 
    transform: { scaleX, scaleY },
    transformOrigin 
  })
}

/**
 * SwiftUI-compatible offset modifier (relative positioning via transform)
 * 
 * Note: SwiftUI's .position() sets absolute coordinates, but in web context
 * we use .offset() for relative positioning which is more common.
 * 
 * @example
 * ```typescript
 * .offset(100, 50)   // Offset by x=100, y=50 relative to current position
 * ```
 */
export function offset(x: number, y: number): AdvancedTransformModifier {
  return new AdvancedTransformModifier({
    transform: { translateX: x, translateY: y }
  })
}

/**
 * Convert SwiftUI anchor point to CSS transform-origin
 */
function getTransformOrigin(anchor: AnchorPoint): string {
  switch (anchor) {
    case 'center': return 'center center'
    case 'top': return 'center top'
    case 'bottom': return 'center bottom'
    case 'leading': return 'left center'
    case 'trailing': return 'right center'
    case 'topLeading': return 'left top'
    case 'topTrailing': return 'right top'
    case 'bottomLeading': return 'left bottom'
    case 'bottomTrailing': return 'right bottom'
    default: return 'center center'
  }
}
