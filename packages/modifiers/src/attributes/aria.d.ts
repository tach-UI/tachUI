/**
 * ARIA Attributes Modifier - Best-in-class accessibility attribute management
 *
 * Comprehensive ARIA (Accessible Rich Internet Applications) attributes with
 * full type safety, validation, and development warnings for accessibility compliance.
 */
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/core/modifiers/types'
export interface AriaAttributes {
  label?: string
  labelledby?: string
  labeledby?: string
  describedby?: string
  expanded?: boolean
  hidden?: boolean
  live?: 'off' | 'polite' | 'assertive'
  atomic?: boolean
  busy?: boolean
  controls?: string
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  disabled?: boolean
  grabbed?: boolean | 'true' | 'false'
  haspopup?:
    | boolean
    | 'false'
    | 'true'
    | 'menu'
    | 'listbox'
    | 'tree'
    | 'grid'
    | 'dialog'
  invalid?: boolean | 'false' | 'true' | 'grammar' | 'spelling'
  level?: number
  multiline?: boolean
  multiselectable?: boolean
  orientation?: 'horizontal' | 'vertical'
  owns?: string
  placeholder?: string
  posinset?: number
  pressed?: boolean | 'true' | 'false' | 'mixed'
  readonly?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all' | string
  required?: boolean
  selected?: boolean
  setsize?: number
  sort?: 'none' | 'ascending' | 'descending' | 'other'
  valuemax?: number
  valuemin?: number
  valuenow?: number
  valuetext?: string
  role?: string
  [key: string]: string | number | boolean | undefined
}
export interface AriaOptions {
  aria: AriaAttributes
}
export type ReactiveAriaOptions = ReactiveModifierProps<AriaOptions>
export declare class AriaModifier extends BaseModifier<AriaOptions> {
  readonly type = 'aria'
  readonly priority = 90
  private static readonly KNOWN_ATTRIBUTES
  constructor(options: ReactiveAriaOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private formatAriaAttributeName
  private formatAriaAttributeValue
  private validateAriaAttributes
  private validateSpecificAriaAttribute
  private suggestCorrection
}
/**
 * ARIA attributes modifier for accessibility compliance
 *
 * @example
 * ```typescript
 * import { aria } from '@tachui/modifiers'
 *
 * // Basic accessibility attributes
 * element.apply(aria({
 *   label: 'Close dialog',
 *   role: 'button',
 *   expanded: false
 * }))
 *
 * // Form accessibility
 * element.apply(aria({
 *   required: true,
 *   invalid: false,
 *   describedby: 'error-message'
 * }))
 *
 * // Complex widget accessibility
 * element.apply(aria({
 *   role: 'tab',
 *   selected: true,
 *   controls: 'panel-1',
 *   labelledby: 'tab-label-1'
 * }))
 *
 * // Live region for dynamic content
 * element.apply(aria({
 *   live: 'polite',
 *   atomic: true,
 *   relevant: 'additions text'
 * }))
 * ```
 */
export declare function aria(attributes: AriaAttributes): AriaModifier
//# sourceMappingURL=aria.d.ts.map
