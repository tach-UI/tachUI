import type { ModifierFactory, ModifierMetadata, ModifierRegistry, PluginInfo } from '@tachui/registry';
import type { Modifier } from './types';
export declare const CORE_PLUGIN_INFO: PluginInfo;
type AnyModifierFactory<T = any> = ModifierFactory<T> | ((...args: any[]) => Modifier);
export declare function registerModifierWithMetadata<T>(name: string, factory: AnyModifierFactory<T>, metadata: Omit<ModifierMetadata, 'name' | 'plugin'>, registry?: ModifierRegistry, plugin?: PluginInfo): void;
//# sourceMappingURL=registration-utils.d.ts.map
