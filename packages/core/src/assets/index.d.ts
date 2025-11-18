/**
 * TachUI Assets System
 *
 * Provides a unified system for managing theme-adaptive assets including colors, images, and other resources.
 */
import { Asset } from './Asset';
import { ColorAsset } from './ColorAsset';
import { ImageAsset } from './ImageAsset';
import { FontAsset, type FontAssetOptions } from './FontAsset';
import type { AssetInfo, AssetsInterface } from './types';
export declare const Assets: AssetsInterface;
export { Asset, ColorAsset, ImageAsset, FontAsset };
export * from './types';
export { FontWeightPreset as FontWeight, FontWidth, SystemFonts, createSystemFont, createGoogleFont, createVariableFont, type FontAssetOptions, type FontWeightValue, type FontWidthValue } from './FontAsset';
export declare function registerAsset(name: string, asset: Asset): void;
export declare function registerAsset(asset: Asset): void;
export declare function registerAsset(asset: Asset, name?: string): void;
export declare function createColorAsset(light: string, dark: string, name?: string): ColorAsset;
export declare function createImageAsset(defaultPath: string, light?: string, dark?: string, name?: string, options?: {
    alt?: string;
    placeholder?: string;
}): ImageAsset;
export declare function createFontAsset(family: string, fallbacks?: string[], name?: string, options?: FontAssetOptions): FontAsset;
export declare function getAssetInfo(): AssetInfo[];
export declare function listAssetNames(): string[];
export { LinearGradient, StateGradient, RadialGradient } from '../gradients';
//# sourceMappingURL=index.d.ts.map