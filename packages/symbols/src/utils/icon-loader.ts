import type { IconDefinition, SymbolVariant } from '../types.js'
import { IconSetRegistry } from '../icon-sets/registry.js'

/**
 * Tree-shakeable icon loading utilities
 */
export class IconLoader {
  private static iconCache = new Map<string, IconDefinition>()
  private static loadingPromises = new Map<string, Promise<IconDefinition | undefined>>()
  
  /**
   * Load icon with tree-shaking support
   */
  static async loadIcon(
    name: string, 
    variant: SymbolVariant = 'none',
    iconSetName?: string
  ): Promise<IconDefinition | undefined> {
    const cacheKey = `${iconSetName || 'default'}-${name}-${variant}`
    
    // Return cached icon if available
    if (this.iconCache.has(cacheKey)) {
      return this.iconCache.get(cacheKey)!
    }
    
    // Return existing loading promise if in progress
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!
    }
    
    // Start loading the icon
    const loadPromise = this.loadIconInternal(name, variant, iconSetName)
    this.loadingPromises.set(cacheKey, loadPromise)
    
    try {
      const result = await loadPromise
      if (result) {
        this.iconCache.set(cacheKey, result)
      }
      return result
    } catch (error) {
      console.warn(`Failed to load icon "${name}":`, error)
      return undefined
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }
  
  private static async loadIconInternal(
    name: string,
    variant: SymbolVariant,
    iconSetName?: string
  ): Promise<IconDefinition | undefined> {
    try {
      let iconSet
      try {
        iconSet = IconSetRegistry.get(iconSetName)
      } catch (registryError) {
        // If no icon set is found, try to auto-register Lucide as fallback
        // This happens when iconSetName === 'lucide' or when iconSetName is undefined/default
        if (iconSetName === 'lucide' || !iconSetName) {
          try {
            // Dynamic import to avoid bundling if not used
            const { LucideIconSet } = await import('../icon-sets/lucide.js')
            iconSet = new LucideIconSet()
            IconSetRegistry.register(iconSet)
            console.log('Auto-registered Lucide icon set')
          } catch (importError) {
            console.warn('Failed to auto-register Lucide icon set:', importError)
            throw registryError
          }
        } else {
          // For other specific icon sets, don't auto-register Lucide
          throw registryError
        }
      }
      
      return await iconSet.getIcon(name, variant)
    } catch (error) {
      console.warn(`Icon set error for "${name}":`, error)
      return undefined
    }
  }
  
  /**
   * Preload multiple icons for better performance
   */
  static async preloadIcons(
    names: string[], 
    variant: SymbolVariant = 'none',
    iconSetName?: string
  ): Promise<(IconDefinition | undefined)[]> {
    return Promise.all(
      names.map(name => this.loadIcon(name, variant, iconSetName))
    )
  }
  
  /**
   * Check if icon is cached
   */
  static isIconCached(
    name: string,
    variant: SymbolVariant = 'none',
    iconSetName?: string
  ): boolean {
    const cacheKey = `${iconSetName || 'default'}-${name}-${variant}`
    return this.iconCache.has(cacheKey)
  }
  
  /**
   * Get cached icon without loading
   */
  static getCachedIcon(
    name: string,
    variant: SymbolVariant = 'none',
    iconSetName?: string
  ): IconDefinition | undefined {
    const cacheKey = `${iconSetName || 'default'}-${name}-${variant}`
    return this.iconCache.get(cacheKey)
  }
  
  /**
   * Clear icon cache
   */
  static clearCache(): void {
    this.iconCache.clear()
    this.loadingPromises.clear()
  }
  
  /**
   * Get cache statistics
   */
  static getCacheStats(): { 
    cached: number; 
    loading: number; 
    totalSize: number 
  } {
    let totalSize = 0
    this.iconCache.forEach(icon => {
      totalSize += icon.svg.length
    })
    
    return {
      cached: this.iconCache.size,
      loading: this.loadingPromises.size,
      totalSize
    }
  }
  
  /**
   * Preload critical icons that are commonly used
   */
  static async preloadCriticalIcons(iconSetName?: string): Promise<void> {
    const criticalIcons = [
      'heart', 'star', 'user', 'home', 'settings', 'search', 'menu',
      'plus', 'minus', 'x', 'check', 'arrow-right', 'arrow-left'
    ]
    
    await this.preloadIcons(criticalIcons, 'none', iconSetName)
  }
  
  /**
   * Load icon with fallback support
   */
  static async loadIconWithFallback(
    name: string,
    fallbackName: string,
    variant: SymbolVariant = 'none',
    iconSetName?: string
  ): Promise<IconDefinition | undefined> {
    let icon = await this.loadIcon(name, variant, iconSetName)
    
    if (!icon && fallbackName !== name) {
      console.warn(`Icon "${name}" not found, trying fallback "${fallbackName}"`)
      icon = await this.loadIcon(fallbackName, variant, iconSetName)
    }
    
    return icon
  }
}