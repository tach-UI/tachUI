/**
 * ARIA Attributes Modifier - Best-in-class accessibility attribute management
 *
 * Comprehensive ARIA (Accessible Rich Internet Applications) attributes with
 * full type safety, validation, and development warnings for accessibility compliance.
 */

import type { DOMNode } from '@tachui/types/runtime'
import { BaseModifier } from '../basic/base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/types/modifiers'

// =============================================================================
// ARIA Attributes Modifier - Accessibility Attributes
// =============================================================================

export interface AriaAttributes {
  // Common ARIA attributes with strict type safety
  label?: string
  labelledby?: string
  labeledby?: string // Common typo support
  describedby?: string
  expanded?: boolean
  hidden?: boolean
  live?: 'off' | 'polite' | 'assertive'
  atomic?: boolean
  busy?: boolean
  controls?: string
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  disabled?: boolean
  grabbed?: boolean | 'true' | 'false' // Support for string booleans
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

  // Role attribute (special case)
  role?: string

  // Support for extended ARIA attributes
  [key: string]: string | number | boolean | undefined
}

export interface AriaOptions {
  aria: AriaAttributes
}

export type ReactiveAriaOptions = ReactiveModifierProps<AriaOptions>

export class AriaModifier extends BaseModifier<AriaOptions> {
  readonly type = 'aria'
  readonly priority = 90 // Highest priority for accessibility

  private static readonly KNOWN_ATTRIBUTES = new Set([
    'label',
    'labelledby',
    'describedby',
    'expanded',
    'hidden',
    'live',
    'atomic',
    'busy',
    'controls',
    'current',
    'disabled',
    'grabbed',
    'haspopup',
    'invalid',
    'level',
    'multiline',
    'multiselectable',
    'orientation',
    'owns',
    'placeholder',
    'posinset',
    'pressed',
    'readonly',
    'relevant',
    'required',
    'selected',
    'setsize',
    'sort',
    'valuemax',
    'valuemin',
    'valuenow',
    'valuetext',
    'role',
  ])

  constructor(options: ReactiveAriaOptions) {
    super(options as unknown as AriaOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { aria } = this.properties

    // Validate ARIA attributes in development mode only
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.validateAriaAttributes(aria)
    }

    // Apply ARIA attributes to DOM element efficiently
    Object.entries(aria).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const attributeName = this.formatAriaAttributeName(key)
        const attributeValue = this.formatAriaAttributeValue(value)
        context.element!.setAttribute(attributeName, attributeValue)
      }
    })

    return undefined
  }

  private formatAriaAttributeName(key: string): string {
    // Handle special cases
    if (key === 'role') {
      return 'role'
    }

    // Support common typo: labeledby -> labelledby
    if (key === 'labeledby') {
      key = 'labelledby'
    }

    // Convert camelCase to kebab-case and ensure aria- prefix
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
    return kebabKey.startsWith('aria-') ? kebabKey : `aria-${kebabKey}`
  }

  private formatAriaAttributeValue(value: string | number | boolean): string {
    // Handle boolean values consistently
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }
    return String(value)
  }

  private validateAriaAttributes(aria: AriaAttributes): void {
    Object.entries(aria).forEach(([key, value]) => {
      // Validate key format
      if (!key || typeof key !== 'string') {
        console.warn(
          'TachUI ARIA Modifier: ARIA attribute keys must be non-empty strings'
        )
        return
      }

      // Warn about unknown ARIA attributes (but still allow them for extensibility)
      const normalizedKey = key.replace(/^aria-/, '')
      if (
        !AriaModifier.KNOWN_ATTRIBUTES.has(normalizedKey) &&
        !key.startsWith('aria-')
      ) {
        console.warn(
          `TachUI ARIA Modifier: Unknown ARIA attribute "${key}". This may not be a valid ARIA attribute. Did you mean "${this.suggestCorrection(normalizedKey)}"?`
        )
      }

      // Validate specific attribute values
      this.validateSpecificAriaAttribute(key, value)
    })
  }

  private validateSpecificAriaAttribute(key: string, value: any): void {
    const normalizedKey = key.replace(/^aria-/, '')

    switch (normalizedKey) {
      case 'live':
        if (!['off', 'polite', 'assertive'].includes(value)) {
          console.warn(
            `TachUI ARIA Modifier: Invalid value "${value}" for aria-live. Valid values are: "off", "polite", "assertive"`
          )
        }
        break

      case 'haspopup':
        const validHaspopup = [
          'false',
          'true',
          'menu',
          'listbox',
          'tree',
          'grid',
          'dialog',
        ]
        if (typeof value === 'string' && !validHaspopup.includes(value)) {
          console.warn(
            `TachUI ARIA Modifier: Invalid value "${value}" for aria-haspopup. Valid values are: ${validHaspopup.join(', ')}`
          )
        }
        break

      case 'current':
        const validCurrent = ['page', 'step', 'location', 'date', 'time']
        if (typeof value === 'string' && !validCurrent.includes(value)) {
          console.warn(
            `TachUI ARIA Modifier: Invalid value "${value}" for aria-current. Valid values are: false, true, ${validCurrent.join(', ')}`
          )
        }
        break

      case 'invalid':
        const validInvalid = ['false', 'true', 'grammar', 'spelling']
        if (typeof value === 'string' && !validInvalid.includes(value)) {
          console.warn(
            `TachUI ARIA Modifier: Invalid value "${value}" for aria-invalid. Valid values are: ${validInvalid.join(', ')}`
          )
        }
        break

      case 'orientation':
        if (!['horizontal', 'vertical'].includes(value as string)) {
          console.warn(
            `TachUI ARIA Modifier: Invalid value "${value}" for aria-orientation. Valid values are: "horizontal", "vertical"`
          )
        }
        break

      case 'sort':
        if (
          !['none', 'ascending', 'descending', 'other'].includes(
            value as string
          )
        ) {
          console.warn(
            `TachUI ARIA Modifier: Invalid value "${value}" for aria-sort. Valid values are: "none", "ascending", "descending", "other"`
          )
        }
        break

      case 'pressed':
        const validPressed = ['true', 'false', 'mixed']
        if (typeof value === 'string' && !validPressed.includes(value)) {
          console.warn(
            `TachUI ARIA Modifier: Invalid value "${value}" for aria-pressed. Valid values are: ${validPressed.join(', ')}`
          )
        }
        break

      // Numeric attributes validation
      case 'level':
      case 'posinset':
      case 'setsize':
      case 'valuemax':
      case 'valuemin':
      case 'valuenow':
        if (typeof value === 'number') {
          if (value < 0 || !Number.isInteger(value)) {
            console.warn(
              `TachUI ARIA Modifier: Invalid value "${value}" for aria-${normalizedKey}. Must be a non-negative integer.`
            )
          }
        }
        break
    }
  }

  private suggestCorrection(key: string): string {
    const suggestions: Record<string, string> = {
      lable: 'label',
      labeledby: 'labelledby',
      descripedby: 'describedby',
      described: 'describedby',
      controled: 'controls',
      controles: 'controls',
      expaned: 'expanded',
      expandd: 'expanded',
      hiden: 'hidden',
      hidde: 'hidden',
      disbled: 'disabled',
      disable: 'disabled',
      requird: 'required',
      require: 'required',
      selectd: 'selected',
      select: 'selected',
      orientaton: 'orientation',
    }

    return suggestions[key] || key
  }
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
export function aria(attributes: AriaAttributes): AriaModifier {
  return new AriaModifier({ aria: attributes })
}
