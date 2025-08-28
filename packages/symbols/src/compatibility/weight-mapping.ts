/**
 * SF Symbol Weight Translation System
 * 
 * Provides comprehensive mapping between SF Symbol weight specifications
 * and appropriate CSS styling for Lucide icons and web rendering.
 */

import type { SymbolWeight } from '../types.js'

/**
 * CSS font weight values corresponding to SF Symbol weights
 * Based on Apple's SF Symbols weight specifications
 */
export const WEIGHT_TO_CSS_FONT_WEIGHT: Record<SymbolWeight, number> = {
  ultraLight: 100,
  thin: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
  black: 900
}

/**
 * SVG stroke width values for different symbol weights
 * Optimized for web rendering and Lucide icon compatibility
 */
export const WEIGHT_TO_STROKE_WIDTH: Record<SymbolWeight, number> = {
  ultraLight: 0.5,
  thin: 0.75,
  light: 1,
  regular: 1.5,
  medium: 1.75,
  semibold: 2,
  bold: 2.25,
  heavy: 2.5,
  black: 3
}

/**
 * CSS filter values for simulating weight variations
 * Used when stroke-width adjustment isn't sufficient
 */
export const WEIGHT_TO_CSS_FILTER: Record<SymbolWeight, string | undefined> = {
  ultraLight: 'brightness(1.2) contrast(0.8)',
  thin: 'brightness(1.1) contrast(0.9)',
  light: undefined, // No filter needed
  regular: undefined, // Default weight
  medium: undefined, // No filter needed
  semibold: 'contrast(1.1)',
  bold: 'contrast(1.2)',
  heavy: 'contrast(1.3) saturate(1.1)',
  black: 'contrast(1.4) saturate(1.2)'
}

/**
 * Letter spacing adjustments for different weights
 * Helps with visual balance in typography contexts
 */
export const WEIGHT_TO_LETTER_SPACING: Record<SymbolWeight, number> = {
  ultraLight: 0.02, // 0.02em
  thin: 0.01,
  light: 0.005,
  regular: 0,
  medium: -0.005,
  semibold: -0.01,
  bold: -0.015,
  heavy: -0.02,
  black: -0.025
}

/**
 * Weight compatibility matrix for different icon sets
 * Not all icon sets support all weight variations
 */
export interface WeightSupport {
  lucide: boolean
  sfSymbols: boolean
  materialIcons: boolean
  featherIcons: boolean
}

export const WEIGHT_SUPPORT_MATRIX: Record<SymbolWeight, WeightSupport> = {
  ultraLight: {
    lucide: false, // Lucide doesn't have ultra-light
    sfSymbols: true,
    materialIcons: false,
    featherIcons: false
  },
  thin: {
    lucide: true, // Can be simulated
    sfSymbols: true,
    materialIcons: true,
    featherIcons: false
  },
  light: {
    lucide: true,
    sfSymbols: true,
    materialIcons: true,
    featherIcons: true
  },
  regular: {
    lucide: true, // Default weight
    sfSymbols: true,
    materialIcons: true,
    featherIcons: true
  },
  medium: {
    lucide: true,
    sfSymbols: true,
    materialIcons: true,
    featherIcons: false
  },
  semibold: {
    lucide: true,
    sfSymbols: true,
    materialIcons: false,
    featherIcons: false
  },
  bold: {
    lucide: true,
    sfSymbols: true,
    materialIcons: true,
    featherIcons: false
  },
  heavy: {
    lucide: true, // Can be simulated
    sfSymbols: true,
    materialIcons: false,
    featherIcons: false
  },
  black: {
    lucide: true, // Can be simulated
    sfSymbols: true,
    materialIcons: false,
    featherIcons: false
  }
}

