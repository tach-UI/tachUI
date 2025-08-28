/**
 * HTML and ARIA Attributes Implementation
 *
 * Implementation of HTML attributes, ARIA accessibility attributes, and related modifiers.
 * These modifiers provide essential web functionality for accessibility, testing, and semantic markup.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'
import { ModifierPriority } from './types'

// ============================================================================
// HTML and ARIA Attribute Modifiers
// ============================================================================

/**
 * ID Modifier - HTML Element ID
 * Sets the id attribute for page anchoring, accessibility, and testing selectors
 */
export interface IdOptions {
  id: string
}

export type ReactiveIdOptions = ReactiveModifierProps<IdOptions>

export class IdModifier extends BaseModifier<IdOptions> {
  readonly type = 'id'
  readonly priority = ModifierPriority.CUSTOM + 10

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { id } = this.properties

    // Validate ID in development mode
    if (process.env.NODE_ENV === 'development') {
      this.validateId(id)
    }

    // Set id attribute
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
      console.warn(`TachUI ID Modifier: Invalid ID format "${id}". IDs must start with a letter and contain only letters, digits, hyphens, underscores, colons, and periods.`)
    }

    // Check for duplicate IDs in development
    if (document.getElementById(id)) {
      console.warn(`TachUI ID Modifier: Duplicate ID "${id}" detected. IDs should be unique within the document.`)
    }
  }
}

/**
 * ID modifier function
 */
export function id(value: string): IdModifier {
  return new IdModifier({ id: value })
}

// ============================================================================
// Data Attributes Modifier - Data Attributes for Testing and Analytics
// ============================================================================

export interface DataAttributes {
  [key: string]: string | number | boolean
}

export interface DataOptions {
  data: DataAttributes
}

export type ReactiveDataOptions = ReactiveModifierProps<DataOptions>

export class DataModifier extends BaseModifier<DataOptions> {
  readonly type = 'data'
  readonly priority = ModifierPriority.CUSTOM + 5

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { data } = this.properties

    // Validate data attributes in development mode
    if (process.env.NODE_ENV === 'development') {
      this.validateDataAttributes(data)
    }

    // Apply data attributes
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

  private formatDataAttributeValue(value: string | number | boolean): string {
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }
    return String(value)
  }

  private validateDataAttributes(data: DataAttributes): void {
    Object.entries(data).forEach(([key, value]) => {
      // Validate key format
      if (!key || typeof key !== 'string') {
        console.warn('TachUI Data Modifier: Data attribute keys must be non-empty strings')
        return
      }

      // Check for valid data attribute naming
      const validKeyPattern = /^[a-zA-Z][a-zA-Z0-9-_]*$/
      if (!validKeyPattern.test(key.replace(/^data-/, ''))) {
        console.warn(`TachUI Data Modifier: Invalid data attribute key "${key}". Keys should contain only letters, numbers, hyphens, and underscores.`)
      }

      // Validate value types
      if (value !== null && value !== undefined && 
          typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        console.warn(`TachUI Data Modifier: Data attribute "${key}" has invalid value type. Only strings, numbers, and booleans are supported.`)
      }
    })
  }
}

/**
 * Data attributes modifier function
 */
export function data(attributes: DataAttributes): DataModifier {
  return new DataModifier({ data: attributes })
}

// ============================================================================
// ARIA Attributes Modifier - Accessibility Attributes
// ============================================================================

export interface AriaAttributes {
  // Common ARIA attributes with type safety
  label?: string
  labelledby?: string
  describedby?: string
  expanded?: boolean
  hidden?: boolean
  live?: 'off' | 'polite' | 'assertive'
  atomic?: boolean
  busy?: boolean
  controls?: string
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  disabled?: boolean
  grabbed?: boolean
  haspopup?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  invalid?: boolean | 'false' | 'true' | 'grammar' | 'spelling'
  level?: number
  multiline?: boolean
  multiselectable?: boolean
  orientation?: 'horizontal' | 'vertical'
  owns?: string
  placeholder?: string
  posinset?: number
  pressed?: boolean
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
  // Allow custom ARIA attributes
  [key: string]: string | number | boolean | undefined
}

export interface AriaOptions {
  aria: AriaAttributes
}

export type ReactiveAriaOptions = ReactiveModifierProps<AriaOptions>

export class AriaModifier extends BaseModifier<AriaOptions> {
  readonly type = 'aria'
  readonly priority = ModifierPriority.CUSTOM + 15

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { aria } = this.properties

    // Validate ARIA attributes in development mode
    if (process.env.NODE_ENV === 'development') {
      this.validateAriaAttributes(aria)
    }

    // Apply ARIA attributes
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
    // Handle special case of 'role' attribute
    if (key === 'role') {
      return 'role'
    }

