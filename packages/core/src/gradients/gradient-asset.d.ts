import { Asset } from '../assets/Asset';
import type { GradientAssetDefinitions } from './types';
export declare class GradientAsset extends Asset<string> {
    private definitions;
    constructor(name: string, definitions: GradientAssetDefinitions);
    resolve(): string;
    private getCurrentTheme;
}
export declare function createGradientAsset(definitions: GradientAssetDefinitions): GradientAsset;
//# sourceMappingURL=gradient-asset.d.ts.map