/**
 * HTML Attributes Modifier - Best-in-class HTML element attribute management
 *
 * Comprehensive interface for HTML attributes including ID and data attributes
 * with full validation, development warnings, and production optimization.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/core/modifiers/types'
export type IdValue = string
export interface IdOptions {
  id: IdValue
}
export type ReactiveIdOptions = ReactiveModifierProps<IdOptions>
export declare class IdModifier extends BaseModifier<IdOptions> {
  readonly type = 'id'
  readonly priority = 85
  constructor(options: ReactiveIdOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private validateId
}
/**
 * HTML element ID modifier
 *
 * @example
 * ```typescript
 * import { id } from '@tachui/modifiers'
 *
 * // Set element ID
 * element.apply(id('main-header'))
 * element.apply(id('user-profile-123'))
 * ```
 */
export declare function id(value: IdValue): IdModifier
export type DataValue = string | number | boolean
export interface DataAttributes {
  [key: string]: DataValue
}
export interface DataOptions {
  data: DataAttributes
}
export type ReactiveDataOptions = ReactiveModifierProps<DataOptions>
export declare class DataModifier extends BaseModifier<DataOptions> {
  readonly type = 'data'
  readonly priority = 80
  constructor(options: ReactiveDataOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private formatDataAttributeName
  private formatDataAttributeValue
  private validateDataAttributes
}
/**
 * HTML data attributes modifier for testing selectors and analytics
 *
 * @example
 * ```typescript
 * import { data } from '@tachui/modifiers'
 *
 * // Single data attribute
 * element.apply(data({ testId: 'login-button' }))
 *
 * // Multiple data attributes
 * element.apply(data({
 *   testId: 'user-card',
 *   userId: 123,
 *   active: true,
 *   category: 'premium'
 * }))
 *
 * // Custom data attributes with kebab-case conversion
 * element.apply(data({
 *   customAttribute: 'value',  // becomes data-custom-attribute="value"
 *   'data-existing': 'kept'    // remains data-existing="kept"
 * }))
 * ```
 */
export declare function data(attributes: DataAttributes): DataModifier
export type TabIndexValue = number
export interface TabIndexOptions {
  tabIndex: TabIndexValue
}
export type ReactiveTabIndexOptions = ReactiveModifierProps<TabIndexOptions>
export declare class TabIndexModifier extends BaseModifier<TabIndexOptions> {
  readonly type = 'tabIndex'
  readonly priority = 75
  constructor(options: ReactiveTabIndexOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private validateTabIndex
}
/**
 * Tab index modifier for keyboard navigation control
 *
 * @example
 * ```typescript
 * import { tabIndex } from '@tachui/modifiers'
 *
 * // Make element focusable in natural tab order
 * element.apply(tabIndex(0))
 *
 * // Remove from tab order but keep programmatically focusable
 * element.apply(tabIndex(-1))
 *
 * // Force specific tab order (not recommended)
 * element.apply(tabIndex(1))
 * ```
 */
export declare function tabIndex(value: TabIndexValue): TabIndexModifier
//# sourceMappingURL=html.d.ts.map
