/**
 * Base Asset class for TachUI Assets system
 *
 * Provides the foundation for all asset types including colors, images, and other resources.
 */
export declare abstract class Asset<T = unknown> {
    readonly name: string;
    constructor(name: string);
    abstract resolve(): T;
}
//# sourceMappingURL=Asset.d.ts.map