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
import type { GradientDefinition } from '../gradients/types'
import type { Asset } from '../assets/Asset'
export interface BackgroundOptions {
  background?: string | GradientDefinition | Asset
}
export type ReactiveBackgroundOptions = ReactiveModifierProps<BackgroundOptions>
export declare class BackgroundModifier extends BaseModifier<BackgroundOptions> {
  readonly type = 'background'
  readonly priority = ModifierPriority.APPEARANCE
  constructor(options: ReactiveBackgroundOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeBackgroundStyles
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
export declare function background(
  value: string | GradientDefinition | Asset
): BackgroundModifier
//# sourceMappingURL=background.d.ts.map
