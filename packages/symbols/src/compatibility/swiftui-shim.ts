/**
 * SwiftUI Image(systemName:) Compatibility Shim
 * 
 * Provides a familiar SwiftUI API for creating symbols with SF Symbol names,
 * automatically mapping them to Lucide equivalents using the SF Symbol mapping.
 */

import { Symbol } from '../components/Symbol.js'
import type { SymbolProps } from '../types.js'
import { 
  getLucideForSFSymbol, 
  getSFSymbolMapping,
  getSFSymbolsForLucide as getSFSymbolsForLucideMapping
} from './sf-symbols-mapping.js'
import type { ComponentInstance, Signal } from '@tachui/core'

/**
 * SwiftUI Image component properties for systemName initializer
 */
export interface ImageSystemNameProps {
  /** The SF Symbol name to display */
  systemName: string | Signal<string>
  
  /** Symbol variant override (maps to SF Symbol variants) */
  variant?: 'none' | 'filled' | 'slash' | 'circle' | 'square'
  
  /** Scale override for the symbol */
  scale?: 'small' | 'medium' | 'large'
  
  /** Weight override for the symbol */
  weight?: 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  
  /** Accessibility label override */
  accessibilityLabel?: string
  
  /** Whether the image is decorative (hidden from screen readers) */
  isDecorative?: boolean
}

/**
 * SwiftUI-style Image component with systemName support
 * 
 * Provides a familiar API for iOS/macOS developers while leveraging
 * the TachUI Symbol system underneath.
 * 
 * @example
 * ```typescript
 * // Basic usage - matches SwiftUI syntax
 * const heartIcon = Image({ systemName: "heart" })
 * 
 * // With modifiers - familiar SwiftUI pattern
 * const styledIcon = Image({ systemName: "star.fill" })
 *   .modifier
 *   .foregroundColor(Assets.systemBlue)
 *   .scaleEffect(1.2)
 *   .build()
 * 
 * // Reactive system name
 * const [iconName, setIconName] = createSignal("heart")
 * const reactiveIcon = Image({ systemName: iconName })
 * ```
 */
export function Image(props: ImageSystemNameProps): ComponentInstance {
  const { 
    systemName, 
    variant, 
    scale, 
    weight, 
    accessibilityLabel, 
    isDecorative 
  } = props
  
  // Convert SF Symbol name to Lucide icon name
  const getLucideName = (sfName: string): string => {
    const lucideName = getLucideForSFSymbol(sfName)
    if (!lucideName) {
      console.warn(`SF Symbol "${sfName}" has no Lucide equivalent. Using fallback.`)
      return 'help-circle' // Fallback icon
    }
    return lucideName
  }
  
  // Handle reactive system name
  const lucideName = typeof systemName === 'function' 
    ? (() => getLucideName((systemName as () => string)())) as Signal<string>  // Signal
    : getLucideName(systemName)          // Static string
  
  // Generate accessibility label if not provided
  const generateAccessibilityLabel = (sfName: string): string => {
    const mapping = getSFSymbolMapping(sfName)
    if (mapping && mapping.notes) {
      return mapping.notes
    }
    
    // Convert SF Symbol name to human readable
    return sfName
      .replace(/\./g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^[a-z]/, c => c.toUpperCase())
      .trim()
  }
  
  const finalAccessibilityLabel = accessibilityLabel || (
    typeof systemName === 'function' 
      ? (() => generateAccessibilityLabel(systemName())) as any // Signal function
      : generateAccessibilityLabel(systemName) as string
  )
  
  // Convert SwiftUI Image props to TachUI Symbol props
  const symbolProps: Partial<SymbolProps> = {
    variant,
    scale,
    weight,
    accessibilityLabel: finalAccessibilityLabel as string | undefined,
    isDecorative,
    iconSet: 'lucide' // Always use Lucide for SF Symbol compatibility
  }
  
  // Create Symbol component with mapped Lucide name
  return Symbol(lucideName, symbolProps)
}

/**
 * Alternative factory function with more explicit naming
 * For cases where Image might conflict with native Image APIs
 */