    // Convert camelCase to kebab-case and ensure aria- prefix
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
    return kebabKey.startsWith('aria-') ? kebabKey : `aria-${kebabKey}`
  }

  private formatAriaAttributeValue(value: string | number | boolean): string {
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }
    return String(value)
  }

  private validateAriaAttributes(aria: AriaAttributes): void {
    const knownAttributes = new Set([
      'label', 'labelledby', 'describedby', 'expanded', 'hidden', 'live', 'atomic',
      'busy', 'controls', 'current', 'disabled', 'grabbed', 'haspopup', 'invalid',
      'level', 'multiline', 'multiselectable', 'orientation', 'owns', 'placeholder',
      'posinset', 'pressed', 'readonly', 'relevant', 'required', 'selected',
      'setsize', 'sort', 'valuemax', 'valuemin', 'valuenow', 'valuetext', 'role'
    ])

    Object.entries(aria).forEach(([key, value]) => {
      // Check for valid attribute names
      if (!key || typeof key !== 'string') {
        console.warn('TachUI ARIA Modifier: ARIA attribute keys must be non-empty strings')
        return
      }

      // Warn about unknown ARIA attributes (but still allow them for extensibility)
      const normalizedKey = key.replace(/^aria-/, '')
      if (!knownAttributes.has(normalizedKey) && !normalizedKey.startsWith('aria-')) {
        console.warn(`TachUI ARIA Modifier: Unknown ARIA attribute "${key}". This may not be a valid ARIA attribute. Did you mean "${this.suggestCorrection(normalizedKey)}"?`)
      }

      // Validate specific attribute values
      this.validateSpecificAriaAttribute(key, value)
    })
  }

  private validateSpecificAriaAttribute(key: string, value: any): void {
    const normalizedKey = key.replace(/^aria-/, '')

    switch (normalizedKey) {
      case 'live':
        if (value !== 'off' && value !== 'polite' && value !== 'assertive') {
          console.warn(`TachUI ARIA Modifier: Invalid value "${value}" for aria-live. Valid values are: "off", "polite", "assertive"`)
        }
        break
      case 'haspopup':
        if (typeof value === 'string' && !['false', 'true', 'menu', 'listbox', 'tree', 'grid', 'dialog'].includes(value)) {
          console.warn(`TachUI ARIA Modifier: Invalid value "${value}" for aria-haspopup. Valid values are: false, true, "menu", "listbox", "tree", "grid", "dialog"`)
        }
        break
      case 'current':
        if (typeof value === 'string' && !['page', 'step', 'location', 'date', 'time'].includes(value)) {
          console.warn(`TachUI ARIA Modifier: Invalid value "${value}" for aria-current. Valid values are: false, true, "page", "step", "location", "date", "time"`)
        }
        break
      case 'invalid':
        if (typeof value === 'string' && !['false', 'true', 'grammar', 'spelling'].includes(value)) {
          console.warn(`TachUI ARIA Modifier: Invalid value "${value}" for aria-invalid. Valid values are: false, true, "grammar", "spelling"`)
        }
        break
      case 'orientation':
        if (value !== 'horizontal' && value !== 'vertical') {
          console.warn(`TachUI ARIA Modifier: Invalid value "${value}" for aria-orientation. Valid values are: "horizontal", "vertical"`)
        }
        break
      case 'sort':
        if (!['none', 'ascending', 'descending', 'other'].includes(value as string)) {
          console.warn(`TachUI ARIA Modifier: Invalid value "${value}" for aria-sort. Valid values are: "none", "ascending", "descending", "other"`)
        }
        break
      case 'level':
      case 'posinset':
      case 'setsize':
      case 'valuemax':
      case 'valuemin':
      case 'valuenow':
        if (typeof value === 'number' && (value < 0 || !Number.isInteger(value))) {
          console.warn(`TachUI ARIA Modifier: Invalid value "${value}" for aria-${normalizedKey}. Must be a non-negative integer.`)
        }
        break
    }
  }

  private suggestCorrection(key: string): string {
    const suggestions: Record<string, string> = {
      'lable': 'label',
      'labeledby': 'labelledby',
      'descripedby': 'describedby',
      'descibed': 'describedby',
      'controled': 'controls',
      'expaned': 'expanded',
      'hiden': 'hidden',
      'disbled': 'disabled',
      'requird': 'required',
      'selectd': 'selected'
    }
    
    return suggestions[key] || key
  }
}

/**
 * ARIA attributes modifier function
 */
export function aria(attributes: AriaAttributes): AriaModifier {
  return new AriaModifier({ aria: attributes })
}

// NOTE: TextShadow functionality has been moved to enhanced.ts for unified shadow system
// Use the enhanced textShadow modifier instead: import { textShadow } from './enhanced'

// ============================================================================
// Tab Index Modifier - Tab Navigation Order
// ============================================================================

export interface TabIndexOptions {
  tabIndex: number
}

export type ReactiveTabIndexOptions = ReactiveModifierProps<TabIndexOptions>

export class TabIndexModifier extends BaseModifier<TabIndexOptions> {
  readonly type = 'tabIndex'
  readonly priority = ModifierPriority.CUSTOM + 12

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { tabIndex } = this.properties

