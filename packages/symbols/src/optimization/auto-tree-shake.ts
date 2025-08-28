/**
 * Framework-level automatic icon tree-shaking
 * This would be built into @tachui/symbols
 */

import type { IconSet, SymbolVariant } from '../types.js'

/**
 * Smart icon set that only loads icons as they're requested
 * Automatically tree-shakes unused icons at build time
 */
export class TreeShakingIconSet implements IconSet {
  name: string
  version: string
  icons: Record<string, any> = {}
  private loadedIcons = new Map<string, any>()
  private iconImporter: (name: string) => Promise<any>
  
  constructor(name: string, version: string, iconImporter: (name: string) => Promise<any>) {
    this.name = name
    this.version = version
    this.iconImporter = iconImporter
  }
  
  async getIcon(name: string, variant: SymbolVariant = 'none') {
    // Only load the icon if it's actually being used
    if (!this.loadedIcons.has(name)) {
      try {
        const iconData = await this.iconImporter(name)
        this.loadedIcons.set(name, iconData)
      } catch (error) {
        console.warn(`Failed to load icon "${name}":`, error)
        return undefined
      }
    }
    
    const iconData = this.loadedIcons.get(name)
    // Process iconData to SVG...
    return {
      name,
      variant,
      weight: 'regular' as const,
      svg: this.processIconData(iconData),
      viewBox: '0 0 24 24'
    }
  }
  
  private processIconData(iconData: any): string {
    // Convert Lucide format to SVG string
    if (!Array.isArray(iconData) || iconData.length < 3) return ''
    
    const [, , children] = iconData
    return children.map((child: any) => {
      if (!Array.isArray(child) || child.length < 2) return ''
      const [tagName, attributes] = child
      const attrs = Object.entries(attributes || {})
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
      return `<${tagName} ${attrs}/>`
    }).join('')
  }
  
  hasIcon(): boolean { return true }
  listIcons(): string[] { return [] }
  getIconMetadata() { return undefined }
  supportsVariant(): boolean { return true }
  supportsWeight(): boolean { return true }
}

/**
 * Create a tree-shaking Lucide icon set
 */
export function createOptimizedLucideIconSet(): TreeShakingIconSet {
  return new TreeShakingIconSet('lucide', '0.447.0', async (name: string) => {
    // This would use dynamic imports to only load specific icons
    const pascalName = name.split('-').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('')
    
    // Dynamic import of individual icon - only bundled if used
    const iconModule = await import(`lucide/dist/esm/icons/${name}.js`)
    return iconModule[pascalName] || iconModule.default
  })
}