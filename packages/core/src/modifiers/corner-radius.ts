import type { Signal } from '../reactive/types'
import { AppearanceModifier } from './base'
import { ModifierPriority } from './types'
import type { Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

type CornerRadiusValue = number | Signal<number>

const metadata = {
  category: 'appearance' as const,
  priority: ModifierPriority.APPEARANCE,
  signature: '(radius: number | Signal<number>) => Modifier',
  description: 'Rounds the corners of the component using border-radius.',
}

const cornerRadiusFactory = (radius: CornerRadiusValue): Modifier => {
  return new AppearanceModifier({ cornerRadius: radius })
}

export function cornerRadius(radius: CornerRadiusValue): Modifier {
  return cornerRadiusFactory(radius)
}

export function registerCornerRadiusModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata(
    'cornerRadius',
    cornerRadiusFactory,
    metadata,
    registry,
    plugin,
  )
}
