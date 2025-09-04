/**
 * Asset Collection for TachUI Assets system
 *
 * Manages a collection of assets and provides proxy-based access for dot notation.
 */
import type { Asset } from './Asset'
export declare class AssetCollection {
  private assets
  add(name: string, asset: Asset): void
  get(name: string): Asset | undefined
  getAll(): Map<string, Asset>
  asProxy(): Record<string, Asset | unknown>
}
//# sourceMappingURL=AssetCollection.d.ts.map
