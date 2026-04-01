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
import type {
  ColorAssetProxy,
  ImageAssetProxy,
  FontAssetProxy,
  RegisteredAsset,
} from '@tachui/types/assets'

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
// Single asset registration returns typed proxy for type-safe usage
export function registerAsset(asset: ColorAsset): ColorAssetProxy
export function registerAsset(asset: ImageAsset): ImageAssetProxy
export function registerAsset(asset: FontAsset): FontAssetProxy
export function registerAsset(name: string, asset: ColorAsset): ColorAssetProxy
export function registerAsset(name: string, asset: ImageAsset): ImageAssetProxy
export function registerAsset(name: string, asset: FontAsset): FontAssetProxy
// Variadic overload returns void (can't return typed tuple)
export function registerAsset(...assets: [Asset, ...Asset[]]): void
// Legacy/optional-name overloads return void for backward compatibility
export function registerAsset(name: string, asset: Asset): void
export function registerAsset(asset: Asset, name?: string): void
// Implementation uses any return type to satisfy all overloads
// Return type is narrowed by TypeScript based on which overload matches
export function registerAsset(
  ...args: unknown[]
): ColorAssetProxy | ImageAssetProxy | FontAssetProxy | Asset | void {
  if (args.length === 0) {
    throw new Error('registerAsset requires at least one argument')
  }

  const firstArg = args[0]
  const secondArg = args[1]

  if (typeof firstArg === 'string' && secondArg instanceof Asset && args.length === 2) {
    // Legacy usage: registerAsset(name, asset)
    globalAssets.add(firstArg, secondArg)
    return secondArg
  } else if (firstArg instanceof Asset && typeof secondArg === 'string' && args.length === 2) {
    // New usage: registerAsset(asset, overrideName)
    globalAssets.add(secondArg, firstArg)
    return firstArg
  } else if (firstArg instanceof Asset && args.length === 1) {
    // New usage: registerAsset(asset) - uses asset.name
    globalAssets.add(firstArg.name, firstArg)
    return firstArg
  } else if (firstArg instanceof Asset && secondArg === undefined && args.length === 2) {
    // Compatibility for explicit `registerAsset(asset, undefined)`.
    globalAssets.add(firstArg.name, firstArg)
    return firstArg
  } else if (firstArg instanceof Asset && args.length > 1) {
    // Variadic usage: registerAsset(asset1, asset2, ...). This branch executes
    // only after all explicit two-argument signatures are exhausted.
    const validatedAssets: Asset[] = []

    // Validate first to keep batch registration atomic on failure.
    args.forEach((asset, index) => {
      if (!(asset instanceof Asset)) {
        throw new Error(
          `registerAsset variadic argument at index ${index} must be an Asset`
        )
      }
      validatedAssets.push(asset)
    })

    validatedAssets.forEach((asset) => {
      globalAssets.add(asset.name, asset)
    })
    return
  } else {
    throw new Error(
      'registerAsset requires either (name, asset), (asset), (asset, overrideName), or (...assets)'
    )
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

/**
 * Get a registered asset by name.
 * Use this for custom asset subclasses that are not represented on the dynamic
 * `Assets.<name>` proxy type.
 */
export function getAsset(name: string): RegisteredAsset | undefined {
  return globalAssets.get(name)
}

/**
 * Type guard for values that support ColorAsset transforms.
 */
export function isColorAsset(value: unknown): value is ColorAssetProxy {
  if (value instanceof ColorAsset) {
    return true
  }
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<ColorAssetProxy>
  return (
    typeof candidate.resolve === 'function' &&
    typeof candidate.opacity === 'function' &&
    typeof candidate.saturate === 'function' &&
    typeof candidate.brighten === 'function' &&
    typeof candidate.contrast === 'function' &&
    typeof candidate.rotateHue === 'function'
  )
}

/**
 * Resolve a named asset and narrow it to ColorAsset when possible.
 */
export function getColorAsset(name: string): ColorAssetProxy | undefined {
  const value = (AssetsProxy as Record<string, unknown>)[name]
  return isColorAsset(value) ? value : undefined
}

/**
 * Assert an unknown value is a ColorAssetProxy.
 * Useful for narrowing when reading from `Assets.<dynamicName>`.
 */
export function asColorAsset(
  value: unknown,
  nameForError: string = 'asset'
): ColorAssetProxy {
  if (!isColorAsset(value)) {
    throw new Error(`Asset "${nameForError}" is not a ColorAsset`)
  }
  return value
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

// Re-export gradient functions from the same module context to ensure instanceof checks work
export { LinearGradient, StateGradient, RadialGradient } from '../gradients'
