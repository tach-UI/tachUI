export interface CoreFeatureFlags {
    proxyModifiers: boolean;
}
export declare function configureCore(options: Partial<CoreFeatureFlags>): void;
export declare function getCoreFeatureFlags(): CoreFeatureFlags;
export declare function isProxyEnabled(): boolean;
//# sourceMappingURL=config.d.ts.map