/**
 * TachUI Asset System Types
 *
 * Type definitions for the asset system.
 * These types are extracted from @tachui/core to enable shared usage.
 * Note: These are interface definitions only. Actual Asset class implementations
 * remain in @tachui/core.
 */

/**
 * Base Asset interface
 */
export interface Asset {
  readonly name: string
}

/**
 * Interface for ColorAsset with theme-specific access
 */
export interface ColorAssetProxy extends Asset {
  light: string
  dark: string
  resolve(): string
  opacity(alpha: number): ColorAssetProxy
  saturate(amount: number): ColorAssetProxy
  brighten(amount: number): ColorAssetProxy
  contrast(amount: number): ColorAssetProxy
  rotateHue(degrees: number): ColorAssetProxy
  toString(): string
  valueOf(): string
}

/**
 * Interface for ImageAsset with theme-specific access
 */
export interface ImageAssetProxy extends Asset {
  lightSrc: string
  darkSrc: string
  resolve(): string
  toString(): string
  valueOf(): string
}

/**
 * Interface for FontAsset with convenient access
 */
export interface FontAssetProxy extends Asset {
  toString(): string
  valueOf(): string
}

/**
 * Proxies returned by the dynamic Assets object.
 */
export type RegisteredAssetProxy =
  | ColorAssetProxy
  | ImageAssetProxy
  | FontAssetProxy

/**
 * Any asset that can be registered in the collection.
 */
export type RegisteredAsset = RegisteredAssetProxy | Asset

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
 * Main Assets interface for dynamic dot-notation access.
 *
 * Consumers can augment `CustomAssets` to strongly type known runtime-registered
 * asset names:
 *
 * ```ts
 * declare module '@tachui/types/assets' {
 *   interface CustomAssets {
 *     sand: ColorAssetProxy
 *   }
 * }
 * ```
 */
export interface CustomAssets {}

export interface AssetsInterface extends SystemAssets, CustomAssets {
  [key: string]: RegisteredAssetProxy
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
  format?:
    | 'hex'
    | 'rgb'
    | 'rgba'
    | 'hsl'
    | 'hsla'
    | 'hwb'
    | 'lab'
    | 'lch'
    | 'oklab'
    | 'oklch'
    | 'color'
    | 'named'
  error?: string
}

/**
 * Valid asset types for modifiers
 */
export type AssetValue =
  | Asset
  | RegisteredAssetProxy
