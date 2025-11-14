/**
 * Color Asset for TachUI Assets system
 *
 * Represents a theme-adaptive color with light and dark variants.
 */
import { Asset } from './Asset';
import type { ColorValidationResult } from './types';
/**
 * ColorAsset initialization options
 */
export interface ColorAssetOptions {
    default: string;
    light?: string;
    dark?: string;
    name: string;
}
export declare class ColorAsset extends Asset {
    readonly default: string;
    readonly light?: string;
    readonly dark?: string;
    constructor(options: ColorAssetOptions);
    static init(options: ColorAssetOptions): ColorAsset;
    /**
     * Validates a color string format
     * Supports: hex, rgb, rgba, hsl, hsla, and named colors
     */
    static validateColor(color: string): ColorValidationResult;
    static getCurrentTheme(): string;
    resolve(): string;
}
//# sourceMappingURL=ColorAsset.d.ts.map