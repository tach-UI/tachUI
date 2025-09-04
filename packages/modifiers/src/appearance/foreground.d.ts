/**
 * Foreground Modifiers
 *
 * Text color and foreground styling modifiers
 */
import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
export interface ForegroundOptions {
  color: string
}
export declare class ForegroundModifier extends BaseModifier<ForegroundOptions> {
  readonly type = 'foreground'
  readonly priority = 90
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
}
export declare function foregroundColor(color: string): ForegroundModifier
export declare function foreground(color: string): ForegroundModifier
//# sourceMappingURL=foreground.d.ts.map
