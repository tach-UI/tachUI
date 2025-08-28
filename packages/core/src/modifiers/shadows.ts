/**
 * Shadow Modifiers - Comprehensive shadow system
 *
 * Provides enhanced shadow styling with Material Design presets,
 * multiple shadow support, and text shadow capabilities.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'

export interface ShadowConfig {
  x: number                    // Horizontal offset
  y: number                    // Vertical offset
  blur: number                 // Blur radius
  spread?: number              // Spread radius (default: 0)
  color: string                // Shadow color
  inset?: boolean              // Inset shadow (default: false)
  type?: 'drop' | 'inner' | 'text'  // Shadow type (default: 'drop')
}

export interface ShadowPreset {
  name: string
  shadows: ShadowConfig[]
  description?: string
}

export interface ShadowOptions {
  shadow?: ShadowConfig
  shadows?: ShadowConfig[]
  textShadow?: ShadowConfig | ShadowConfig[]
  preset?: string
}

export type ReactiveShadowOptions = ReactiveModifierProps<ShadowOptions>

export class ShadowModifier extends BaseModifier<ShadowOptions> {
  readonly type = 'shadow'
  readonly priority = 30

  constructor(options: ReactiveShadowOptions) {
    const resolvedOptions: ShadowOptions = {}
    for (const [key, value] of Object.entries(options)) {
      if (typeof value === 'function' && 'peek' in value) {
        ;(resolvedOptions as any)[key] = (value as any).peek()
      } else {
        ;(resolvedOptions as any)[key] = value
      }
    }
    
    super(resolvedOptions)
    
    // Validate shadow configurations in development mode
    if (process.env.NODE_ENV === 'development') {
      this.validateShadowConfigurations(resolvedOptions)
    }
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeShadowStyles(this.properties)
    this.applyStyles(context.element, styles)
    
    return undefined
  }

  private computeShadowStyles(props: ShadowOptions) {
    const styles: Record<string, string> = {}

    // Handle preset shadows
    if (props.preset) {
      const preset = shadowPresets[props.preset]
      if (preset) {
        styles.boxShadow = this.generateShadowCSS(preset.shadows)
      } else {
        console.warn(`Shadow preset "${props.preset}" not found`)
      }
    }

    // Handle single shadow
    if (props.shadow) {
      styles.boxShadow = this.generateShadowCSS([props.shadow])
    }

    // Handle multiple shadows
    if (props.shadows) {
      styles.boxShadow = this.generateShadowCSS(props.shadows)
    }

    // Handle text shadow
    if (props.textShadow) {
      const shadowConfigs = Array.isArray(props.textShadow) ? props.textShadow : [props.textShadow]
      styles.textShadow = this.generateTextShadowCSS(shadowConfigs)
    }

    return styles
  }

  private generateShadowCSS(shadows: ShadowConfig[]): string {
    return shadows.map(shadow => {
      const insetPrefix = shadow.inset ? 'inset ' : ''
      const spreadValue = shadow.spread !== undefined ? ` ${this.formatLength(shadow.spread)}` : ''
      
      return `${insetPrefix}${this.formatLength(shadow.x)} ${this.formatLength(shadow.y)} ${this.formatLength(shadow.blur)}${spreadValue} ${shadow.color}`
    }).join(', ')
  }

  private generateTextShadowCSS(shadows: ShadowConfig[]): string {
    return shadows.map(shadow => 
      `${this.formatLength(shadow.x)} ${this.formatLength(shadow.y)} ${this.formatLength(shadow.blur)} ${shadow.color}`
    ).join(', ')
  }

  private formatLength(value: number): string {
    return `${value}px`
  }

  /**
   * Validate shadow configurations for common mistakes
   */
  private validateShadowConfigurations(options: ShadowOptions): void {
    // Validate textShadow configurations
    if (options.textShadow) {
      const shadows = Array.isArray(options.textShadow) ? options.textShadow : [options.textShadow]
      shadows.forEach((shadow, index) => {
        this.validateShadowConfig(shadow, `textShadow[${index}]`)
      })
    }

    // Validate regular shadow configurations
    if (options.shadow) {
      this.validateShadowConfig(options.shadow, 'shadow')
    }

    if (options.shadows) {
      options.shadows.forEach((shadow, index) => {
        this.validateShadowConfig(shadow, `shadows[${index}]`)
      })
    }
  }

  /**
   * Validate individual shadow configuration for common mistakes
   */
  private validateShadowConfig(config: any, context: string): void {
    if (!config || typeof config !== 'object') return

    const validKeys = ['x', 'y', 'blur', 'spread', 'color', 'inset', 'type']
    const requiredKeys = ['x', 'y', 'blur', 'color']
    const commonMistakes = {
      'radius': 'blur',
      'blurRadius': 'blur', 
      'horizontal': 'x',
      'vertical': 'y',
      'offsetX': 'x',
      'offsetY': 'y'
    }

    // Check for invalid properties
    const invalidKeys = Object.keys(config).filter(key => !validKeys.includes(key))
    if (invalidKeys.length > 0) {
      console.warn(`TachUI Shadow (${context}): Invalid properties found: ${invalidKeys.join(', ')}`)
      
      // Suggest corrections for common mistakes
      invalidKeys.forEach(key => {
        if (commonMistakes[key as keyof typeof commonMistakes]) {
          console.warn(`  ❌ "${key}" should be "${commonMistakes[key as keyof typeof commonMistakes]}"`)
        }
      })
      
      console.warn(`  ✅ Valid properties: ${validKeys.join(', ')}`)
    }

    // Check for missing required properties
    const missingKeys = requiredKeys.filter(key => config[key] === undefined)
    if (missingKeys.length > 0) {
      console.error(`TachUI Shadow (${context}): Missing required properties: ${missingKeys.join(', ')}`)
    }

    // Specific check for the radius vs blur mistake
    if (config.radius !== undefined && config.blur === undefined) {
      console.error(`TachUI Shadow (${context}): "radius" is not a valid property. Use "blur" instead.`)
      console.error(`  Current: { ..., radius: ${config.radius} }`)
      console.error(`  Correct: { ..., blur: ${config.radius} }`)
    }
  }
}

