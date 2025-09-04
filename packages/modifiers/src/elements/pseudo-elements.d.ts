/**
 * Pseudo-element Modifiers - ::before and ::after styling
 *
 * Provides comprehensive pseudo-element support for ::before and ::after
 * with dynamic stylesheet generation and flexible styling options.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
export interface PseudoElementStyles {
  content?: string
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  width?: number | string
  height?: number | string
  backgroundColor?: string
  color?: string
  fontSize?: number | string
  fontWeight?: string | number
  fontFamily?: string
  lineHeight?: number | string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  margin?: number | string
  marginTop?: number | string
  marginRight?: number | string
  marginBottom?: number | string
  marginLeft?: number | string
  padding?: number | string
  paddingTop?: number | string
  paddingRight?: number | string
  paddingBottom?: number | string
  paddingLeft?: number | string
  border?: string
  borderTop?: string
  borderRight?: string
  borderBottom?: string
  borderLeft?: string
  borderRadius?: number | string
  borderWidth?: number | string
  borderStyle?: string
  borderColor?: string
  boxShadow?: string
  textShadow?: string
  opacity?: number
  transform?: string
  transformOrigin?: string
  zIndex?: number
  display?: string
  flexDirection?: string
  flexWrap?: string
  alignItems?: string
  justifyContent?: string
  alignSelf?: string
  flex?: string
  flexGrow?: number
  flexShrink?: number
  flexBasis?: string
  order?: number
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto'
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'
  textOverflow?: 'clip' | 'ellipsis'
  cursor?: string
  pointerEvents?: 'auto' | 'none'
  visibility?: 'visible' | 'hidden'
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  filter?: string
  backdropFilter?: string
  transition?: string
  animation?: string
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase'
  verticalAlign?: string
  minWidth?: number | string
  minHeight?: number | string
  maxWidth?: number | string
  maxHeight?: number | string
  [key: string]: any
}
export interface PseudoElementOptions {
  before?: PseudoElementStyles
  after?: PseudoElementStyles
}
export declare class PseudoElementModifier extends BaseModifier<PseudoElementOptions> {
  readonly type = 'pseudoElement'
  readonly priority = 50
  private static styleSheetId
  private static elementCount
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private addPseudoElementRule
  private generatePseudoElementCSS
  private formatCSSValue
  private getOrCreateStyleSheet
  protected toCSSProperty(prop: string): string
}
/**
 * ::before pseudo-element modifier
 *
 * @example
 * ```typescript
 * .before({
 *   content: '★',
 *   position: 'absolute',
 *   left: -20,
 *   color: '#ffd700'
 * })
 * ```
 */
export declare function before(
  styles: PseudoElementStyles
): PseudoElementModifier
/**
 * ::after pseudo-element modifier
 *
 * @example
 * ```typescript
 * .after({
 *   content: '',
 *   position: 'absolute',
 *   bottom: 0,
 *   left: 0,
 *   right: 0,
 *   height: 2,
 *   backgroundColor: '#007AFF'
 * })
 * ```
 */
export declare function after(
  styles: PseudoElementStyles
): PseudoElementModifier
/**
 * Both ::before and ::after pseudo-elements
 *
 * @example
 * ```typescript
 * .pseudoElements({
 *   before: { content: '"', fontSize: 24, color: '#666' },
 *   after: { content: '"', fontSize: 24, color: '#666' }
 * })
 * ```
 */
export declare function pseudoElements(
  options: PseudoElementOptions
): PseudoElementModifier
//# sourceMappingURL=pseudo-elements.d.ts.map
