/**
 * Clip Shape Modifier
 *
 * SwiftUI-inspired modifier for clipping content to various shapes
 */

import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

export interface ClipShapeOptions {
  shape: 'circle' | 'ellipse' | 'rect' | 'polygon'
  parameters?: Record<string, any>
}

export class ClipShapeModifier extends BaseModifier<ClipShapeOptions> {
  readonly type = 'clip-shape'
  readonly priority = 90

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const element = context.element as HTMLElement
    if (!element.style) return
    const { shape, parameters = {} } = this.properties

    const clipPath = this.generateClipPath(shape, parameters)
    if (clipPath) {
      element.style.clipPath = clipPath
    }

    return undefined
  }

  private generateClipPath(
    shape: ClipShapeOptions['shape'],
    parameters: Record<string, any>
  ): string {
    switch (shape) {
      case 'circle':
        return 'circle(50%)'

      case 'ellipse': {
        const radiusX = (parameters && parameters.radiusX) || '50%'
        const radiusY = (parameters && parameters.radiusY) || '50%'
        return `ellipse(${radiusX} ${radiusY} at center)`
      }

      case 'rect': {
        const inset = (parameters && parameters.inset) || 0
        return `inset(${inset}px)`
      }

      case 'polygon': {
        const points = parameters && parameters.points
        if (!points) return ''
        return `polygon(${points})`
      }

      default:
        return ''
    }
  }
}

/**
 * Creates a clip shape modifier that clips content to the specified shape
 */
export function clipShape(
  shape: 'circle' | 'ellipse' | 'rect' | 'polygon',
  parameters?: Record<string, any>
): ClipShapeModifier {
  return new ClipShapeModifier({ shape, parameters: parameters || {} })
}