// Shadow presets following Material Design elevation
const shadowPresets: Record<string, ShadowPreset> = {
  'elevation-1': {
    name: 'Material Design Elevation 1',
    shadows: [
      { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.12)' },
      { x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.24)' }
    ]
  },
  'elevation-2': {
    name: 'Material Design Elevation 2', 
    shadows: [
      { x: 0, y: 3, blur: 6, color: 'rgba(0,0,0,0.15)' },
      { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.12)' }
    ]
  },
  'elevation-3': {
    name: 'Material Design Elevation 3',
    shadows: [
      { x: 0, y: 10, blur: 20, color: 'rgba(0,0,0,0.15)' },
      { x: 0, y: 3, blur: 6, color: 'rgba(0,0,0,0.10)' }
    ]
  },
  'depth-small': {
    name: 'Small Depth Shadow',
    shadows: [{ x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.1)' }]
  },
  'depth-medium': {
    name: 'Medium Depth Shadow',
    shadows: [
      { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' },
      { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.12)' }
    ]
  },
  'depth-large': {
    name: 'Large Depth Shadow',
    shadows: [
      { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.12)' },
      { x: 0, y: 8, blur: 24, color: 'rgba(0,0,0,0.15)' }
    ]
  }
}

/**
 * Enhanced shadow modifier - backward compatible single shadow
 *
 * @example
 * ```typescript
 * .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
 * .shadow({ x: 2, y: 4, blur: 8, spread: 1, color: '#000', inset: true })
 * ```
 */
export function shadow(config: ShadowConfig): ShadowModifier {
  return new ShadowModifier({ shadow: config })
}

/**
 * Multiple shadows modifier
 *
 * @example
 * ```typescript
 * .shadows([
 *   { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.12)' },
 *   { x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.24)' }
 * ])
 * ```
 */
export function shadows(configs: ShadowConfig[]): ShadowModifier {
  return new ShadowModifier({ shadows: configs })
}

/**
 * Text shadow modifier
 *
 * @example
 * ```typescript
 * .textShadow({ x: 1, y: 1, blur: 2, color: 'rgba(0,0,0,0.5)' })
 * .textShadow([
 *   { x: 1, y: 1, blur: 0, color: '#ff0000' },
 *   { x: -1, y: -1, blur: 0, color: '#0000ff' }
 * ])
 * ```
 */
export function textShadow(config: ShadowConfig | ShadowConfig[]): ShadowModifier {
  return new ShadowModifier({ textShadow: config })
}

/**
 * Shadow preset modifier
 *
 * @example
 * ```typescript
 * .shadowPreset('elevation-1')  // Material Design elevation 1
 * .shadowPreset('depth-medium') // Medium depth shadow
 * ```
 */
export function shadowPreset(presetName: string): ShadowModifier {
  return new ShadowModifier({ preset: presetName })
}

/**
 * Create custom shadow preset
 *
 * @example
 * ```typescript
 * createShadowPreset('my-custom', [
 *   { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.15)' }
 * ])
 * .shadowPreset('my-custom') // Use the custom preset
 * ```
 */
export function createShadowPreset(name: string, shadows: ShadowConfig[]): void {
  shadowPresets[name] = {
    name,
    shadows,
    description: `Custom shadow preset: ${name}`
  }
}

/**
 * Get available shadow preset names
 */
export function getShadowPresets(): string[] {
  return Object.keys(shadowPresets)
}

/**
 * Get shadow preset configuration
 */
export function getShadowPreset(name: string): ShadowPreset | undefined {
  return shadowPresets[name]
}