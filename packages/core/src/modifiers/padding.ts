import type { Signal } from '../reactive/types'
import { LayoutModifier } from './base'
import { ModifierPriority } from './types'
import type { LayoutModifierProps, Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

export type PaddingValue =
  | NonNullable<LayoutModifierProps['padding']>
  | Signal<number>
  | Signal<NonNullable<LayoutModifierProps['padding']>>

const metadata = {
  category: 'layout' as const,
  priority: ModifierPriority.LAYOUT,
  signature: '(value: LayoutModifierProps["padding"]) => Modifier',
  description: 'Applies padding to all sides or specific edges of a component.',
}

const paddingFactory = (value: PaddingValue): Modifier => {
  return new LayoutModifier({ padding: value as any })
}

export function padding(value: PaddingValue): Modifier {
  return paddingFactory(value)
}

export function registerPaddingModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata('padding', paddingFactory, metadata, registry, plugin)
}
