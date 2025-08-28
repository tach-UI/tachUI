/**
 * Advanced Symbol Rendering System (Phase 2)
 * 
 * Provides sophisticated rendering modes inspired by SwiftUI Symbol rendering:
 * - Monochrome: Single color with opacity variations
 * - Hierarchical: Multiple opacity levels with single hue
 * - Palette: Multiple distinct colors with semantic meaning
 * - Multicolor: Full-color icons with preserved original colors
 */

import type { IconDefinition, SymbolRenderingMode } from '../types.js'

/**
 * Color utility functions
 */
const lighten = (val: number) => Math.min(255, Math.floor(val + (255 - val) * 0.2))
const darken = (val: number) => Math.floor(val * 0.8)

export interface RenderingContext {
  primaryColor: string
  secondaryColor?: string
  tertiaryColor?: string
  backgroundColor?: string
  opacity?: number
  scale: number
  mode: SymbolRenderingMode
}

export interface RenderedSymbol {
  svg: string
  styles: Record<string, string>
  classes: string[]
  accessibility: Record<string, string>
}

/**
 * Advanced Symbol Renderer with sophisticated color handling
 */
export class AdvancedSymbolRenderer {
  
  /**
   * Render symbol with advanced mode processing
   */
  static render(
    definition: IconDefinition,
    context: RenderingContext
  ): RenderedSymbol {
    const { mode } = context
    
    switch (mode) {
      case 'monochrome':
        return this.renderMonochrome(definition, context)
      
      case 'hierarchical':
        return this.renderHierarchical(definition, context)
      
      case 'palette':
        return this.renderPalette(definition, context)
      
      case 'multicolor':
        return this.renderMulticolor(definition, context)
      
      default:
        return this.renderMonochrome(definition, context)
    }
  }
  
  /**
   * Monochrome rendering: Single color with consistent styling
   */
  private static renderMonochrome(
    definition: IconDefinition,
    context: RenderingContext
  ): RenderedSymbol {
    const { primaryColor, scale, opacity = 1 } = context
    
    // Process SVG to ensure monochrome styling
    const svg = this.processSVGForMonochrome(definition.svg, primaryColor, opacity)
    
    const styles = {
      width: `${scale}px`,
      height: `${scale}px`,
      color: primaryColor,
      opacity: opacity.toString(),
      display: 'inline-block',
      verticalAlign: 'middle',
    }
    
    const classes = [
      'tachui-symbol',
      'tachui-symbol--monochrome',
      `tachui-symbol--scale-${this.getScaleName(scale)}`
    ]
    
    return {
      svg,
      styles,
      classes,
      accessibility: this.generateAccessibilityAttributes(definition, context)
    }
  }
  
  /**
   * Hierarchical rendering: Multiple opacity levels with single hue
   */
  private static renderHierarchical(
    definition: IconDefinition,
    context: RenderingContext
  ): RenderedSymbol {
    const { primaryColor, scale, opacity = 1 } = context
    
    // Process SVG with hierarchical opacity levels
    const svg = this.processSVGForHierarchical(definition.svg, primaryColor)
    
    const styles = {
      width: `${scale}px`,
      height: `${scale}px`,
      color: primaryColor,
      opacity: opacity.toString(),
      display: 'inline-block',
      verticalAlign: 'middle',
      '--symbol-primary': primaryColor,
      '--symbol-secondary': this.adjustOpacity(primaryColor, 0.68),
      '--symbol-tertiary': this.adjustOpacity(primaryColor, 0.32),
    }
    
    const classes = [
      'tachui-symbol',
      'tachui-symbol--hierarchical',
      `tachui-symbol--scale-${this.getScaleName(scale)}`
    ]
    
    return {
      svg,
      styles,
      classes,
      accessibility: this.generateAccessibilityAttributes(definition, context)
    }
  }
  
