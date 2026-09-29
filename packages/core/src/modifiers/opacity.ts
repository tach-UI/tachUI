import type { Signal } from '../reactive/types'
import { AppearanceModifier } from './base'
import { ModifierPriority } from './types'
import type { Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'
import { coreModifierSignatures } from './signatures.generated'

type OpacityValue = number | Signal<number>

const metadata = {
  category: 'appearance' as const,
  priority: ModifierPriority.APPEARANCE,
  signature: coreModifierSignatures.opacity,
  description: 'Adjusts component opacity while respecting reactive updates.',
}

const opacityFactory = (value: OpacityValue): Modifier => {
  return new AppearanceModifier({ opacity: value })
}

export function opacity(value: OpacityValue): Modifier {
  return opacityFactory(value)
}

export function registerOpacityModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata(
    'opacity',
    opacityFactory,
    metadata,
    registry,
    plugin,
  )
}
