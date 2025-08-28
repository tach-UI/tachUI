import type { IconSet, IconDefinition, IconMetadata, SymbolVariant, SymbolWeight } from '../types.js'

/**
 * Convert kebab-case to PascalCase for Lucide icon names
 */
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

/**
 * Primary Lucide icon set implementation
 */
export class LucideIconSet implements IconSet {
  name = 'lucide'
  version = '0.447.0' // Latest Lucide version
  
  private iconCache = new Map<string, IconDefinition>()
  private loadingPromises = new Map<string, Promise<IconDefinition | undefined>>()
  icons: Record<string, IconDefinition> = {}
  
  async getIcon(name: string, variant: SymbolVariant = 'none'): Promise<IconDefinition | undefined> {
    const cacheKey = `${name}-${variant}`
    
    if (this.iconCache.has(cacheKey)) {
      return this.iconCache.get(cacheKey)!
    }
    
    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!
    }
    
    // Start loading
    const loadingPromise = this.loadIconInternal(name, variant, cacheKey)
    this.loadingPromises.set(cacheKey, loadingPromise)
    
    try {
      const result = await loadingPromise
      this.loadingPromises.delete(cacheKey)
      return result
    } catch (error) {
      this.loadingPromises.delete(cacheKey)
      throw error
    }
  }
  
  private async loadIconInternal(name: string, variant: SymbolVariant, cacheKey: string): Promise<IconDefinition | undefined> {
    try {
      // Convert to PascalCase for Lucide import (Lucide exports in PascalCase)
      const pascalName = toPascalCase(name)
      
      // Dynamic import from main lucide package - better Vite compatibility
      const lucideModule = await import('lucide') as any
      
      // Try multiple name formats to find the icon
      const iconData = lucideModule[pascalName] || lucideModule[name]
      
      if (!iconData || !Array.isArray(iconData)) {
        console.warn(`Icon "${name}" (${pascalName}) not found in Lucide icon set`)
        return undefined
      }
      
      // Lucide icons are objects with SVG data
      const svg = this.processLucideIcon(iconData, variant)
      
      const definition: IconDefinition = {
        name,
        variant,
        weight: 'regular', // Lucide doesn't have weights, use regular
        svg,
        viewBox: '0 0 24 24', // Standard Lucide viewBox
        metadata: this.getIconMetadata(name)
      }
      
      this.iconCache.set(cacheKey, definition)
      return definition
    } catch (error) {
      console.warn(`Failed to load icon "${name}":`, error)
      return undefined
    }
  }
  
  hasIcon(_name: string, _variant?: SymbolVariant): boolean {
    // For now, we'll assume the icon exists and let the dynamic import handle it
    // A more sophisticated implementation could maintain a manifest
    return true
  }
  
  listIcons(): string[] {
    // Return a subset of common Lucide icons for now
    // In a production implementation, this could be generated from the Lucide manifest
    return [
      'heart', 'star', 'plus', 'minus', 'x', 'check', 'arrow-right', 'arrow-left',
      'arrow-up', 'arrow-down', 'home', 'user', 'settings', 'search', 'menu',
      'circle', 'square', 'triangle', 'diamond', 'hexagon', 'octagon',
      'bookmark', 'calendar', 'clock', 'mail', 'phone', 'camera',
      'edit', 'trash', 'download', 'upload', 'share', 'copy',
      'play', 'pause', 'stop', 'skip-forward', 'skip-back', 'volume',
      'wifi', 'bluetooth', 'battery', 'signal', 'lock', 'unlock'
    ]
  }
  
  getIconMetadata(name: string): IconMetadata | undefined {
    // Basic metadata for common icons
    const metadata: Record<string, IconMetadata> = {
      'heart': { category: 'social', tags: ['love', 'favorite', 'like'] },
      'star': { category: 'rating', tags: ['favorite', 'bookmark', 'rating'] },
      'user': { category: 'account', tags: ['person', 'profile', 'avatar'] },
      'home': { category: 'navigation', tags: ['house', 'main', 'dashboard'] },
      'settings': { category: 'system', tags: ['gear', 'preferences', 'config'] },
      'search': { category: 'action', tags: ['find', 'lookup', 'magnify'] },
      'menu': { category: 'navigation', tags: ['hamburger', 'bars', 'options'] },
      'edit': { category: 'action', tags: ['pencil', 'modify', 'change'] },
      'trash': { category: 'action', tags: ['delete', 'remove', 'bin'] },
      'download': { category: 'action', tags: ['save', 'get', 'import'] },
      'upload': { category: 'action', tags: ['send', 'export', 'share'] },
      'play': { category: 'media', tags: ['start', 'begin', 'video'] },
      'pause': { category: 'media', tags: ['stop', 'halt', 'video'] },
    }
    
    return metadata[name]
  }
  
  supportsVariant(_name: string, variant: SymbolVariant): boolean {
    // Most Lucide icons support basic variants through CSS manipulation
    return ['none', 'filled'].includes(variant)
  }
  
  supportsWeight(_name: string, weight: SymbolWeight): boolean {
    // Lucide icons are single weight, but we can simulate with stroke-width
    return weight === 'regular'
  }
  
  private processLucideIcon(iconData: any, variant: SymbolVariant): string {
    // Process Lucide icon data which is in format [tagName, attributes, children]
    if (!Array.isArray(iconData) || iconData.length < 3) {
      return ''
    }
    
    // iconData structure: ['svg', attributes, children]
    const [, , children] = iconData
    
    if (!Array.isArray(children)) {
      return ''
    }
    
    // Convert children array to SVG elements
    let svg = children.map(child => {
      if (!Array.isArray(child) || child.length < 2) {
        return ''
      }
      
      const [tagName, attributes] = child
      
      // Convert attributes object to attribute string
      const attrString = Object.entries(attributes || {})
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
      
      // Handle self-closing tags like path, circle, etc.
      if (['path', 'circle', 'rect', 'line', 'ellipse', 'polygon'].includes(tagName)) {
        return `<${tagName} ${attrString}/>`
      } else {
        return `<${tagName} ${attrString}></${tagName}>`
      }
    }).join('')
    
    // Apply variant modifications
    if (variant === 'filled') {
      // Convert strokes to fills for filled variant
      svg = svg.replace(/stroke="[^"]*"/g, 'fill="currentColor"')
              .replace(/fill="none"/g, 'fill="currentColor"')
      
      // If no stroke or fill attributes exist, add fill to path elements
      if (!svg.includes('fill=')) {
        svg = svg.replace(/<path ([^>]*)/g, '<path $1 fill="currentColor"')
      }
    }
    
    return svg
  }
}