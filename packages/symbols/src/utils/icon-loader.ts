import type { IconDefinition, SymbolVariant } from '../types.js'
import { IconSetRegistry } from '../icon-sets/registry.js'
import { getLucideForSFSymbol } from '../compatibility/sf-symbols-mapping.js'

/**
 * Is the icon set being asked for backed by Lucide?
 *
 * `IconSetRegistry` keys a set by its own `name`, so an explicit request names
 * the backend directly. With no name the registry's current default decides,
 * which `setDefault()` can move to a custom set at any point.
 */
function isLucideBackend(iconSetName?: string): boolean {
  if (iconSetName !== undefined) return iconSetName === 'lucide'

  try {
    return IconSetRegistry.get().name === 'lucide'
  } catch {
    // Nothing registered yet: `loadIconInternal` auto-registers Lucide for the
    // unnamed case, so that is the backend this will end up asking.
    return true
  }
}

/**
 * Is `name` one of Lucide's own icons?
 *
 * Lucide is imported dynamically, the same way `loadIconInternal` reaches it, so
 * asking this does not pull the icon set into a bundle that never loads one. The
 * module registry caches it, so the check costs nothing the load was not about
 * to pay anyway.
 */
async function isLucideNativeName(name: string): Promise<boolean> {
  try {
    const [{ toPascalCase }, lucide] = await Promise.all([
      import('../icon-sets/lucide.js'),
      import('lucide') as Promise<Record<string, unknown>>,
    ])
    return toPascalCase(name) in lucide || name in lucide
  } catch {
    // Lucide unavailable: the load is going to fail regardless, and answering
    // "not native" leaves the mapping as the better guess.
    return false
  }
}

/**
 * Resolve an SF Symbol name to its Lucide equivalent.
 *
 * Applied at this boundary rather than by each caller so that loading and the
 * cache probes agree on one name. Resolving in `Symbol()` alone meant
 * `preloadIcons(['heart.fill'])` — the spelling the compatibility guide
 * documents — cached under a name the render never asked for.
 *
 * Three things have to be true at once, and each was a reported bug:
 *
 * 1. The table maps SF Symbol names onto *Lucide's* names, so it only applies
 *    when Lucide is the backend being asked. A custom or SF-Symbols-native set
 *    may hold an icon whose own name is `heart.fill`; rewriting that to `heart`
 *    would make it permanently unloadable.
 * 2. An unmapped name passes through unchanged, so icon-set-native names such
 *    as `chevron-right` keep working.
 * 3. **The name as written wins when Lucide has an icon of that name.** Seven
 *    SF keys — `trash`, `house`, `bolt`, `cross`, `ellipsis`, `forward`,
 *    `speaker` — are also real Lucide icons, and mapping them unconditionally
 *    sent `Symbol('trash')` to `trash-2`: a different glyph from the one the
 *    caller named, and a regression against the behaviour before this table was
 *    consulted at all.
 *
 * The membership check is exact rather than heuristic. Spelling is not a usable
 * signal here: dot-free names are not reliably Lucide's, since `checkmark`,
 * `magnifyingglass`, `xmark`, `archivebox`, `person` and `mappin` are dot-free
 * SF names that genuinely need mapping.
 */
async function resolveIconName(name: string, iconSetName?: string): Promise<string> {
  if (!isLucideBackend(iconSetName)) return name

  const mapped = getLucideForSFSymbol(name)
  if (!mapped || mapped === name) return name

  return (await isLucideNativeName(name)) ? name : mapped
}

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
    const cacheKey = this.cacheKey(name, variant, iconSetName)

    // Return cached icon if available
    if (this.iconCache.has(cacheKey)) {
      return this.iconCache.get(cacheKey)!
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!
    }

    // Start loading the icon
    const loadPromise = this.loadResolved(name, variant, iconSetName)
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
  
  /**
   * The cache key for a request.
   *
   * Keyed on the name the *caller* asked for, so every entry point — a render,
   * `preloadIcons`, the cache probes below — agrees on one key without having
   * to resolve first. Which spelling ultimately loads is an internal detail,
   * and since resolution now consults Lucide it cannot be answered
   * synchronously.
   */
  private static cacheKey(
    name: string,
    variant: SymbolVariant,
    iconSetName?: string
  ): string {
    return `${iconSetName || 'default'}-${name}-${variant}`
  }

  private static async loadResolved(
    name: string,
    variant: SymbolVariant,
    iconSetName?: string
  ): Promise<IconDefinition | undefined> {
    return this.loadIconInternal(
      await resolveIconName(name, iconSetName),
      variant,
      iconSetName
    )
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
    return this.iconCache.has(this.cacheKey(name, variant, iconSetName))
  }
  
  /**
   * Get cached icon without loading
   */
  static getCachedIcon(
    name: string,
    variant: SymbolVariant = 'none',
    iconSetName?: string
  ): IconDefinition | undefined {
    return this.iconCache.get(this.cacheKey(name, variant, iconSetName))
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