import type { Signal } from '../reactive/types'
import type { Asset } from '../assets/Asset'
import { AppearanceModifier } from './base'
import { ModifierPriority } from './types'
import type { Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

type ForegroundInput = string | Asset | Signal<string | Asset>

const metadata = {
  category: 'appearance' as const,
  priority: ModifierPriority.APPEARANCE,
  signature: '(color: string | Asset | Signal<string | Asset>) => Modifier',
  description: 'Sets the foreground (text) color for a component.',
}

const foregroundColorFactory = (color: ForegroundInput): Modifier => {
  return new AppearanceModifier({ foregroundColor: color as any })
}

export function foregroundColor(color: ForegroundInput): Modifier {
  return foregroundColorFactory(color)
}

export function registerForegroundColorModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata(
    'foregroundColor',
    foregroundColorFactory,
    metadata,
    registry,
    plugin,
  )
}
