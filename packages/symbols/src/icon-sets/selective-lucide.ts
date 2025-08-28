/**
 * Selective Lucide icon set - only loads icons as needed
 * Much smaller bundle size than full Lucide library
 */

import type { IconSet, IconDefinition, SymbolVariant } from '../types.js'

interface SelectiveLucideOptions {
  /** Icons to preload immediately */
  preload?: string[]
  /** Whether to log when icons are dynamically loaded */
  debug?: boolean
}

export class SelectiveLucideIconSet implements IconSet {
  name = 'lucide'
  version = '0.447.0'
  
  private iconCache = new Map<string, IconDefinition>()
  private loadingPromises = new Map<string, Promise<IconDefinition | undefined>>()
  private options: SelectiveLucideOptions
  
  icons: Record<string, IconDefinition> = {}
  
  constructor(options: SelectiveLucideOptions = {}) {
    this.options = options
    
    // Preload specified icons
    if (options.preload) {
      this.preloadIcons(options.preload)
    }
  }
  
  async getIcon(name: string, variant: SymbolVariant = 'none'): Promise<IconDefinition | undefined> {
    const cacheKey = `${name}-${variant}`
    
    if (this.iconCache.has(cacheKey)) {
      return this.iconCache.get(cacheKey)!
    }
    
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!
    }
    
    const loadingPromise = this.loadIconDynamically(name, variant, cacheKey)
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
  
  private async loadIconDynamically(
    name: string, 
    variant: SymbolVariant, 
    cacheKey: string
  ): Promise<IconDefinition | undefined> {
    try {
      if (this.options.debug) {
        console.log(`🔍 Loading icon "${name}" dynamically`)
      }
      
      // Convert to PascalCase for Lucide import
      const pascalName = this.toPascalCase(name)
      
      // Dynamic import - only loads this specific icon
      const iconModule = await import(`lucide/dist/esm/icons/${name}.js`)
        .catch(() => import(`lucide/dist/esm/icons/${pascalName.toLowerCase()}.js`))
        .catch(() => {
          // Fallback to main module if individual icon not found
          return import('lucide').then(lucide => ({ [pascalName]: lucide[pascalName] }))
        })
      
      const iconData = iconModule[pascalName] || iconModule[name] || iconModule.default
      
      if (!iconData || !Array.isArray(iconData)) {
        console.warn(`Icon "${name}" not found in Lucide`)
        return undefined
      }
      
      const svg = this.processLucideIcon(iconData, variant)
      
      const definition: IconDefinition = {
        name,
        variant,
        weight: 'regular',
        svg,
        viewBox: '0 0 24 24'
      }
      
      this.iconCache.set(cacheKey, definition)
      return definition
    } catch (error) {
      console.warn(`Failed to load icon "${name}":`, error)
      return undefined
    }
  }
  
  private async preloadIcons(names: string[]) {
    await Promise.all(names.map(name => this.getIcon(name)))
  }
  
  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }
  
  private processLucideIcon(iconData: any, variant: SymbolVariant): string {
    if (!Array.isArray(iconData) || iconData.length < 3) {
      return ''
    }
    
    const [, , children] = iconData
    
    if (!Array.isArray(children)) {
      return ''
    }
    
    let svg = children.map(child => {
      if (!Array.isArray(child) || child.length < 2) {
        return ''
      }
      
      const [tagName, attributes] = child
      
      const attrString = Object.entries(attributes || {})
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
      
      if (['path', 'circle', 'rect', 'line', 'ellipse', 'polygon'].includes(tagName)) {
        return `<${tagName} ${attrString}/>`
      } else {
        return `<${tagName} ${attrString}></${tagName}>`
      }
    }).join('')
    
    if (variant === 'filled') {
      svg = svg.replace(/stroke="[^"]*"/g, 'fill="currentColor"')
              .replace(/fill="none"/g, 'fill="currentColor"')
      
      if (!svg.includes('fill=')) {
        svg = svg.replace(/<path ([^>]*)/g, '<path $1 fill="currentColor"')
      }
    }
    
    return svg
  }
  
  hasIcon(_name: string): boolean {
    return true // Assume all Lucide icons exist
  }
  
  listIcons(): string[] {
    return ['heart', 'star', 'user', 'home'] // Partial list
  }
  
  getIconMetadata(): undefined {
    return undefined
  }
  
  supportsVariant(_name: string, variant: SymbolVariant): boolean {
    return ['none', 'filled'].includes(variant)
  }
  
  supportsWeight(_name: string, _weight: any): boolean {
    return true
  }
}