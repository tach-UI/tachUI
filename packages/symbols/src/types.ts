import type { ComponentProps, Signal } from '@tachui/core'

/**
 * Symbol rendering modes (inspired by SwiftUI)
 */
export type SymbolRenderingMode = 
  | 'monochrome'    // Single color (default)
  | 'hierarchical'  // Uses opacity variations
  | 'palette'       // Multiple specified colors
  | 'multicolor'    // Uses icon's designed colors

/**
 * Symbol variants (inspired by SwiftUI)
 */
export type SymbolVariant =
  | 'none'          // Default variant
  | 'filled'        // Filled version
  | 'slash'         // With diagonal slash
  | 'circle'        // In circle frame
  | 'square'        // In square frame

/**
 * Symbol scales (inspired by SwiftUI)
 */
export type SymbolScale = 'small' | 'medium' | 'large'

/**
 * Symbol weights (inspired by SwiftUI)
 */
export type SymbolWeight = 
  | 'ultraLight' | 'thin' | 'light' | 'regular' 
  | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'

/**
 * Symbol effects for animations
 */
export type SymbolEffect =
  | 'none'
  | 'bounce'        // Bounce animation
  | 'pulse'         // Pulsing effect
  | 'wiggle'        // Subtle shake
  | 'rotate'        // 360° rotation
  | 'breathe'       // Scale in/out
  | 'shake'         // Shake animation
  | 'heartbeat'     // Heartbeat rhythm
  | 'glow'          // Glow effect

/**
 * Icon metadata for enhanced functionality
 */
export interface IconMetadata {
  category?: string
  tags?: string[]
  unicodePoint?: string
  alternativeNames?: string[]
  deprecated?: boolean
  availableVariants?: SymbolVariant[]
  availableWeights?: SymbolWeight[]
}

/**
 * Icon definition for rendering
 */
export interface IconDefinition {
  name: string
  variant: SymbolVariant
  weight: SymbolWeight
  svg: string
  viewBox: string
  metadata?: IconMetadata
}

/**
 * Icon set interface for pluggable icon systems
 */
export interface IconSet {
  name: string
  version: string
  icons: Record<string, IconDefinition>
  
  // Icon resolution
  getIcon(name: string, variant?: SymbolVariant): Promise<IconDefinition | undefined>
  hasIcon(name: string, variant?: SymbolVariant): boolean
  listIcons(): string[]
  
  // Metadata
  getIconMetadata(name: string): IconMetadata | undefined
  supportsVariant(name: string, variant: SymbolVariant): boolean
  supportsWeight(name: string, weight: SymbolWeight): boolean
}

/**
 * Symbol component properties
 */
export interface SymbolProps extends ComponentProps {
  // Core
  name: string | Signal<string>
  iconSet?: string // 'lucide', 'sf-symbols', 'custom'
  
  // Appearance
  variant?: SymbolVariant | Signal<SymbolVariant>
  scale?: SymbolScale | Signal<SymbolScale>
  weight?: SymbolWeight | number | Signal<SymbolWeight | number>
  renderingMode?: SymbolRenderingMode | Signal<SymbolRenderingMode>
  
  // Colors (for palette/multicolor modes)
  primaryColor?: string | Signal<string>
  secondaryColor?: string | Signal<string>
  tertiaryColor?: string | Signal<string>
  
  // Custom sizing (overrides scale when provided)
  size?: number | Signal<number>  // Square size (both width and height)
  width?: number | Signal<number>  // Custom width
  height?: number | Signal<number> // Custom height
  
  // Animation
  effect?: SymbolEffect | Signal<SymbolEffect>
  effectValue?: number | Signal<number> // For variable symbols (0-1)
  effectSpeed?: number // Animation speed multiplier
  effectRepeat?: number | 'infinite' // Animation iteration count
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityDescription?: string
  isDecorative?: boolean // Skip from screen readers
  
  // Performance
  eager?: boolean // Disable lazy loading
  fallback?: string // Fallback icon name
}

/**
 * SVG rendering strategies for optimal performance
 */
export enum IconRenderingStrategy {
  INLINE_SVG = 'inline',      // Embed SVG directly (best for SSR)
  SVG_USE = 'use',           // SVG <use> with symbol definitions
  SPRITE_SHEET = 'sprite'    // External sprite sheet
}