/**
 * SF Symbol Variant Mapping System
 * 
 * Provides sophisticated mapping between SF Symbol variants and Lucide icon equivalents,
 * handling the semantic differences between the two icon systems.
 */

import { type SymbolVariant } from '../types.js'

/**
 * SF Symbol variant to Lucide icon mapping strategy
 */
export interface VariantMappingStrategy {
  /** The base Lucide icon name */
  baseIcon: string
  /** Specific Lucide icon for filled variant */
  filledIcon?: string
  /** Specific Lucide icon for slash variant */
  slashIcon?: string
  /** Specific Lucide icon for circle variant */
  circleIcon?: string
  /** Specific Lucide icon for square variant */
  squareIcon?: string
  /** Whether this icon supports variant styling via CSS */
  supportsCSSVariants?: boolean
  /** Custom mapping function for complex variants */
  customMapper?: (variant: SymbolVariant, baseIcon: string) => string
}

/**
 * Comprehensive SF Symbol to Lucide variant mapping table
 * Maps SF Symbol base names to their Lucide variant strategies
 */
export const VARIANT_MAPPING_TABLE: Record<string, VariantMappingStrategy> = {
  // Basic symbols with direct filled variants
  heart: {
    baseIcon: 'heart',
    filledIcon: 'heart', // Lucide heart can be filled via CSS
    supportsCSSVariants: true
  },
  
  star: {
    baseIcon: 'star',
    filledIcon: 'star',
    supportsCSSVariants: true
  },
  
  bookmark: {
    baseIcon: 'bookmark',
    filledIcon: 'bookmark',
    supportsCSSVariants: true
  },
  
  // Symbols with circle variants
  person: {
    baseIcon: 'user',
    circleIcon: 'user-circle',
    filledIcon: 'user'
  },
  
  'person.2': {
    baseIcon: 'users',
    filledIcon: 'users'
  },
  
  // Symbols with slash variants
  bell: {
    baseIcon: 'bell',
    filledIcon: 'bell',
    slashIcon: 'bell-off',
    supportsCSSVariants: true
  },
  
  video: {
    baseIcon: 'video',
    filledIcon: 'video',
    slashIcon: 'video-off'
  },
  
  mic: {
    baseIcon: 'mic',
    filledIcon: 'mic',
    slashIcon: 'mic-off'
  },
  
  speaker: {
    baseIcon: 'volume-2',
    slashIcon: 'volume-x',
    customMapper: (variant: SymbolVariant, _baseIcon: string) => {
      switch (variant) {
        case 'slash': return 'volume-x'
        case 'filled': return 'volume-2'
        default: return 'volume-1' // Default to medium volume
      }
    }
  },
  
  // Navigation symbols
  house: {
    baseIcon: 'home',
    filledIcon: 'home',
    supportsCSSVariants: true
  },
  
  folder: {
    baseIcon: 'folder',
    filledIcon: 'folder',
    supportsCSSVariants: true
  },
  
  // Communication symbols  
  envelope: {
    baseIcon: 'mail',
    filledIcon: 'mail',
    customMapper: (variant: SymbolVariant, _baseIcon: string) => {
      if (variant === 'none') return 'mail'
      if (variant === 'filled') return 'mail'
      return 'mail-open' // For .open variant
    }
  },
  
  phone: {
    baseIcon: 'phone',
    filledIcon: 'phone',
    slashIcon: 'phone-off'
  },
  
  message: {
    baseIcon: 'message-circle',
    filledIcon: 'message-circle',
    supportsCSSVariants: true
  },
  
  // Media symbols
  play: {
    baseIcon: 'play',
    filledIcon: 'play',
    supportsCSSVariants: true,
    customMapper: (variant: SymbolVariant, _baseIcon: string) => {
      switch (variant) {
        case 'circle': return 'play-circle'
        case 'square': return 'play-square' // If available
        default: return 'play'
      }
    }
  },
  
  pause: {
    baseIcon: 'pause',
    filledIcon: 'pause',
    supportsCSSVariants: true,
    customMapper: (variant: SymbolVariant, _baseIcon: string) => {
      switch (variant) {
        case 'circle': return 'pause-circle'
        default: return 'pause'
      }
    }
  },
  
  camera: {
    baseIcon: 'camera',
    filledIcon: 'camera',
    slashIcon: 'camera-off'
  },
  
  // Document symbols
  doc: {
    baseIcon: 'file',
    filledIcon: 'file',
    customMapper: (variant: SymbolVariant, _baseIcon: string) => {
      switch (variant) {
        case 'filled': return 'file'
        default: return 'file-text' // Default to text file
      }
    }
  },
  
  // System symbols
  plus: {
    baseIcon: 'plus',
    circleIcon: 'plus-circle',
    squareIcon: 'plus-square'
  },
  
  minus: {
    baseIcon: 'minus',
    circleIcon: 'minus-circle',
    squareIcon: 'minus-square'
  },
  
  xmark: {
    baseIcon: 'x',
    circleIcon: 'x-circle',
    squareIcon: 'x-square'
  },
  
  checkmark: {
    baseIcon: 'check',
    circleIcon: 'check-circle',
    squareIcon: 'check-square'
  },
  
  // Shopping symbols
  cart: {
    baseIcon: 'shopping-cart',
    filledIcon: 'shopping-cart',
    supportsCSSVariants: true
  },
  
  bag: {
    baseIcon: 'shopping-bag',
    filledIcon: 'shopping-bag',
    supportsCSSVariants: true
  },
  
  // Weather symbols
  sun: {
    baseIcon: 'sun',
    filledIcon: 'sun',
    supportsCSSVariants: true
  },
  
  moon: {
    baseIcon: 'moon',
    filledIcon: 'moon',
    supportsCSSVariants: true
  },
  
  cloud: {
    baseIcon: 'cloud',
    filledIcon: 'cloud',
    supportsCSSVariants: true,
    customMapper: (_variant: SymbolVariant, baseIcon: string) => {
      // Handle cloud variants like cloud.rain, cloud.snow
      if (baseIcon.includes('rain')) return 'cloud-rain'
      if (baseIcon.includes('snow')) return 'cloud-snow'
      return 'cloud'
    }
  }
}

