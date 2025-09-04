/**
 * Text Modifiers Implementation
 *
 * Specialized text handling modifiers including line clamping, word breaking,
 * overflow wrapping, and hyphenation control for enhanced typography.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/core/modifiers/types'
export interface LineClampOptions {
  lines: number
}
export type ReactiveLineClampOptions = ReactiveModifierProps<LineClampOptions>
export declare class LineClampModifier extends BaseModifier<LineClampOptions> {
  readonly type = 'lineClamp'
  readonly priority: number
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private generateLineClampStyles
  private validateLines
}
/**
 * Line clamp modifier function - SwiftUI .lineLimit() equivalent
 */
export declare function lineClamp(lines: number): LineClampModifier
export type WordBreakValue = 'normal' | 'break-all' | 'keep-all' | 'break-word'
export interface WordBreakOptions {
  wordBreak: WordBreakValue
}
export type ReactiveWordBreakOptions = ReactiveModifierProps<WordBreakOptions>
export declare class WordBreakModifier extends BaseModifier<WordBreakOptions> {
  readonly type = 'wordBreak'
  readonly priority: number
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private validateWordBreak
}
/**
 * Word break modifier function
 */
export declare function wordBreak(value: WordBreakValue): WordBreakModifier
export type OverflowWrapValue = 'normal' | 'break-word' | 'anywhere'
export interface OverflowWrapOptions {
  overflowWrap: OverflowWrapValue
}
export type ReactiveOverflowWrapOptions =
  ReactiveModifierProps<OverflowWrapOptions>
export declare class OverflowWrapModifier extends BaseModifier<OverflowWrapOptions> {
  readonly type = 'overflowWrap'
  readonly priority: number
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private validateOverflowWrap
}
/**
 * Overflow wrap modifier function
 */
export declare function overflowWrap(
  value: OverflowWrapValue
): OverflowWrapModifier
export type HyphensValue = 'none' | 'manual' | 'auto'
export interface HyphensOptions {
  hyphens: HyphensValue
}
export type ReactiveHyphensOptions = ReactiveModifierProps<HyphensOptions>
export declare class HyphensModifier extends BaseModifier<HyphensOptions> {
  readonly type = 'hyphens'
  readonly priority: number
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private validateHyphens
}
/**
 * Hyphens modifier function
 */
export declare function hyphens(value: HyphensValue): HyphensModifier
//# sourceMappingURL=text.d.ts.map