/**
 * Generate comprehensive CSS styles for a symbol weight
 * 
 * @param weight - The SF Symbol weight
 * @param iconSet - The target icon set (affects available styling options)
 * @returns CSS style object
 * 
 * @example
 * ```typescript
 * const styles = getWeightStyles('bold', 'lucide')
 * // Returns: { strokeWidth: '2.25', fontWeight: 700, ... }
 * ```
 */
export function getWeightStyles(
  weight: SymbolWeight, 
  iconSet: 'lucide' | 'sf-symbols' | 'material' | 'feather' = 'lucide'
): Record<string, string | number> {
  const styles: Record<string, string | number> = {}
  
  // Always include font weight for typography contexts
  styles.fontWeight = WEIGHT_TO_CSS_FONT_WEIGHT[weight]
  
  // SVG-specific styling
  if (iconSet === 'lucide' || iconSet === 'feather') {
    styles.strokeWidth = WEIGHT_TO_STROKE_WIDTH[weight]
    
    // Ensure stroke is visible for lighter weights
    if (weight === 'ultraLight' || weight === 'thin') {
      styles.stroke = 'currentColor'
      styles.fill = 'none'
    }
  }
  
  // Apply CSS filters for enhanced weight simulation
  const filter = WEIGHT_TO_CSS_FILTER[weight]
  if (filter) {
    styles.filter = filter
  }
  
  // Letter spacing for better visual balance
  const letterSpacing = WEIGHT_TO_LETTER_SPACING[weight]
  if (letterSpacing !== 0) {
    styles.letterSpacing = `${letterSpacing}em`
  }
  
  // Icon set specific adjustments
  if (iconSet === 'material') {
    // Material icons use font variations
    styles.fontVariationSettings = `'wght' ${WEIGHT_TO_CSS_FONT_WEIGHT[weight]}`
  }
  
  return styles
}

/**
 * Check if a weight is supported by a specific icon set
 * 
 * @param weight - The symbol weight to check
 * @param iconSet - The icon set to check against
 * @returns Whether the weight is supported
 */
export function isWeightSupported(
  weight: SymbolWeight, 
  iconSet: 'lucide' | 'sf-symbols' | 'material' | 'feather'
): boolean {
  const iconSetKey = iconSet === 'sf-symbols' ? 'sfSymbols' : 
                     iconSet === 'material' ? 'materialIcons' : 
                     iconSet === 'feather' ? 'featherIcons' : 'lucide'
  
  return WEIGHT_SUPPORT_MATRIX[weight][iconSetKey]
}

/**
 * Get the closest supported weight for an icon set
 * 
 * @param weight - The desired weight
 * @param iconSet - The target icon set
 * @returns The closest supported weight
 * 
 * @example
 * ```typescript
 * const closest = getClosestSupportedWeight('ultraLight', 'lucide')
 * // Returns: 'thin' (closest supported weight)
 * ```
 */
export function getClosestSupportedWeight(
  weight: SymbolWeight, 
  iconSet: 'lucide' | 'sf-symbols' | 'material' | 'feather'
): SymbolWeight {
  if (isWeightSupported(weight, iconSet)) {
    return weight
  }
  
  // Weight hierarchy for fallback selection
  const weightHierarchy: SymbolWeight[] = [
    'ultraLight', 'thin', 'light', 'regular', 
    'medium', 'semibold', 'bold', 'heavy', 'black'
  ]
  
  const targetIndex = weightHierarchy.indexOf(weight)
  
  // Search for closest supported weight (prefer lighter first, then heavier)
  for (let offset = 1; offset < weightHierarchy.length; offset++) {
    // Try lighter weight
    const lighterIndex = targetIndex - offset
    if (lighterIndex >= 0) {
      const lighterWeight = weightHierarchy[lighterIndex]
      if (isWeightSupported(lighterWeight, iconSet)) {
        return lighterWeight
      }
    }
    
    // Try heavier weight
    const heavierIndex = targetIndex + offset
    if (heavierIndex < weightHierarchy.length) {
      const heavierWeight = weightHierarchy[heavierIndex]
      if (isWeightSupported(heavierWeight, iconSet)) {
        return heavierWeight
      }
    }
  }
  
  // Fallback to regular if nothing else is supported
  return 'regular'
}

