import type { Signal } from '../reactive/types'
import { LayoutModifier } from './base'
import { ModifierPriority } from './types'
import type { Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

type LayoutPriorityValue = number | Signal<number>

const metadata = {
  category: 'layout' as const,
  priority: ModifierPriority.LAYOUT,
  signature: '(value: number | Signal<number>) => Modifier',
  description:
    'Hints layout engines to prefer this component when resolving flexible sizing.',
}

const layoutPriorityFactory = (value: LayoutPriorityValue): Modifier => {
  return new LayoutModifier({ layoutPriority: value as any })
}

export function layoutPriority(value: LayoutPriorityValue): Modifier {
  return layoutPriorityFactory(value)
}

export function registerLayoutPriorityModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata(
    'layoutPriority',
    layoutPriorityFactory,
    metadata,
    registry,
    plugin,
  )
}