/**
 * Map an SF Symbol with variant to the appropriate Lucide icon
 * 
 * @param sfSymbol - The base SF Symbol name (without variant suffix)
 * @param variant - The SF Symbol variant
 * @returns The mapped Lucide icon name
 * 
 * @example
 * ```typescript
 * mapVariantToLucide('heart', 'filled') // -> 'heart'
 * mapVariantToLucide('person', 'circle') // -> 'user-circle'  
 * mapVariantToLucide('bell', 'slash') // -> 'bell-off'
 * ```
 */
export function mapVariantToLucide(sfSymbol: string, variant: SymbolVariant = 'none'): string {
  const mapping = VARIANT_MAPPING_TABLE[sfSymbol]
  
  if (!mapping) {
    // No specific mapping, return base icon
    return sfSymbol
  }
  
  // Use custom mapper if available
  if (mapping.customMapper) {
    return mapping.customMapper(variant, mapping.baseIcon)
  }
  
  // Standard variant mapping
  switch (variant) {
    case 'filled':
      return mapping.filledIcon || mapping.baseIcon
    case 'slash':
      return mapping.slashIcon || mapping.baseIcon
    case 'circle':
      return mapping.circleIcon || mapping.baseIcon
    case 'square':
      return mapping.squareIcon || mapping.baseIcon
    case 'none':
    default:
      return mapping.baseIcon
  }
}

/**
 * Check if an SF Symbol supports a specific variant in Lucide
 * 
 * @param sfSymbol - The SF Symbol base name
 * @param variant - The variant to check
 * @returns Whether the variant is supported
 * 
 * @example
 * ```typescript
 * isVariantSupported('heart', 'filled') // -> true
 * isVariantSupported('person', 'circle') // -> true
 * isVariantSupported('plus', 'slash') // -> false
 * ```
 */
export function isVariantSupported(sfSymbol: string, variant: SymbolVariant): boolean {
  const mapping = VARIANT_MAPPING_TABLE[sfSymbol]
  
  if (!mapping) {
    return variant === 'none' // Only base variant supported for unmapped symbols
  }
  
  switch (variant) {
    case 'none':
      return true // Always supported
    case 'filled':
      return !!(mapping.filledIcon || mapping.supportsCSSVariants)
    case 'slash':
      return !!mapping.slashIcon
    case 'circle':
      return !!mapping.circleIcon
    case 'square':
      return !!mapping.squareIcon
    default:
      return false
  }
}

/**
 * Get all supported variants for an SF Symbol
 * 
 * @param sfSymbol - The SF Symbol base name
 * @returns Array of supported variants
 * 
 * @example
 * ```typescript
 * getSupportedVariants('heart') // -> ['none', 'filled']
 * getSupportedVariants('bell') // -> ['none', 'filled', 'slash']  
 * getSupportedVariants('plus') // -> ['none', 'circle', 'square']
 * ```
 */
