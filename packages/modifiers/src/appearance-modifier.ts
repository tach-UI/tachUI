/**
 * Appearance Modifier (`@tachui/modifiers`)
 *
 * Core's `AppearanceModifier` plus the shadow, clipped and clipShape branches,
 * which stay out of core's base class. Both base entries,
 * `@tachui/modifiers/base` and the package root, export this one class.
 */

import { AppearanceModifier as CoreAppearanceModifier } from '@tachui/core/modifiers/base'
import { clipPathFor } from '@tachui/core/modifiers'
import type { CSSStyleProperties } from './types'

export class AppearanceModifier extends CoreAppearanceModifier {
  protected override computeAppearanceStyles(props: any): CSSStyleProperties {
    const styles = super.computeAppearanceStyles(props)

    // Shadow
    if (props.shadow) {
      const shadow = props.shadow
      const x = shadow.x || 0
      const y = shadow.y || 0
      // Support both 'blur' and 'radius' for backward compatibility
      const blur = shadow.blur !== undefined ? shadow.blur : (shadow.radius || 0)
      const spread = shadow.spread || 0
      const color = shadow.color || 'rgba(0,0,0,0.25)'
      // CSS box-shadow: offset-x offset-y blur-radius spread-radius color
      styles.boxShadow = spread !== 0
        ? `${x}px ${y}px ${blur}px ${spread}px ${color}`
        : `${x}px ${y}px ${blur}px ${color}`
    }

    // Clipped modifier (SwiftUI .clipped())
    if (props.clipped) {
      styles.overflow = 'hidden'
    }

    // Clip Shape modifier (SwiftUI .clipShape())
    if (props.clipShape) {
      const { shape, parameters } = props.clipShape
      // Through the same serializer `ClipShapeModifier` uses, so the props
      // form and the modifier form cannot drift. A polygon with no points is
      // the one difference: this path has always fallen back to the full box.
      const clipPath =
        clipPathFor(shape, parameters) ||
        (shape === 'polygon' ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' : '')
      if (clipPath) styles.clipPath = clipPath
    }

    return styles
  }
}