  /**
   * Palette rendering: Multiple distinct colors with semantic meaning
   */
  private static renderPalette(
    definition: IconDefinition,
    context: RenderingContext
  ): RenderedSymbol {
    const { primaryColor, secondaryColor, tertiaryColor, scale, opacity = 1 } = context
    
    // Process SVG with palette colors
    const svg = this.processSVGForPalette(
      definition.svg,
      primaryColor,
      secondaryColor || this.generateSecondaryColor(primaryColor),
      tertiaryColor || this.generateTertiaryColor(primaryColor)
    )
    
    const styles = {
      width: `${scale}px`,
      height: `${scale}px`,
      opacity: opacity.toString(),
      display: 'inline-block',
      verticalAlign: 'middle',
      '--symbol-primary': primaryColor,
      '--symbol-secondary': secondaryColor || this.generateSecondaryColor(primaryColor),
      '--symbol-tertiary': tertiaryColor || this.generateTertiaryColor(primaryColor),
    }
    
    const classes = [
      'tachui-symbol',
      'tachui-symbol--palette',
      `tachui-symbol--scale-${this.getScaleName(scale)}`
    ]
    
    return {
      svg,
      styles,
      classes,
      accessibility: this.generateAccessibilityAttributes(definition, context)
    }
  }
  
  /**
   * Multicolor rendering: Preserve original icon colors
   */
  private static renderMulticolor(
    definition: IconDefinition,
    context: RenderingContext
  ): RenderedSymbol {
    const { scale, opacity = 1 } = context
    
    // Preserve original colors but allow opacity adjustment
    const svg = this.processSVGForMulticolor(definition.svg, opacity)
    
    const styles = {
      width: `${scale}px`,
      height: `${scale}px`,
      opacity: opacity.toString(),
      display: 'inline-block',
      verticalAlign: 'middle',
    }
    
    const classes = [
      'tachui-symbol',
      'tachui-symbol--multicolor',
      `tachui-symbol--scale-${this.getScaleName(scale)}`
    ]
    
    return {
      svg,
      styles,
      classes,
      accessibility: this.generateAccessibilityAttributes(definition, context)
    }
  }
  
  /**
   * Process SVG for monochrome rendering
   */
  private static processSVGForMonochrome(svg: string, color: string, opacity: number): string {
    const colorWithOpacity = opacity < 1 ? this.adjustOpacity(color, opacity) : color
    
    return svg
      // Remove existing fills and strokes
      .replace(/fill="[^"]*"/g, '')
      .replace(/stroke="[^"]*"/g, '')
      // Apply monochrome color
      .replace(/<path/g, `<path fill="${colorWithOpacity}" stroke="none"`)
      .replace(/<circle/g, `<circle fill="${colorWithOpacity}" stroke="none"`)
      .replace(/<rect/g, `<rect fill="${colorWithOpacity}" stroke="none"`)
      .replace(/<polygon/g, `<polygon fill="${colorWithOpacity}" stroke="none"`)
      .replace(/<ellipse/g, `<ellipse fill="${colorWithOpacity}" stroke="none"`)
  }
  
  /**
   * Process SVG for hierarchical rendering with opacity levels
   */
  private static processSVGForHierarchical(svg: string, baseColor: string): string {
    // Create hierarchical classes for different elements
    let processedSvg = svg
    
    // Primary elements (100% opacity)
    processedSvg = processedSvg.replace(
      /<path([^>]*class="[^"]*primary[^"]*"[^>]*)>/g,
      `<path$1 fill="var(--symbol-primary)">`
    )
    
    // Secondary elements (68% opacity)
    processedSvg = processedSvg.replace(
      /<path([^>]*class="[^"]*secondary[^"]*"[^>]*)>/g,
      `<path$1 fill="var(--symbol-secondary)">`
    )
    
    // Tertiary elements (32% opacity)
    processedSvg = processedSvg.replace(
      /<path([^>]*class="[^"]*tertiary[^"]*"[^>]*)>/g,
      `<path$1 fill="var(--symbol-tertiary)">`
    )
    
    // Default elements if no hierarchy is specified
    if (!processedSvg.includes('var(--symbol-')) {
      processedSvg = this.processSVGForMonochrome(processedSvg, baseColor, 1)
    }
    
    return processedSvg
  }
  
