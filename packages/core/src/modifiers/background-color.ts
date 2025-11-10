import type { Signal } from '../reactive/types'
import type { Asset } from '../assets/Asset'
import { AppearanceModifier } from './base'
import { ModifierPriority } from './types'
import type { Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

type BackgroundColorInput = string | Asset | Signal<string | Asset>

const metadata = {
  category: 'appearance' as const,
  priority: ModifierPriority.APPEARANCE,
  signature: '(color: string | Asset | Signal<string | Asset>) => Modifier',
  description: 'Sets the background color for a component.',
}

const backgroundColorFactory = (color: BackgroundColorInput): Modifier => {
  return new AppearanceModifier({ backgroundColor: color as any })
}

export function backgroundColor(color: BackgroundColorInput): Modifier {
  return backgroundColorFactory(color)
}

export function registerBackgroundColorModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata(
    'backgroundColor',
    backgroundColorFactory,
    metadata,
    registry,
    plugin,
  )
}
