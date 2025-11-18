import type { Signal } from '../reactive/types';
import type { Modifier } from './types';
import type { ModifierRegistry, PluginInfo } from '@tachui/registry';
type LayoutPriorityValue = number | Signal<number>;
export declare function layoutPriority(value: LayoutPriorityValue): Modifier;
export declare function registerLayoutPriorityModifier(registry?: ModifierRegistry, plugin?: PluginInfo): void;
//# sourceMappingURL=layout-priority.d.ts.map
