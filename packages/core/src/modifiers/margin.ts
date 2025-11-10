import type { Signal } from '../reactive/types'
import { LayoutModifier } from './base'
import { ModifierPriority } from './types'
import type { LayoutModifierProps, Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

export type MarginValue =
  | NonNullable<LayoutModifierProps['margin']>
  | Signal<number | string>
  | Signal<NonNullable<LayoutModifierProps['margin']>>

const metadata = {
  category: 'layout' as const,
  priority: ModifierPriority.LAYOUT,
  signature: '(value: LayoutModifierProps["margin"]) => Modifier',
  description: 'Sets the outer margin for a component with support for per-edge values.',
}

const marginFactory = (value: MarginValue): Modifier => {
  return new LayoutModifier({ margin: value as any })
}

export function margin(value: MarginValue): Modifier {
  return marginFactory(value)
}

export function registerMarginModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata('margin', marginFactory, metadata, registry, plugin)
}