export function getSupportedVariants(sfSymbol: string): SymbolVariant[] {
  const mapping = VARIANT_MAPPING_TABLE[sfSymbol]
  
  if (!mapping) {
    return ['none']
  }
  
  const variants: SymbolVariant[] = ['none']
  
  if (mapping.filledIcon || mapping.supportsCSSVariants) {
    variants.push('filled')
  }
  
  if (mapping.slashIcon) {
    variants.push('slash')
  }
  
  if (mapping.circleIcon) {
    variants.push('circle')
  }
  
  if (mapping.squareIcon) {
    variants.push('square')
  }
  
  return variants
}

/**
 * Generate CSS classes for variant styling
 * Used when supportsCSSVariants is true
 * 
 * @param variant - The symbol variant
 * @returns CSS class names for styling
 * 
 * @example
 * ```typescript
 * getVariantCSSClasses('filled') // -> 'symbol-variant-filled'
 * getVariantCSSClasses('slash') // -> 'symbol-variant-slash'
 * ```
 */
export function getVariantCSSClasses(variant: SymbolVariant): string[] {
  const classes: string[] = []
  
  if (variant !== 'none') {
    classes.push(`symbol-variant-${variant}`)
  }
  
  return classes
}

/**
 * Generate CSS styles for variant appearance
 * Provides styling for symbols that support CSS variants
 * 
 * @param variant - The symbol variant
 * @returns CSS style object
 */
export function getVariantCSS(variant: SymbolVariant): Record<string, string> {
  const styles: Record<string, string> = {}
  
  switch (variant) {
    case 'filled':
      styles.fill = 'currentColor'
      styles.stroke = 'none'
      break
    case 'slash':
      styles.position = 'relative'
      // Slash effect would be handled by CSS pseudo-elements
      break
    case 'circle':
      styles.borderRadius = '50%'
      styles.border = '2px solid currentColor'
      styles.padding = '2px'
      break
    case 'square':
      styles.borderRadius = '2px'
      styles.border = '2px solid currentColor'
      styles.padding = '2px'
      break
    default:
      // Default stroke styling
      styles.fill = 'none'
      styles.stroke = 'currentColor'
      styles.strokeWidth = '2'
      break
  }
  
  return styles
}

/**
 * Smart variant resolver that handles complex SF Symbol names
 * Extracts variant information from full SF Symbol names
 * 
 * @param fullSFSymbolName - Complete SF Symbol name with variant suffix
 * @returns Object with base name and resolved variant
 * 
 * @example
 * ```typescript
 * resolveVariantFromName('heart.fill') 
 * // -> { baseName: 'heart', variant: 'filled' }
 * 
 * resolveVariantFromName('person.circle.fill')
 * // -> { baseName: 'person', variant: 'circle' }
 * 
 * resolveVariantFromName('bell.slash.circle')
 * // -> { baseName: 'bell', variant: 'slash' } // Takes first recognized variant
 * ```
 */
export function resolveVariantFromName(fullSFSymbolName: string): {
  baseName: string
  variant: SymbolVariant
  lucideIcon: string
} {
  const parts = fullSFSymbolName.split('.')
  const baseName = parts[0]
  
  // Look for variant indicators in the name parts
  let resolvedVariant: SymbolVariant = 'none'
  
  if (parts.includes('fill') || parts.includes('filled')) {
    resolvedVariant = 'filled'
  } else if (parts.includes('slash')) {
    resolvedVariant = 'slash'
  } else if (parts.includes('circle')) {
    resolvedVariant = 'circle'
  } else if (parts.includes('square')) {
    resolvedVariant = 'square'
  }
  
  // Get the mapped Lucide icon
  const lucideIcon = mapVariantToLucide(baseName, resolvedVariant)
  
  return {
    baseName,
    variant: resolvedVariant,
    lucideIcon
  }
}

/**
 * Batch variant mapping for multiple SF Symbols
 * Useful for processing large lists of symbols
 * 
 * @param sfSymbols - Array of SF Symbol names (with or without variants)
 * @returns Array of mapping results
 */
export interface VariantMappingResult {
  originalName: string
  baseName: string
  variant: SymbolVariant
  lucideIcon: string
  isSupported: boolean
  supportedVariants: SymbolVariant[]
}

export function batchMapVariants(sfSymbols: string[]): VariantMappingResult[] {
  return sfSymbols.map(sfSymbol => {
    const { baseName, variant, lucideIcon } = resolveVariantFromName(sfSymbol)
    const isSupported = isVariantSupported(baseName, variant)
    const supportedVariants = getSupportedVariants(baseName)
    
    return {
      originalName: sfSymbol,
      baseName,
      variant,
      lucideIcon,
      isSupported,
      supportedVariants
    }
  })
}