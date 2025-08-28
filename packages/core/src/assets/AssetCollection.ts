/**
 * Asset Collection for TachUI Assets system
 *
 * Manages a collection of assets and provides proxy-based access for dot notation.
 */

import type { Asset } from './Asset'
import { ColorAsset } from './ColorAsset'
import { FontAsset } from './FontAsset'

export class AssetCollection {
  private assets: Map<string, Asset> = new Map()

  add(name: string, asset: Asset): void {
    this.assets.set(name, asset)
  }

  get(name: string): Asset | undefined {
    return this.assets.get(name)
  }

  getAll(): Map<string, Asset> {
    return new Map(this.assets)
  }

  // Proxy handler for dot notation access
  asProxy(): Record<string, Asset | unknown> {
    return new Proxy(
      {},
      {
        get: (_target, property: string) => {
          // Handle special proxy methods
          if (property === 'toString' || property === 'valueOf') {
            return () => '[Assets]'
          }

          const asset = this.assets.get(property)
          if (!asset) {
            return undefined
          }

          // If it's a ColorAsset, enable direct access with automatic theme adaptation
          if (asset instanceof ColorAsset) {
            // Return a proxy that enables .light, .dark access AND direct resolution
            return new Proxy(asset, {
              get: (target, prop: string) => {
                // Direct property access (.light, .dark)
                if (prop === 'light' || prop === 'dark') {
                  return (target as any)[prop]
                }

                // If accessed directly (not as property), return resolved value
                if (prop === 'toString' || prop === 'valueOf') {
                  return () => target.resolve()
                }

                // Default property access
                return (target as any)[prop]
              },
            })
          }

          // If it's a FontAsset, enable convenient access
          if (asset instanceof FontAsset) {
            return new Proxy(asset, {
              get: (target, prop: string) => {
                // Direct property access (.family, .fallbacks)
                if (prop === 'family' || prop === 'fallbacks' || prop === 'options') {
                  return (target as any)[prop]
                }

                // String conversion returns font-family CSS value
                if (prop === 'toString' || prop === 'valueOf') {
                  return () => target.resolve()
                }

                // Default property access
                return (target as any)[prop]
              },
            })
          }

          // For other asset types, return the asset directly
          return asset
        },
        
        // Add ownKeys handler to support Object.keys() enumeration
        ownKeys: (_target) => {
          return Array.from(this.assets.keys())
        },
        
        // Add has handler to support 'in' operator
        has: (_target, property: string) => {
          return this.assets.has(property)
        }
      }
    )
  }
}
