import type { IconDefinition } from '../types.js'
import { IconRenderingStrategy } from '../types.js'

/**
 * Performance-optimized SVG renderer
 */
export class OptimizedSVGRenderer {
  private static svgCache = new Map<string, string>()
  private static spriteGenerated = false
  private static spriteElement: HTMLElement | null = null
  
  static render(
    definition: IconDefinition, 
    strategy: IconRenderingStrategy = IconRenderingStrategy.INLINE_SVG,
    props?: { size?: number; color?: string }
  ): string {
    
    const cacheKey = `${definition.name}-${definition.variant}-${strategy}-${props?.size || 24}-${props?.color || 'currentColor'}`
    
    if (this.svgCache.has(cacheKey)) {
      return this.svgCache.get(cacheKey)!
    }
    
    let rendered: string
    
    switch (strategy) {
      case IconRenderingStrategy.INLINE_SVG:
        rendered = this.renderInlineSVG(definition, props)
        break
      
      case IconRenderingStrategy.SVG_USE:
        rendered = this.renderSVGUse(definition, props)
        break
        
      case IconRenderingStrategy.SPRITE_SHEET:
        rendered = this.renderSpriteSheet(definition, props)
        break
        
      default:
        rendered = this.renderInlineSVG(definition, props)
    }
    
    this.svgCache.set(cacheKey, rendered)
    return rendered
  }
  
  private static renderInlineSVG(
    definition: IconDefinition, 
    props?: { size?: number; color?: string }
  ): string {
    const size = props?.size || 24
    const color = props?.color || 'currentColor'
    
    return `<svg 
      width="${size}" 
      height="${size}" 
      viewBox="${definition.viewBox}" 
      fill="none" 
      stroke="${color}" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >${definition.svg}</svg>`
  }
  
  private static renderSVGUse(
    definition: IconDefinition,
    props?: { size?: number; color?: string }
  ): string {
    this.ensureSymbolDefined(definition)
    
    const size = props?.size || 24
    const color = props?.color || 'currentColor'
    
    return `<svg 
      width="${size}" 
      height="${size}" 
      viewBox="${definition.viewBox}"
      fill="${color}"
      aria-hidden="true"
      focusable="false"
    >
      <use href="#icon-${definition.name}-${definition.variant}"></use>
    </svg>`
  }
  
  private static renderSpriteSheet(
    definition: IconDefinition,
    props?: { size?: number; color?: string }
  ): string {
    // For sprite sheet, we still use SVG use but with external reference
    this.ensureSpriteSheet()
    
    const size = props?.size || 24
    const color = props?.color || 'currentColor'
    
    return `<svg 
      width="${size}" 
      height="${size}" 
      viewBox="${definition.viewBox}"
      fill="${color}"
      aria-hidden="true"
      focusable="false"
    >
      <use href="#sprite-${definition.name}-${definition.variant}"></use>
    </svg>`
  }
  
  private static ensureSymbolDefined(definition: IconDefinition): void {
    const symbolId = `icon-${definition.name}-${definition.variant}`
    
    if (document.getElementById(symbolId)) {
      return
    }
    
    // Create hidden SVG with symbol definitions
    let defsContainer = document.getElementById('tachui-symbol-defs')
    
    if (!defsContainer) {
      defsContainer = document.createElement('svg')
      defsContainer.id = 'tachui-symbol-defs'
      defsContainer.style.cssText = 'position: absolute; width: 0; height: 0; overflow: hidden;'
      defsContainer.setAttribute('aria-hidden', 'true')
      document.body.insertBefore(defsContainer, document.body.firstChild)
    }
    
    const symbol = document.createElement('symbol')
    symbol.id = symbolId
    symbol.setAttribute('viewBox', definition.viewBox)
    symbol.innerHTML = definition.svg
    
    defsContainer.appendChild(symbol)
  }
  
  private static ensureSpriteSheet(): void {
    if (this.spriteGenerated || this.spriteElement) {
      return
    }
    
    // Create sprite sheet element
    this.spriteElement = document.createElement('div')
    this.spriteElement.id = 'tachui-sprite-sheet'
    this.spriteElement.style.cssText = 'position: absolute; width: 0; height: 0; overflow: hidden;'
    this.spriteElement.setAttribute('aria-hidden', 'true')
    document.body.insertBefore(this.spriteElement, document.body.firstChild)
    
    this.spriteGenerated = true
  }
  
  static clearCache(): void {
    this.svgCache.clear()
  }
  
  static resetSpriteSheet(): void {
    this.spriteGenerated = false
    this.spriteElement = null
  }
  
  static getCacheSize(): number {
    return this.svgCache.size
  }
  
  static preloadIcon(definition: IconDefinition): void {
    // Pre-render and cache the icon
    this.render(definition, IconRenderingStrategy.INLINE_SVG)
  }
}

/**
 * Icon loading utilities
 */
export class IconLoader {
  private static loadingPromises = new Map<string, Promise<any>>()
  
  static async preloadIcons(names: string[], iconSetName?: string): Promise<void[]> {
    const { IconSetRegistry } = await import('../icon-sets/registry.js')
    const iconSet = IconSetRegistry.get(iconSetName)
    
    return Promise.all(
      names.map(name => this.loadIcon(name, iconSet).then(() => undefined))
    )
  }
  
  static async loadIcon(name: string, iconSet: any): Promise<any> {
    const key = `${iconSet.name}-${name}`
    
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!
    }
    
    const promise = iconSet.getIcon(name)
    this.loadingPromises.set(key, promise)
    
    try {
      const result = await promise
      return result
    } catch (error) {
      this.loadingPromises.delete(key)
      throw error
    }
  }
  
  static clearCache(): void {
    this.loadingPromises.clear()
  }
}

/**
 * Estimate bundle size for given icons
 */
export async function getIconBundleSize(iconNames: string[]): Promise<number> {
  // Estimate bundle size for given icons
  // This is a rough estimate - actual sizes will vary
  const baseSize = 2000 // Base icon set overhead in bytes
  const perIconSize = 500 // Average size per icon in bytes
  
  return baseSize + (iconNames.length * perIconSize)
}

/**
 * Basic SVG optimization
 */
export function optimizeSVG(svg: string): string {
  // Basic SVG optimization
  return svg
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .replace(/\s*=\s*/g, '=') // Remove whitespace around equals
    .replace(/"\s+/g, '" ') // Normalize attribute spacing
    .trim()
}

/**
 * More aggressive SVG minification
 */
export function minifySVG(svg: string): string {
  // More aggressive minification
  return optimizeSVG(svg)
    .replace(/<!--.*?-->/g, '') // Remove comments
    .replace(/\s+fill="none"/g, '') // Remove redundant fill="none"
    .replace(/\s+stroke-width="2"/g, '') // Remove default stroke-width
    .replace(/\s+stroke-linecap="round"/g, '') // Remove default linecap
    .replace(/\s+stroke-linejoin="round"/g, '') // Remove default linejoin
}