    // Validate tabIndex in development mode
    if (process.env.NODE_ENV === 'development') {
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

    // Provide helpful guidance
    if (tabIndex > 0) {
      console.info('TachUI TabIndex Modifier: Positive tabIndex values can disrupt natural tab order. Consider using tabIndex="0" for focusable elements and tabIndex="-1" for programmatically focusable elements.')
    }

    if (tabIndex < -1) {
      console.warn('TachUI TabIndex Modifier: tabIndex values less than -1 are not recommended. Use -1 to remove from tab order or 0+ for tab order.')
    }
  }
}

/**
 * TabIndex modifier function
 */
export function tabIndex(value: number): TabIndexModifier {
  return new TabIndexModifier({ tabIndex: value })
}

// ============================================================================
// CSS Custom Properties Modifier (Moved from css-features.ts)
// ============================================================================

export interface CSSCustomPropertiesConfig {
  properties: Record<string, string | number>
  scope?: 'local' | 'global' | 'root'
}

export interface CustomPropertiesOptions {
  properties?: Record<string, string | number>
  scope?: 'local' | 'global' | 'root'
}

export type ReactiveCustomPropertiesOptions = ReactiveModifierProps<CustomPropertiesOptions>

export class CustomPropertiesModifier extends BaseModifier<CustomPropertiesOptions> {
  readonly type = 'customProperties'
  readonly priority = 5  // Early application for CSS variables

  constructor(options: ReactiveCustomPropertiesOptions) {
    const resolvedOptions: CustomPropertiesOptions = {}
    for (const [key, value] of Object.entries(options)) {
      if (typeof value === 'function' && 'peek' in value) {
        ;(resolvedOptions as any)[key] = (value as any).peek()
      } else {
        ;(resolvedOptions as any)[key] = value
      }
    }
    super(resolvedOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeCustomPropertyStyles(this.properties)
    this.applyStyles(context.element, styles)
    
    return undefined
  }

  private computeCustomPropertyStyles(props: CustomPropertiesOptions) {
    const styles: Record<string, string> = {}

    if (props.properties) {
      for (const [name, value] of Object.entries(props.properties)) {
        const propertyName = name.startsWith('--') ? name : `--${name}`
        styles[propertyName] = this.formatPropertyValue(value)
      }
    }

    return styles
  }

  private formatPropertyValue(value: string | number): string {
    if (typeof value === 'number') {
      return value.toString()
    }
    return value
  }
}

/**
 * CSS custom properties modifier for creating CSS variables
 *
 * @example
 * ```typescript
 * .customProperties({
 *   properties: {
 *     'primary-color': '#007AFF',
 *     'font-size': 16,
 *     '--custom-spacing': '1rem'  // Already prefixed
 *   },
 *   scope: 'local'
 * })
 * ```
 */
export function customProperties(config: CSSCustomPropertiesConfig): CustomPropertiesModifier {
  return new CustomPropertiesModifier({
    properties: config.properties,
    scope: config.scope || 'local'
  })
}

/**
 * Single CSS custom property modifier
 *
 * @example
 * ```typescript
 * .customProperty('primary-color', '#007AFF')
 * .customProperty('--font-size', 16)  // Already prefixed
 * .customProperty('spacing', '1rem', 'global')
 * ```
 */
export function customProperty(name: string, value: string | number, scope?: 'local' | 'global' | 'root'): CustomPropertiesModifier {
  const propertyName = name.startsWith('--') ? name : `--${name}`
  return new CustomPropertiesModifier({
    properties: { [propertyName]: value },
    scope: scope || 'local'
  })
}

/**
 * CSS variables modifier - alias for customProperties
 *
 * @example
 * ```typescript
 * .cssVariables({
 *   'primary': '#007AFF',
 *   'secondary': '#34C759',
 *   'spacing': 16
 * })
 * ```
 */
export function cssVariables(variables: Record<string, string | number>): CustomPropertiesModifier {
  return new CustomPropertiesModifier({
    properties: variables,
    scope: 'local'
  })
}

/**
 * Theme colors as CSS custom properties
 *
 * @example
 * ```typescript
 * .themeColors({
 *   primary: '#007AFF',
 *   secondary: '#34C759',
 *   accent: '#FF9500',
 *   background: '#FFFFFF',
 *   surface: '#F2F2F7'
 * })
 * ```
 */
export function themeColors(colors: Record<string, string>): CustomPropertiesModifier {
  const themeProperties: Record<string, string> = {}
  for (const [name, value] of Object.entries(colors)) {
    themeProperties[`--theme-color-${name}`] = value
  }
  return new CustomPropertiesModifier({
    properties: themeProperties,
    scope: 'local'
  })
}

/**
 * Design tokens as CSS custom properties
 *
 * @example
 * ```typescript
 * .designTokens({
 *   'spacing-sm': 8,
 *   'spacing-md': 16,
 *   'spacing-lg': 24,
 *   'border-radius': 8,
 *   'font-size-body': 16,
 *   'font-size-title': 24
 * })
 * ```
 */
export function designTokens(tokens: Record<string, string | number>): CustomPropertiesModifier {
  const tokenProperties: Record<string, string | number> = {}
  for (const [name, value] of Object.entries(tokens)) {
    tokenProperties[`--token-${name}`] = value
  }
  return new CustomPropertiesModifier({
    properties: tokenProperties,
    scope: 'local'
  })
}