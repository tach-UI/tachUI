/**
 * Image Asset for TachUI Assets system
 *
 * Represents a theme-adaptive image with light and dark variants.
 */
import { Asset } from './Asset';
/**
 * ImageAsset initialization options
 */
export interface ImageAssetOptions {
    default: string;
    light?: string;
    dark?: string;
    name: string;
    options?: {
        alt?: string;
        placeholder?: string;
    };
}
export declare class ImageAsset extends Asset {
    readonly default: string;
    readonly light?: string;
    readonly dark?: string;
    readonly alt?: string;
    readonly placeholder?: string;
    constructor(options: ImageAssetOptions);
    static init(options: ImageAssetOptions): ImageAsset;
    static getCurrentTheme(): string;
    resolve(): string;
    get src(): string;
    get lightSrc(): string;
    get darkSrc(): string;
    get defaultSrc(): string;
}
//# sourceMappingURL=ImageAsset.d.ts.map