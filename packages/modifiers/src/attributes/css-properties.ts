/**
 * CSS Custom Properties Modifier - Best-in-class CSS variable management
 *
 * Comprehensive CSS custom properties (CSS variables) with full type safety,
 * scoping control, theme integration, and design system token support.
 */

import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '../basic/base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/core/modifiers/types'

// =============================================================================
// CSS Custom Properties Modifier
// =============================================================================

export type CSSPropertyValue = string | number
export type CSSPropertiesMap = Record<string, CSSPropertyValue>

export interface CustomPropertiesOptions {
  properties: CSSPropertiesMap
  scope?: 'local' | 'global' | 'root'
}

export type ReactiveCustomPropertiesOptions =
  ReactiveModifierProps<CustomPropertiesOptions>

export class CustomPropertiesModifier extends BaseModifier<CustomPropertiesOptions> {
  readonly type = 'customProperties'
  readonly priority = 5 // Early application for CSS variables

  constructor(options: ReactiveCustomPropertiesOptions) {
    super(options as unknown as CustomPropertiesOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeCustomPropertyStyles(this.properties)
    const element = context.element as HTMLElement | { style?: any }
    const styleTarget =
      element instanceof HTMLElement ? element.style : (element as any).style

    if (styleTarget && typeof styleTarget.setProperty === 'function') {
      for (const [propertyName, formatted] of Object.entries(styles)) {
        const baseName = propertyName.startsWith('--')
          ? propertyName.slice(2)
          : propertyName
        const normalizedName = `--${this.toCSSProperty(baseName)}`

        styleTarget.setProperty(normalizedName, formatted)
        try {
          styleTarget[normalizedName] = formatted
        } catch {
          // Some style implementations (CSSStyleDeclaration) may not allow direct assignment.
        }
      }
      return undefined
    }

    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeCustomPropertyStyles(
    props: CustomPropertiesOptions
  ): Record<string, string> {
    const styles: Record<string, string> = {}

    Object.entries(props.properties).forEach(([name, value]) => {
      const propertyName = name.startsWith('--') ? name : `--${name}`
      styles[propertyName] = this.formatPropertyValue(value)
    })

    return styles
  }

  private formatPropertyValue(value: CSSPropertyValue): string {
    if (typeof value === 'number') {
      return value.toString()
    }
    return String(value)
  }
}

/**
 * CSS custom properties modifier for creating CSS variables
 *
 * @example
 * ```typescript
 * import { customProperties } from '@tachui/modifiers'
 *
 * // Local CSS variables
 * element.apply(customProperties({
 *   properties: {
 *     'primary-color': '#007AFF',
 *     'font-size': 16,
 *     '--custom-spacing': '1rem'  // Already prefixed
 *   },
 *   scope: 'local'
 * }))
 *
 * // Global CSS variables
 * element.apply(customProperties({
 *   properties: {
 *     'app-background': '#ffffff',
 *     'app-foreground': '#000000'
 *   },
 *   scope: 'global'
 * }))
 * ```
 */
export function customProperties(
  options: CustomPropertiesOptions
): CustomPropertiesModifier {
  return new CustomPropertiesModifier({
    properties: options.properties,
    scope: options.scope || 'local',
  })
}

/**
 * Single CSS custom property modifier for individual variables
 *
 * @example
 * ```typescript
 * import { customProperty } from '@tachui/modifiers'
 *
 * // Single CSS variable
 * element.apply(customProperty('primary-color', '#007AFF'))
 *
 * // Already prefixed variable
 * element.apply(customProperty('--font-size', 16))
 *
 * // Global scope
 * element.apply(customProperty('theme-background', '#f0f0f0', 'global'))
 * ```
 */
export function customProperty(
  name: string,
  value: CSSPropertyValue,
  scope?: 'local' | 'global' | 'root'
): CustomPropertiesModifier {
  return new CustomPropertiesModifier({
    properties: { [name]: value },
    scope: scope || 'local',
  })
}

/**
 * CSS variables modifier - convenient alias for customProperties
 *
 * @example
 * ```typescript
 * import { cssVariables } from '@tachui/modifiers'
 *
 * // Multiple CSS variables
 * element.apply(cssVariables({
 *   'primary': '#007AFF',
 *   'secondary': '#34C759',
 *   'spacing': 16,
 *   'border-radius': '8px'
 * }))
 * ```
 */
export function cssVariables(
  variables: CSSPropertiesMap
): CustomPropertiesModifier {
  return new CustomPropertiesModifier({
    properties: variables,
    scope: 'local',
  })
}

// =============================================================================
// Theme Colors - Semantic Color System
// =============================================================================

export interface ThemeColorPalette {
  primary?: string
  secondary?: string
  accent?: string
  background?: string
  surface?: string
  text?: string
  textSecondary?: string
  border?: string
  error?: string
  warning?: string
  success?: string
  info?: string
  [key: string]: string | undefined
}

/**
 * Theme colors as CSS custom properties with semantic naming
 *
 * @example
 * ```typescript
 * import { themeColors } from '@tachui/modifiers'
 *
 * // Semantic theme colors
 * element.apply(themeColors({
 *   primary: '#007AFF',
 *   secondary: '#34C759',
 *   accent: '#FF9500',
 *   background: '#FFFFFF',
 *   surface: '#F2F2F7',
 *   text: '#000000',
 *   textSecondary: '#6D6D80',
 *   border: '#D1D1D6',
 *   error: '#FF3B30',
 *   warning: '#FF9500',
 *   success: '#34C759',
 *   info: '#007AFF'
 * }))
 *
 * // Custom theme colors
 * element.apply(themeColors({
 *   brandPrimary: '#6366F1',
 *   brandSecondary: '#EC4899',
 *   neutralLight: '#F8FAFC',
 *   neutralDark: '#0F172A'
 * }))
 * ```
 */
export function themeColors(
  colors: ThemeColorPalette
): CustomPropertiesModifier {
  const themeProperties: CSSPropertiesMap = {}

  Object.entries(colors).forEach(([name, value]) => {
    if (value !== undefined) {
      // Convert camelCase to kebab-case for CSS variable names
      const kebabName = name.replace(
        /[A-Z]/g,
        letter => `-${letter.toLowerCase()}`
      )
      themeProperties[`--theme-color-${kebabName}`] = value
    }
  })

  return new CustomPropertiesModifier({
    properties: themeProperties,
    scope: 'local',
  })
}

// =============================================================================
// Design Tokens - Design System Integration
// =============================================================================

export interface DesignTokens {
  // Spacing tokens
  'spacing-xs'?: number | string
  'spacing-sm'?: number | string
  'spacing-md'?: number | string
  'spacing-lg'?: number | string
  'spacing-xl'?: number | string
  'spacing-2xl'?: number | string

  // Typography tokens
  'font-size-xs'?: number | string
  'font-size-sm'?: number | string
  'font-size-base'?: number | string
  'font-size-lg'?: number | string
  'font-size-xl'?: number | string
  'font-size-2xl'?: number | string
  'font-size-3xl'?: number | string

  'font-weight-light'?: number
  'font-weight-normal'?: number
  'font-weight-medium'?: number
  'font-weight-semibold'?: number
  'font-weight-bold'?: number

  'line-height-tight'?: number | string
  'line-height-normal'?: number | string
  'line-height-relaxed'?: number | string
  'line-height-loose'?: number | string

  // Border radius tokens
  'radius-none'?: number | string
  'radius-sm'?: number | string
  'radius-md'?: number | string
  'radius-lg'?: number | string
  'radius-full'?: string

  // Shadow tokens
  'shadow-sm'?: string
  'shadow-md'?: string
  'shadow-lg'?: string
  'shadow-xl'?: string

  // Duration tokens for animations
  'duration-fast'?: string
  'duration-normal'?: string
  'duration-slow'?: string

  // Custom tokens
  [key: string]: string | number | undefined
}

/**
 * Design tokens as CSS custom properties for design system consistency
 *
 * @example
 * ```typescript
 * import { designTokens } from '@tachui/modifiers'
 *
 * // Spacing design tokens
 * element.apply(designTokens({
 *   'spacing-xs': 4,
 *   'spacing-sm': 8,
 *   'spacing-md': 16,
 *   'spacing-lg': 24,
 *   'spacing-xl': 32,
 *   'spacing-2xl': 48
 * }))
 *
 * // Typography design tokens
 * element.apply(designTokens({
 *   'font-size-sm': 14,
 *   'font-size-base': 16,
 *   'font-size-lg': 18,
 *   'font-size-xl': 20,
 *   'font-weight-normal': 400,
 *   'font-weight-medium': 500,
 *   'font-weight-bold': 700,
 *   'line-height-tight': 1.2,
 *   'line-height-normal': 1.5,
 *   'line-height-relaxed': 1.75
 * }))
 *
 * // Border and effects tokens
 * element.apply(designTokens({
 *   'radius-sm': 4,
 *   'radius-md': 8,
 *   'radius-lg': 12,
 *   'radius-full': '50%',
 *   'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
 *   'shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
 *   'shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
 *   'duration-fast': '150ms',
 *   'duration-normal': '300ms',
 *   'duration-slow': '500ms'
 * }))
 *
 * // Custom design tokens
 * element.apply(designTokens({
 *   'container-max-width': '1200px',
 *   'sidebar-width': '280px',
 *   'header-height': '64px',
 *   'z-index-modal': 1000,
 *   'z-index-tooltip': 1100
 * }))
 * ```
 */
export function designTokens(tokens: DesignTokens): CustomPropertiesModifier {
  const tokenProperties: CSSPropertiesMap = {}

  Object.entries(tokens).forEach(([name, value]) => {
    if (value !== undefined) {
      tokenProperties[`--token-${name}`] = value
    }
  })

  return new CustomPropertiesModifier({
    properties: tokenProperties,
    scope: 'local',
  })
}
