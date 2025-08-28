import type { IconSet } from '../types.js'

/**
 * Global icon set registry
 */
export class IconSetRegistry {
  private static iconSets = new Map<string, IconSet>()
  private static defaultIconSet = 'lucide'
  
  static register(iconSet: IconSet): void {
    this.iconSets.set(iconSet.name, iconSet)
  }
  
  static get(name?: string): IconSet {
    const setName = name || this.defaultIconSet
    const iconSet = this.iconSets.get(setName)
    
    if (!iconSet) {
      throw new Error(`Icon set "${setName}" not registered`)
    }
    
    return iconSet
  }
  
  static setDefault(name: string): void {
    if (!this.iconSets.has(name)) {
      throw new Error(`Cannot set default to unregistered icon set "${name}"`)
    }
    this.defaultIconSet = name
  }
  
  static list(): string[] {
    return Array.from(this.iconSets.keys())
  }
  
  static has(name: string): boolean {
    return this.iconSets.has(name)
  }
  
  static clear(): void {
    this.iconSets.clear()
    this.defaultIconSet = 'lucide'
  }
}