  /**
   * Process SVG for palette rendering with multiple colors
   */
  private static processSVGForPalette(
    svg: string,
    primaryColor: string,
    _secondaryColor: string,
    _tertiaryColor: string
  ): string {
    let processedSvg = svg
    
    // Apply palette colors based on semantic classes or order
    processedSvg = processedSvg
      .replace(/fill="primary"|class="[^"]*primary[^"]*"/g, `fill="var(--symbol-primary)"`)
      .replace(/fill="secondary"|class="[^"]*secondary[^"]*"/g, `fill="var(--symbol-secondary)"`)
      .replace(/fill="tertiary"|class="[^"]*tertiary[^"]*"/g, `fill="var(--symbol-tertiary)"`)
    
    // If no semantic classes, apply colors to different path elements
    if (!processedSvg.includes('var(--symbol-')) {
      const paths = processedSvg.match(/<path[^>]*>/g) || []
      if (paths.length >= 3 && paths[0] && paths[1] && paths[2]) {
        processedSvg = processedSvg.replace(paths[0], paths[0].replace(/fill="[^"]*"|$/, ` fill="var(--symbol-primary)"`))
        processedSvg = processedSvg.replace(paths[1], paths[1].replace(/fill="[^"]*"|$/, ` fill="var(--symbol-secondary)"`))
        processedSvg = processedSvg.replace(paths[2], paths[2].replace(/fill="[^"]*"|$/, ` fill="var(--symbol-tertiary)"`))
      } else {
        // Fallback to primary color
        processedSvg = this.processSVGForMonochrome(processedSvg, primaryColor, 1)
      }
    }
    
    return processedSvg
  }
  
  /**
   * Process SVG for multicolor rendering
   */
  private static processSVGForMulticolor(svg: string, opacity: number): string {
    // Preserve existing colors but apply opacity if needed
    if (opacity < 1) {
      return svg.replace(/<svg/, `<svg opacity="${opacity}"`)
    }
    return svg
  }
  
  /**
   * Adjust color opacity for hierarchical rendering
   */
  private static adjustOpacity(color: string, opacity: number): string {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    
    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
      return color.replace(/rgba?\(([^)]+)\)/, (_, values) => {
        const nums = values.split(',').map((v: string) => v.trim())
        return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${opacity})`
      })
    }
    
    // Handle CSS custom properties
    if (color.startsWith('var(')) {
      return `rgba(from ${color} r g b / ${opacity})`
    }
    
    // Fallback
    return color
  }
  
  /**
   * Generate secondary color from primary
   */
  private static generateSecondaryColor(primaryColor: string): string {
    // Simple algorithm: shift hue by 30 degrees or lighten
    if (primaryColor.startsWith('#')) {
      const hex = primaryColor.slice(1)
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      
      // Lighten by 20%
      return `#${lighten(r).toString(16).padStart(2, '0')}${lighten(g).toString(16).padStart(2, '0')}${lighten(b).toString(16).padStart(2, '0')}`
    }
    
    return primaryColor
  }
  
  /**
   * Generate tertiary color from primary
   */
  private static generateTertiaryColor(primaryColor: string): string {
    // Simple algorithm: darken or desaturate
    if (primaryColor.startsWith('#')) {
      const hex = primaryColor.slice(1)
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      
      // Darken by 20%
      return `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`
    }
    
    return primaryColor
  }
  
  /**
   * Get scale name for CSS classes
   */
  private static getScaleName(scale: number): string {
    if (scale <= 16) return 'small'
    if (scale <= 24) return 'medium'
    if (scale <= 32) return 'large'
    return 'xlarge'
  }
  
  /**
   * Generate accessibility attributes
   */
  private static generateAccessibilityAttributes(
    definition: IconDefinition,
    context: RenderingContext
  ): Record<string, string> {
    return {
      'role': 'img',
      'aria-hidden': 'true',
      'focusable': 'false',
      'data-icon': definition.name,
      'data-variant': definition.variant,
      'data-rendering-mode': context.mode
    }
  }
}