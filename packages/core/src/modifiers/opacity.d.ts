import type { Signal } from '../reactive/types';
import type { Modifier } from './types';
import type { ModifierRegistry, PluginInfo } from '@tachui/registry';
type OpacityValue = number | Signal<number>;
export declare function opacity(value: OpacityValue): Modifier;
export declare function registerOpacityModifier(registry?: ModifierRegistry, plugin?: PluginInfo): void;
//# sourceMappingURL=opacity.d.ts.map
