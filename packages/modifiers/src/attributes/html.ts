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

// =============================================================================
// ID Modifier - HTML Element ID
// =============================================================================

export type IdValue = string
export interface IdOptions {
  id: IdValue
}

export type ReactiveIdOptions = ReactiveModifierProps<IdOptions>

export class IdModifier extends BaseModifier<IdOptions> {
  readonly type = 'id'
  readonly priority = 85 // High priority for HTML attributes

  constructor(options: ReactiveIdOptions) {
    super(options as unknown as IdOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { id } = this.properties

    // Validate ID in development mode only
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.validateId(id)
    }

    // Set id attribute directly
    context.element.setAttribute('id', id)

    return undefined
  }

  private validateId(id: string): void {
    // Check for valid HTML ID format
    if (!id || typeof id !== 'string') {
      console.warn('TachUI ID Modifier: ID must be a non-empty string')
      return
    }

    // HTML ID rules: must start with letter, can contain letters, digits, hyphens, underscores, colons, periods
    const validIdPattern = /^[a-zA-Z][a-zA-Z0-9_:-]*$/
    if (!validIdPattern.test(id)) {
      console.warn(
        `TachUI ID Modifier: Invalid ID format "${id}". IDs must start with a letter and contain only letters, digits, hyphens, underscores, colons, and periods.`
      )
    }

    // Check for duplicate IDs in development (with document check)
    if (
      typeof document !== 'undefined' &&
      document.getElementById &&
      document.getElementById(id)
    ) {
      console.warn(
        `TachUI ID Modifier: Duplicate ID "${id}" detected. IDs should be unique within the document.`
      )
    }
  }
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
export function id(value: IdValue): IdModifier {
  return new IdModifier({ id: value })
}

// =============================================================================
// Data Attributes Modifier - Data Attributes for Testing and Analytics
// =============================================================================

export type DataValue = string | number | boolean
export interface DataAttributes {
  [key: string]: DataValue
}

export interface DataOptions {
  data: DataAttributes
}

export type ReactiveDataOptions = ReactiveModifierProps<DataOptions>

export class DataModifier extends BaseModifier<DataOptions> {
  readonly type = 'data'
  readonly priority = 80 // High priority for HTML attributes

  constructor(options: ReactiveDataOptions) {
    super(options as unknown as DataOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { data } = this.properties

    // Validate data attributes in development mode only
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.validateDataAttributes(data)
    }

    // Apply data attributes efficiently
    Object.entries(data).forEach(([key, value]) => {
      const attributeName = this.formatDataAttributeName(key)
      const attributeValue = this.formatDataAttributeValue(value)
      context.element!.setAttribute(attributeName, attributeValue)
    })

    return undefined
  }

  private formatDataAttributeName(key: string): string {
    // Convert camelCase to kebab-case and ensure data- prefix
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
    return kebabKey.startsWith('data-') ? kebabKey : `data-${kebabKey}`
  }

  private formatDataAttributeValue(value: DataValue): string {
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }
    return String(value)
  }

  private validateDataAttributes(data: DataAttributes): void {
    Object.entries(data).forEach(([key, value]) => {
      // Validate key format
      if (!key || typeof key !== 'string') {
        console.warn(
          'TachUI Data Modifier: Data attribute keys must be non-empty strings'
        )
        return
      }

      // Check for valid data attribute naming
      const cleanKey = key.replace(/^data-/, '')
      const validKeyPattern = /^[a-zA-Z][a-zA-Z0-9-_]*$/
      if (!validKeyPattern.test(cleanKey)) {
        console.warn(
          `TachUI Data Modifier: Invalid data attribute key "${key}". Keys should start with a letter and contain only letters, numbers, hyphens, and underscores.`
        )
      }

      // Validate value types
      if (
        value !== null &&
        value !== undefined &&
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean'
      ) {
        console.warn(
          `TachUI Data Modifier: Data attribute "${key}" has invalid value type "${typeof value}". Only strings, numbers, and booleans are supported.`
        )
      }
    })
  }
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
export function data(attributes: DataAttributes): DataModifier {
  return new DataModifier({ data: attributes })
}

// =============================================================================
// Tab Index Modifier - Tab Navigation Order
// =============================================================================

export type TabIndexValue = number
export interface TabIndexOptions {
  tabIndex: TabIndexValue
}

export type ReactiveTabIndexOptions = ReactiveModifierProps<TabIndexOptions>

export class TabIndexModifier extends BaseModifier<TabIndexOptions> {
  readonly type = 'tabIndex'
  readonly priority = 75 // High priority for accessibility

  constructor(options: ReactiveTabIndexOptions) {
    super(options as unknown as TabIndexOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { tabIndex } = this.properties

    // Validate tabIndex in development mode only
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      this.validateTabIndex(tabIndex)
    }

    // Set tabindex attribute
    context.element.setAttribute('tabindex', String(tabIndex))

    return undefined
  }

  private validateTabIndex(tabIndex: number): void {
    if (typeof tabIndex !== 'number' || !Number.isInteger(tabIndex)) {
      console.warn('TachUI TabIndex Modifier: tabIndex must be an integer')
      return
    }

    // Provide helpful guidance for accessibility
    if (tabIndex > 0) {
      console.info(
        'TachUI TabIndex Modifier: Positive tabIndex values can disrupt natural tab order. Consider using tabIndex="0" for focusable elements and tabIndex="-1" for programmatically focusable elements.'
      )
    }

    if (tabIndex < -1) {
      console.warn(
        'TachUI TabIndex Modifier: tabIndex values less than -1 are not recommended. Use -1 to remove from tab order or 0+ for tab order.'
      )
    }
  }
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
export function tabIndex(value: TabIndexValue): TabIndexModifier {
  return new TabIndexModifier({ tabIndex: value })
}