export const SystemImage = Image

/**
 * SwiftUI-style Label component that combines text and system image
 * 
 * @example
 * ```typescript
 * const favoriteLabel = Label({
 *   title: "Favorite",
 *   systemImage: "heart.fill"
 * })
 * ```
 */
export interface LabelProps {
  /** The text content of the label */
  title: string | Signal<string>
  
  /** The SF Symbol name for the icon */
  systemImage: string | Signal<string>
  
  /** Icon variant override */
  variant?: 'none' | 'filled' | 'slash' | 'circle' | 'square'
  
  /** Icon scale override */
  scale?: 'small' | 'medium' | 'large'
  
  /** Icon weight override */
  weight?: 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
}

/**
 * SwiftUI-style Label component
 * Creates a horizontal layout with an icon and text
 */
export function Label(_props: LabelProps): ComponentInstance {
  // This would be implemented as part of a full SwiftUI compatibility layer
  // For now, this is a placeholder showing the intended API
  throw new Error('Label component not yet implemented. Use HStack with Image and Text components.')
}

/**
 * Utility function to check if an SF Symbol is supported
 * 
 * @param systemName - The SF Symbol name to check
 * @returns Whether the symbol has a Lucide mapping
 * 
 * @example
 * ```typescript
 * if (isSystemNameSupported("heart.fill")) {
 *   const icon = Image({ systemName: "heart.fill" })
 * } else {
 *   const icon = Image({ systemName: "heart" }) // Use fallback
 * }
 * ```
 */
export function isSystemNameSupported(systemName: string): boolean {
  return getLucideForSFSymbol(systemName) !== undefined
}

/**
 * Utility function to get mapping information for an SF Symbol
 * 
 * @param systemName - The SF Symbol name
 * @returns Mapping information including match quality and notes
 * 
 * @example
 * ```typescript
 * const info = getSystemNameInfo("heart.fill")
 * console.log(`Uses Lucide icon: ${info?.lucideIcon}`)
 * console.log(`Match quality: ${info?.matchQuality}`)
 * ```
 */
export function getSystemNameInfo(systemName: string) {
  return getSFSymbolMapping(systemName)
}

/**
 * Migration utility to find potential SF Symbol names for a Lucide icon
 * Useful when converting existing Lucide usage to SF Symbol names
 * 
 * @param lucideIcon - The Lucide icon name
 * @returns Array of SF Symbol names that map to this Lucide icon
 * 
 * @example
 * ```typescript
 * const sfNames = getSFSymbolsForLucide("heart")
 * // Returns: ["heart", "heart.fill"]
 * ```
 */
export function getSFSymbolsForLucide(lucideIcon: string): string[] {
  return getSFSymbolsForLucideMapping(lucideIcon)
}

/**
 * Batch conversion utility for migrating multiple SF Symbol names
 * 
 * @param systemNames - Array of SF Symbol names to convert
 * @returns Array of conversion results with status information
 * 
 * @example
 * ```typescript
 * const results = batchConvertSystemNames([
 *   "heart.fill",
 *   "star.circle",
 *   "unknown.symbol"
 * ])
 * 
 * results.forEach(result => {
 *   if (result.success) {
 *     console.log(`${result.sfSymbol} -> ${result.lucideIcon}`)
 *   } else {
 *     console.warn(`No mapping found for ${result.sfSymbol}`)
 *   }
 * })
 * ```
 */
export interface ConversionResult {
  sfSymbol: string
  lucideIcon?: string
  success: boolean
  matchQuality?: 'exact' | 'close' | 'approximate'
  notes?: string
}

export function batchConvertSystemNames(systemNames: string[]): ConversionResult[] {
  return systemNames.map(sfSymbol => {
    const mapping = getSFSymbolMapping(sfSymbol)
    
    if (mapping) {
      return {
        sfSymbol,
        lucideIcon: mapping.lucideIcon,
        success: true,
        matchQuality: mapping.matchQuality,
        notes: mapping.notes
      }
    } else {
      return {
        sfSymbol,
        success: false
      }
    }
  })
}