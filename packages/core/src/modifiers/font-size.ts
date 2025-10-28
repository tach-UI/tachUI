import type { Signal } from '../reactive/types'
import { AppearanceModifier } from './base'
import { ModifierPriority } from './types'
import type { Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

type FontSizeInput = number | string | Signal<number> | Signal<string>

const metadata = {
  category: 'appearance' as const,
  priority: ModifierPriority.APPEARANCE,
  signature: '(size: number | string | Signal<number | string>) => Modifier',
  description: 'Sets the font size while preserving reactive bindings.',
}

const fontSizeFactory = (size: FontSizeInput): Modifier => {
  return new AppearanceModifier({ font: { size } })
}

export function fontSize(size: FontSizeInput): Modifier {
  return fontSizeFactory(size)
}

export function registerFontSizeModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata(
    'fontSize',
    fontSizeFactory,
    metadata,
    registry,
    plugin,
  )
}