/**
 * Generate weight variants for a symbol
 * Creates multiple weight variations with appropriate styling
 * 
 * @param baseWeight - The base weight to generate variants from
 * @param iconSet - The target icon set
 * @returns Array of weight variants with styling
 */
export interface WeightVariant {
  weight: SymbolWeight
  displayName: string
  styles: Record<string, string | number>
  isSupported: boolean
  isRecommended: boolean
}

export function generateWeightVariants(
  _baseWeight: SymbolWeight = 'regular',
  iconSet: 'lucide' | 'sf-symbols' | 'material' | 'feather' = 'lucide'
): WeightVariant[] {
  const allWeights: Array<{ weight: SymbolWeight; displayName: string }> = [
    { weight: 'ultraLight', displayName: 'Ultra Light' },
    { weight: 'thin', displayName: 'Thin' },
    { weight: 'light', displayName: 'Light' },
    { weight: 'regular', displayName: 'Regular' },
    { weight: 'medium', displayName: 'Medium' },
    { weight: 'semibold', displayName: 'Semibold' },
    { weight: 'bold', displayName: 'Bold' },
    { weight: 'heavy', displayName: 'Heavy' },
    { weight: 'black', displayName: 'Black' }
  ]
  
  // Recommended weights for different contexts
  const recommendedWeights: SymbolWeight[] = ['light', 'regular', 'medium', 'bold']
  
  return allWeights.map(({ weight, displayName }) => {
    const isSupported = isWeightSupported(weight, iconSet)
    const styles = getWeightStyles(weight, iconSet)
    const isRecommended = recommendedWeights.includes(weight)
    
    return {
      weight,
      displayName,
      styles,
      isSupported,
      isRecommended
    }
  })
}

/**
 * Smart weight selection based on context
 * 
 * @param context - Usage context for the symbol
 * @param iconSet - Target icon set
 * @returns Recommended weight for the context
 */
export function getContextualWeight(
  context: 'ui' | 'text' | 'heading' | 'accent' | 'subtle' | 'emphasis',
  iconSet: 'lucide' | 'sf-symbols' | 'material' | 'feather' = 'lucide'
): SymbolWeight {
  const contextWeightMap: Record<string, SymbolWeight> = {
    ui: 'regular',       // Standard UI elements
    text: 'regular',     // Inline with text
    heading: 'medium',   // In headings
    accent: 'bold',      // Accent/highlight elements
    subtle: 'light',     // Subtle/secondary elements
    emphasis: 'semibold' // Emphasized elements
  }
  
  const preferredWeight = contextWeightMap[context] || 'regular'
  return getClosestSupportedWeight(preferredWeight, iconSet)
}

/**
 * Generate responsive weight system
 * Creates weight mappings for different screen sizes
 * 
 * @param baseWeight - The base weight for desktop
 * @param iconSet - Target icon set
 * @returns Responsive weight specifications
 */
export interface ResponsiveWeights {
  mobile: SymbolWeight
  tablet: SymbolWeight
  desktop: SymbolWeight
  largeScreen: SymbolWeight
}

