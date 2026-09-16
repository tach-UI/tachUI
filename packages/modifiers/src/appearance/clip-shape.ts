/**
 * Clip Shape Modifier
 *
 * SwiftUI-inspired modifier for clipping content to various shapes.
 *
 * Two forms: the original string names, and any `Shape` — the contract in
 * `@tachui/types`, which the built-in shapes in `@tachui/primitives`
 * implement. A shape serializes itself to a CSS basic shape through
 * `clipPath()`, so this modifier stays ignorant of shape kinds and needs no
 * SVG `<clipPath>` machinery. That indirection is also what keeps the
 * dependency edge pointing the right way: `@tachui/primitives` depends on
 * `@tachui/modifiers`, so there is no shape class here to import.
 */

import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/types/modifiers'
import type { DOMNode } from '@tachui/types/runtime'
import type { Shape } from '@tachui/types/shapes'
import {
  clipPathFor,
  type ClipShapeName,
} from './clip-path'

export {
  clipPathFor,
  clipPathForName,
  isShapeInstance,
  type ClipShapeName,
} from './clip-path'

export interface ClipShapeOptions {
  shape: ClipShapeName | Shape
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

    const clipPath = clipPathFor(shape, parameters)
    if (clipPath) {
      element.style.clipPath = clipPath
    }

    return undefined
  }
}

/**
 * Creates a clip shape modifier that clips content to the specified shape.
 *
 * ```ts
 * view.clipShape('circle')
 * view.clipShape(Circle())
 * view.clipShape(RoundedRectangle(12))
 * ```
 */
export function clipShape(
  shape: ClipShapeName | Shape,
  parameters?: Record<string, any>
): ClipShapeModifier {
  return new ClipShapeModifier({ shape, parameters: parameters || {} })
}
