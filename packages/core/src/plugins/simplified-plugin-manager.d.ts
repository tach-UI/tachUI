/**
 * Simplified Plugin Manager - Phase 1 Implementation
 *
 * Streamlined plugin management with essential functionality only.
 * Removes over-engineered security, performance monitoring, and complex preloading.
 */
import type { TachUIInstance, TachUIPlugin } from './simplified-types';
export declare class PluginError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare class SimplifiedPluginManager {
    private plugins;
    private instance;
    constructor(instance: TachUIInstance);
    install(plugin: TachUIPlugin): Promise<void>;
    uninstall(pluginName: string): Promise<void>;
    isInstalled(pluginName: string): boolean;
    getInstalledPlugins(): string[];
    getPlugin(pluginName: string): TachUIPlugin | undefined;
    getAllPlugins(): TachUIPlugin[];
    private validatePluginBasics;
}
//# sourceMappingURL=simplified-plugin-manager.d.ts.map