export function generateResponsiveWeights(
  baseWeight: SymbolWeight = 'regular',
  iconSet: 'lucide' | 'sf-symbols' | 'material' | 'feather' = 'lucide'
): ResponsiveWeights {
  const weightHierarchy: SymbolWeight[] = [
    'ultraLight', 'thin', 'light', 'regular', 
    'medium', 'semibold', 'bold', 'heavy', 'black'
  ]
  
  const baseIndex = weightHierarchy.indexOf(baseWeight)
  
  // Lighter weights for smaller screens (better readability)
  const mobileWeight = baseIndex > 0 ? weightHierarchy[baseIndex - 1] : baseWeight
  const tabletWeight = baseWeight
  
  // Slightly heavier weights for larger screens (better presence)
  const desktopWeight = baseWeight
  const largeScreenWeight = baseIndex < weightHierarchy.length - 1 ? 
                           weightHierarchy[baseIndex + 1] : baseWeight
  
  return {
    mobile: getClosestSupportedWeight(mobileWeight, iconSet),
    tablet: getClosestSupportedWeight(tabletWeight, iconSet),
    desktop: getClosestSupportedWeight(desktopWeight, iconSet),
    largeScreen: getClosestSupportedWeight(largeScreenWeight, iconSet)
  }
}

/**
 * CSS custom properties generator for weight system
 * Creates CSS variables for consistent weight usage
 * 
 * @param prefix - CSS variable prefix
 * @param iconSet - Target icon set
 * @returns CSS custom properties object
 */
export function generateWeightCSSVariables(
  prefix: string = '--symbol',
  iconSet: 'lucide' | 'sf-symbols' | 'material' | 'feather' = 'lucide'
): Record<string, string | number> {
  const variables: Record<string, string | number> = {}
  
  Object.entries(WEIGHT_TO_CSS_FONT_WEIGHT).forEach(([weight, fontWeight]) => {
    const strokeWidth = WEIGHT_TO_STROKE_WIDTH[weight as SymbolWeight]
    
    variables[`${prefix}-weight-${weight}`] = fontWeight
    variables[`${prefix}-stroke-${weight}`] = strokeWidth
    
    // Add contextual variables
    variables[`${prefix}-${weight}-font-weight`] = fontWeight
    variables[`${prefix}-${weight}-stroke-width`] = strokeWidth
  })
  
  // Add semantic weight variables
  variables[`${prefix}-weight-ui`] = getContextualWeight('ui', iconSet)
  variables[`${prefix}-weight-text`] = getContextualWeight('text', iconSet)
  variables[`${prefix}-weight-heading`] = getContextualWeight('heading', iconSet)
  variables[`${prefix}-weight-accent`] = getContextualWeight('accent', iconSet)
  variables[`${prefix}-weight-subtle`] = getContextualWeight('subtle', iconSet)
  variables[`${prefix}-weight-emphasis`] = getContextualWeight('emphasis', iconSet)
  
  return variables
}

/**
 * Weight transition animations
 * Provides smooth transitions between weight states
 * 
 * @param fromWeight - Starting weight
 * @param toWeight - Target weight
 * @param duration - Animation duration in ms
 * @returns CSS transition specification
 */
export function generateWeightTransition(
  _fromWeight: SymbolWeight,
  _toWeight: SymbolWeight,
  duration: number = 200
): string {
  const properties = [
    'font-weight',
    'stroke-width',
    'filter',
    'letter-spacing'
  ]
  
  return properties
    .map(prop => `${prop} ${duration}ms ease-in-out`)
    .join(', ')
}

/**
 * Batch weight processing for multiple symbols
 * Optimizes weight calculations for large symbol sets
 * 
 * @param symbols - Array of symbol names
 * @param weights - Array of weights to apply
 * @param iconSet - Target icon set
 * @returns Optimized weight configurations
 */
export function batchProcessWeights(
  symbols: string[],
  weights: SymbolWeight[],
  iconSet: 'lucide' | 'sf-symbols' | 'material' | 'feather' = 'lucide'
): Record<string, Record<SymbolWeight, Record<string, string | number>>> {
  const results: Record<string, Record<SymbolWeight, Record<string, string | number>>> = {}
  
  symbols.forEach(symbol => {
    results[symbol] = {} as Record<SymbolWeight, Record<string, string | number>>
    
    weights.forEach(weight => {
      results[symbol][weight] = getWeightStyles(weight, iconSet)
    })
  })
  
  return results
}