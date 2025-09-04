/**
 * Utility Modifier - miscellaneous CSS properties
 *
 * Provides access to various CSS properties that don't fit
 * into other specific modifier categories.
 */
import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'
export interface UtilityOptions {
  cursor?:
    | 'auto'
    | 'default'
    | 'pointer'
    | 'text'
    | 'wait'
    | 'help'
    | 'not-allowed'
    | 'none'
    | 'grab'
    | 'grabbing'
    | 'zoom-in'
    | 'zoom-out'
    | 'alias'
    | 'cell'
    | 'copy'
    | string
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto'
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  zIndex?: number
  display?:
    | 'block'
    | 'inline'
    | 'inline-block'
    | 'flex'
    | 'inline-flex'
    | 'grid'
    | 'none'
  visibility?: 'visible' | 'hidden' | 'collapse'
  pointerEvents?: 'auto' | 'none'
  userSelect?: 'auto' | 'none' | 'text' | 'all'
  boxSizing?: 'content-box' | 'border-box'
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  objectPosition?: string
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  outline?: string
  outlineOffset?: number | string
}
export type ReactiveUtilityOptions = ReactiveModifierProps<UtilityOptions>
export declare class UtilityModifier extends BaseModifier<UtilityOptions> {
  readonly type = 'utility'
  readonly priority = 10
  constructor(options: ReactiveUtilityOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private computeUtilityStyles
  private validateCursorValue
}
/**
 * Create a utility modifier with miscellaneous CSS properties
 */
export declare function utility(
  options: ReactiveUtilityOptions
): UtilityModifier
/**
 * Convenience function for cursor
 */
export declare function cursor(value: UtilityOptions['cursor']): UtilityModifier
/**
 * Convenience function for overflow-y
 */
export declare function overflowY(
  value: UtilityOptions['overflowY']
): UtilityModifier
/**
 * Convenience function for overflow-x
 */
export declare function overflowX(
  value: UtilityOptions['overflowX']
): UtilityModifier
/**
 * Convenience function for position
 */
/**
 * Convenience function for display
 */
export declare function display(
  value: UtilityOptions['display']
): UtilityModifier
/**
 * Convenience function for outline
 */
export declare function outline(value: string): UtilityModifier
/**
 * Convenience function for outline-offset
 */
export declare function outlineOffset(value: number | string): UtilityModifier
//# sourceMappingURL=utility.d.ts.map
