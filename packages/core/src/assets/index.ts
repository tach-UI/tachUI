/**
 * TachUI Assets System
 *
 * Provides a unified system for managing theme-adaptive assets including colors, images, and other resources.
 */

import { Asset } from './Asset'
import { AssetCollection } from './AssetCollection'
import { ColorAsset } from './ColorAsset'
import { ImageAsset } from './ImageAsset'
import { FontAsset, type FontAssetOptions } from './FontAsset'
import type { AssetInfo, AssetsInterface } from './types'

// Global asset collection
const globalAssets = new AssetCollection()

// Create the proxy that enables dot notation access
const AssetsProxy = globalAssets.asProxy()

// Export the Assets object with proper TypeScript interface
export const Assets: AssetsInterface = AssetsProxy as AssetsInterface

// Export asset classes and types
export { Asset, ColorAsset, ImageAsset, FontAsset }
export * from './types'
export { 
  FontWeightPreset as FontWeight, 
  FontWidth, 
  SystemFonts, 
  createSystemFont, 
  createGoogleFont, 
  createVariableFont,
  type FontAssetOptions,
  type FontWeightValue,
  type FontWidthValue 
} from './FontAsset'

// Convenience function for registering assets
export function registerAsset(name: string, asset: Asset): void
export function registerAsset(asset: Asset): void
export function registerAsset(asset: Asset, name?: string): void
export function registerAsset(nameOrAsset: string | Asset, assetOrName?: Asset | string): void {
  if (typeof nameOrAsset === 'string' && assetOrName instanceof Asset) {
    // Legacy usage: registerAsset(name, asset)
    globalAssets.add(nameOrAsset, assetOrName)
  } else if (nameOrAsset instanceof Asset && typeof assetOrName === 'string') {
    // New usage: registerAsset(asset, overrideName)
    globalAssets.add(assetOrName, nameOrAsset)
  } else if (nameOrAsset instanceof Asset && assetOrName === undefined) {
    // New usage: registerAsset(asset) - uses asset.name
    globalAssets.add(nameOrAsset.name, nameOrAsset)
  } else {
    throw new Error('registerAsset requires either (name, asset), (asset), or (asset, overrideName)')
  }
}

// Convenience functions for creating assets (updated to new API)
export function createColorAsset(
  light: string,
  dark: string,
  name: string = ''
): ColorAsset {
  return ColorAsset.init({
    default: light,
    light,
    dark,
    name
  })
}

export function createImageAsset(
  defaultPath: string,
  light?: string,
  dark?: string,
  name: string = '',
  options?: { alt?: string; placeholder?: string }
): ImageAsset {
  return ImageAsset.init({
    default: defaultPath,
    light,
    dark,
    name,
    options
  })
}

export function createFontAsset(
  family: string,
  fallbacks: string[] = [],
  name: string = '',
  options?: FontAssetOptions
): FontAsset {
  return FontAsset.init(family, fallbacks, name, options)
}

// Asset discovery function for debugging
export function getAssetInfo(): AssetInfo[] {
  const allAssets = globalAssets.getAll()
  const assetInfos: AssetInfo[] = []

  for (const [name, asset] of allAssets) {
    let type: 'color' | 'image' | 'font' | 'custom' = 'custom'

    if (asset instanceof ColorAsset) {
      type = 'color'
    } else if (asset instanceof ImageAsset) {
      type = 'image'
    } else if (asset instanceof FontAsset) {
      type = 'font'
    }

    assetInfos.push({
      name,
      type,
      asset,
    })
  }

  return assetInfos.sort((a, b) => a.name.localeCompare(b.name))
}

// Asset discovery function to list all registered asset names
export function listAssetNames(): string[] {
  return Array.from(globalAssets.getAll().keys()).sort()
}

// Create built-in system assets using new simplified API
registerAsset(ColorAsset.init({
  default: '#007AFF',
  light: '#007AFF',
  dark: '#0A84FF',
  name: 'systemBlue'
}))
registerAsset(ColorAsset.init({
  default: '#34C759',
  light: '#34C759',
  dark: '#30D158',
  name: 'systemGreen'
}))
registerAsset(ColorAsset.init({
  default: '#FF3B30',
  light: '#FF3B30',
  dark: '#FF453A',
  name: 'systemRed'
}))
registerAsset(ColorAsset.init({
  default: '#FF9500',
  light: '#FF9500',
  dark: '#FF9F0A',
  name: 'systemOrange'
}))
registerAsset(ColorAsset.init({
  default: '#5856D6',
  light: '#5856D6',
  dark: '#5E5CE6',
  name: 'systemPurple'
}))
registerAsset(ColorAsset.init({
  default: '#FF2D55',
  light: '#FF2D55',
  dark: '#FF375F',
  name: 'systemPink'
}))
registerAsset(ColorAsset.init({
  default: '#8E8E93',
  name: 'systemGray'
}))
registerAsset(ColorAsset.init({
  default: '#000000',
  name: 'systemBlack'
}))
registerAsset(ColorAsset.init({
  default: '#FFFFFF',
  name: 'systemWhite'
}))
