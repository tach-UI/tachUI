/**
 * @fileoverview TachUI Assets Bundle
 *
 * Dedicated entry point for asset-related functions (fonts, colors, images, gradients).
 * Enables tree-shaking for applications that only need asset functionality.
 */

// Core asset system
export {
  Assets,
  Asset,
  ColorAsset,
  ImageAsset,
  FontAsset,
  registerAsset,
  createColorAsset,
  createImageAsset,
  createFontAsset,
  createGoogleFont,
  createVariableFont,
  getAssetInfo,
  listAssetNames,
  type FontAssetOptions,
  type FontWeightValue,
  type FontWidthValue,
  type AssetInfo,
  type AssetsInterface,
} from '../assets'

// Gradient system
export { LinearGradient, RadialGradient, StateGradient } from '../gradients'

/**
 * Assets Bundle Metadata
 */
export const BUNDLE_INFO = {
  name: '@tachui/core/assets',
  version: '0.1.0',
  description:
    'Dedicated assets bundle for fonts, colors, images, and gradients',
  targetSize: '~15KB',
  useCase: 'Asset-heavy applications, theming systems, design systems',
} as const
