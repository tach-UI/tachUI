/**
 * TypeScript types and interfaces for TachUI Assets System
 */
import type { Asset } from './Asset'
import type { ColorAsset } from './ColorAsset'
import type { ImageAsset } from './ImageAsset'
import type { FontAsset } from './FontAsset'
export type { Asset }
/**
 * Interface for ColorAsset with theme-specific access
 */
export interface ColorAssetProxy extends ColorAsset {
  light: string
  dark: string
  toString(): string
  valueOf(): string
}
/**
 * Interface for ImageAsset with theme-specific access
 */
export interface ImageAssetProxy extends ImageAsset {
  lightSrc: string
  darkSrc: string
  toString(): string
  valueOf(): string
}
/**
 * Built-in system assets interface
 */
export interface SystemAssets {
  systemBlue: ColorAssetProxy
  systemGreen: ColorAssetProxy
  systemRed: ColorAssetProxy
  systemOrange: ColorAssetProxy
  systemPurple: ColorAssetProxy
  systemPink: ColorAssetProxy
  systemGray: ColorAssetProxy
  systemBlack: ColorAssetProxy
  systemWhite: ColorAssetProxy
}
/**
 * Interface for FontAsset with convenient access
 */
export interface FontAssetProxy extends FontAsset {
  toString(): string
  valueOf(): string
}
/**
 * Main Assets interface with extensible custom asset support
 */
export interface AssetsInterface extends SystemAssets {
  [key: string]: ColorAssetProxy | ImageAssetProxy | FontAssetProxy | Asset
}
/**
 * Asset discovery information
 */
export interface AssetInfo {
  name: string
  type: 'color' | 'image' | 'font' | 'custom'
  asset: Asset
}
/**
 * Color validation result
 */
export interface ColorValidationResult {
  isValid: boolean
  format?: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'named'
  error?: string
}
//# sourceMappingURL=types.d.ts.map
