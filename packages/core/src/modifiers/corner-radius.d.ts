import type { Signal } from '../reactive/types';
import type { Modifier } from './types';
import type { ModifierRegistry, PluginInfo } from '@tachui/registry';
type CornerRadiusValue = number | Signal<number>;
export declare function cornerRadius(radius: CornerRadiusValue): Modifier;
export declare function registerCornerRadiusModifier(registry?: ModifierRegistry, plugin?: PluginInfo): void;
//# sourceMappingURL=corner-radius.d.ts.map
