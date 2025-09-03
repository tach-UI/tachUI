/**
 * Background Modifier - Background styling and rendering
 *
 * Provides comprehensive background support including colors, gradients,
 * images, and complex background compositions.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'
import { ModifierPriority } from './types'
import { gradientToCSS } from '../gradients/css-generator'
import type { GradientDefinition } from '../gradients/types'
import type { Asset } from '../assets/Asset'

export interface BackgroundOptions {
  background?: string | GradientDefinition | Asset // Support strings, gradients, and assets
}

export type ReactiveBackgroundOptions = ReactiveModifierProps<BackgroundOptions>

export class BackgroundModifier extends BaseModifier<BackgroundOptions> {
  readonly type = 'background'
  readonly priority = ModifierPriority.APPEARANCE // Appearance modifier priority

  constructor(options: ReactiveBackgroundOptions) {
    super(options as unknown as BackgroundOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeBackgroundStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeBackgroundStyles(props: BackgroundOptions) {
    const styles: Record<string, string> = {}

    if (props.background !== undefined) {
      // Check if background is a gradient definition
      if (
        typeof props.background === 'object' &&
        'type' in props.background &&
        'options' in props.background
      ) {
        styles.background = gradientToCSS(
          props.background as GradientDefinition
        )
      }
      // Check if background is an Asset
      else if (
        typeof props.background === 'object' &&
        'resolve' in props.background
      ) {
        styles.background = (props.background as Asset).resolve() as string
      } else {
        styles.background = String(props.background)
      }
    }

    return styles
  }
}

/**
 * Create a background modifier
 *
 * @example
 * ```typescript
 * .background('#ff0000')
 * .background('linear-gradient(45deg, red, blue)')
 * ```
 */
export function background(
  value: string | GradientDefinition | Asset
): BackgroundModifier {
  return new BackgroundModifier({ background: value })
}

// Types are exported through compat.ts re-export from @tachui/modifiers
