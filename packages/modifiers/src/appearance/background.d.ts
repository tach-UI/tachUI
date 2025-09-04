/**
 * Background Modifiers
 *
 * Background styling modifiers with asset and gradient support
 */
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
export interface BackgroundOptions {
  background: string | any
}
export declare class BackgroundModifier extends BaseModifier<BackgroundOptions> {
  readonly type = 'background'
  readonly priority = 95
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private resolveBackground
}
export interface BackgroundClipOptions {
  backgroundImage?: string
  backgroundClip?: 'text' | 'border-box' | 'padding-box' | 'content-box'
  color?: string
}
export declare class BackgroundClipModifier extends BaseModifier<BackgroundClipOptions> {
  readonly type = 'backgroundClip'
  readonly priority = 40
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeBackgroundClipStyles
}
export declare function backgroundColor(color: string): BackgroundModifier
export declare function background(value: string): BackgroundModifier
export declare function backgroundClip(
  backgroundImage: string,
  clip?: 'text' | 'border-box' | 'padding-box' | 'content-box',
  color?: string
): BackgroundClipModifier
export declare function gradientText(gradient: string): BackgroundClipModifier
export declare function blueGradientText(): BackgroundClipModifier
export declare function rainbowGradientText(): BackgroundClipModifier
export declare function sunsetGradientText(): BackgroundClipModifier
export declare function oceanGradientText(): BackgroundClipModifier
export declare function goldGradientText(): BackgroundClipModifier
//# sourceMappingURL=background.d.ts.map
