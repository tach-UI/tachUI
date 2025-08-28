/**
 * Custom Icon Set Builder - Phase 2.7
 * API for creating third-party icon set integrations
 */

import type { IconSet, IconDefinition, SymbolVariant, SymbolWeight } from '../types.js'

export interface CustomIconConfig {
  name: string
  svg: string
  viewBox?: string
  variants?: SymbolVariant[]
  weights?: SymbolWeight[]
  metadata?: {
    category?: string
    tags?: string[]
    unicodePoint?: string
    alternativeNames?: string[]
  }
}

export interface IconSetConfig {
  name: string
  version: string
  baseUrl?: string
  defaultVariant?: SymbolVariant
  defaultWeight?: SymbolWeight
}

/**
 * Builder class for creating custom icon sets
 */
export class CustomIconSetBuilder {
  private icons: Map<string, IconDefinition> = new Map()
  private config: IconSetConfig

  constructor(config: IconSetConfig) {
    this.config = config
  }

  /**
   * Add an icon to the set
   */
  addIcon(iconConfig: CustomIconConfig): this {
    const icon: IconDefinition = {
      name: iconConfig.name,
      variant: this.config.defaultVariant || 'none',
      weight: this.config.defaultWeight || 'regular',
      svg: iconConfig.svg,
      viewBox: iconConfig.viewBox || '0 0 24 24',
      metadata: {
        category: iconConfig.metadata?.category,
        tags: iconConfig.metadata?.tags || [],
        unicodePoint: iconConfig.metadata?.unicodePoint,
        alternativeNames: iconConfig.metadata?.alternativeNames || [],
        availableVariants: Array.isArray(iconConfig.variants) ? iconConfig.variants : ['none'],
        availableWeights: Array.isArray(iconConfig.weights) ? iconConfig.weights : ['regular']
      }
    }

    this.icons.set(iconConfig.name, icon)
    return this
  }

  /**
   * Add multiple icons at once
   */
  addIcons(icons: CustomIconConfig[]): this {
    icons.forEach(icon => this.addIcon(icon))
    return this
  }

  /**
   * Add icon variants
   */
  addVariant(iconName: string, variant: SymbolVariant, svg: string): this {
    const baseIcon = this.icons.get(iconName)
    if (!baseIcon) {
      throw new Error(`Icon "${iconName}" not found. Add base icon first.`)
    }

    const variantIcon: IconDefinition = {
      ...baseIcon,
      name: `${iconName}-${variant}`,
      variant,
      svg,
      metadata: {
        ...baseIcon.metadata,
        availableVariants: [...(Array.isArray(baseIcon.metadata?.availableVariants) ? baseIcon.metadata.availableVariants : []), variant]
      }
    }

    this.icons.set(`${iconName}-${variant}`, variantIcon)
    
    // Update base icon metadata
    if (baseIcon.metadata) {
      const currentVariants = Array.isArray(baseIcon.metadata.availableVariants) ? baseIcon.metadata.availableVariants : []
      baseIcon.metadata.availableVariants = [...currentVariants, variant]
    }

    return this
  }

  /**
   * Build the complete icon set
   */
  build(): IconSet {
    const iconsObject = Object.fromEntries(this.icons.entries())

    return {
      name: this.config.name,
      version: this.config.version,
      icons: iconsObject,

      async getIcon(name: string, variant: SymbolVariant = 'none'): Promise<IconDefinition | undefined> {
        const key = variant === 'none' ? name : `${name}-${variant}`
        const icon = iconsObject[key]
        
        if (!icon && variant !== 'none') {
          // Fallback to base icon if variant not found
          return iconsObject[name]
        }
        
        return icon
      },

      hasIcon(name: string, variant: SymbolVariant = 'none'): boolean {
        const key = variant === 'none' ? name : `${name}-${variant}`
        return key in iconsObject || (variant !== 'none' && name in iconsObject)
      },

      listIcons(): string[] {
        return Object.keys(iconsObject).filter(key => !key.includes('-'))
      },

      getIconMetadata(name: string) {
        const icon = iconsObject[name]
        return icon?.metadata
      },

      supportsVariant(name: string, variant: SymbolVariant): boolean {
        const icon = iconsObject[name]
        return icon?.metadata?.availableVariants?.includes(variant) || false
      },

      supportsWeight(name: string, weight: SymbolWeight): boolean {
        const icon = iconsObject[name]
        return icon?.metadata?.availableWeights?.includes(weight) || false
      }
    }
  }
}

/**
 * Helper function to create icon set from JSON data
 */
export function createIconSetFromJSON(
  config: IconSetConfig,
  iconData: Record<string, any>
): IconSet {
  const builder = new CustomIconSetBuilder(config)

  Object.entries(iconData).forEach(([name, data]) => {
    builder.addIcon({
      name,
      svg: data.svg,
      viewBox: data.viewBox,
      variants: data.variants,
      weights: data.weights,
      metadata: data.metadata
    })

    // Add variants if they exist
    if (data.variants && typeof data.variants === 'object' && !Array.isArray(data.variants)) {
      Object.entries(data.variants).forEach(([variant, svg]) => {
        if (variant !== 'none' && typeof svg === 'string') {
          builder.addVariant(name, variant as SymbolVariant, svg)
        }
      })
    }
  })

  return builder.build()
}

/**
 * Helper function to create icon set from SVG sprites
 */
export function createIconSetFromSprite(
  config: IconSetConfig,
  spriteUrl: string,
  iconMappings: Record<string, { id: string; viewBox?: string }>
): IconSet {
  const builder = new CustomIconSetBuilder(config)

  Object.entries(iconMappings).forEach(([name, mapping]) => {
    builder.addIcon({
      name,
      svg: `<use href="${spriteUrl}#${mapping.id}"/>`,
      viewBox: mapping.viewBox || '0 0 24 24'
    })
  })

  return builder.build()
}

/**
 * Validate a custom icon configuration
 */
export function validateIcon(icon: CustomIconConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!icon.name || typeof icon.name !== 'string') {
    errors.push('Icon name is required and must be a string')
  }

  if (!icon.svg || typeof icon.svg !== 'string') {
    errors.push('Icon SVG is required and must be a string')
  }

  if (icon.svg && !icon.svg.trim().startsWith('<')) {
    errors.push('Icon SVG must be valid SVG markup')
  }

  if (icon.viewBox && !/^\d+\s+\d+\s+\d+\s+\d+$/.test(icon.viewBox)) {
    errors.push('ViewBox must be in format "x y width height"')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate an icon set configuration and its icons
 */
export function validateIconSet(config: IconSetConfig, icons: CustomIconConfig[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.name || typeof config.name !== 'string') {
    errors.push('Icon set name is required')
  }

  if (!config.version || typeof config.version !== 'string') {
    errors.push('Icon set version is required')
  }

  if (icons.length === 0) {
    errors.push('Icon set must contain at least one icon')
  }

  const iconNames = new Set<string>()
  icons.forEach((icon, index) => {
    const iconValidation = validateIcon(icon)
    if (!iconValidation.valid) {
      errors.push(`Icon ${index + 1}: ${iconValidation.errors.join(', ')}`)
    }

    if (iconNames.has(icon.name)) {
      errors.push(`Duplicate icon name: ${icon.name}`)
    }
    iconNames.add(icon.name)
  })

  return {
    valid: errors.length === 0,
    errors
  }
}