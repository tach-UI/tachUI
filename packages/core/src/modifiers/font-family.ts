import type { Signal } from '../reactive/types'
import type { FontAsset } from '../assets/FontAsset'
import { AppearanceModifier } from './base'
import { ModifierPriority } from './types'
import type { Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

type FontFamilyValue = string | FontAsset | Signal<string | FontAsset>

const metadata = {
  category: 'appearance' as const,
  priority: ModifierPriority.APPEARANCE,
  signature: '(family: string | FontAsset | Signal<string | FontAsset>) => Modifier',
  description: 'Sets the font family on text-based components.',
}

const fontFamilyFactory = (family: FontFamilyValue): Modifier => {
  return new AppearanceModifier({ font: { family } })
}

export function fontFamily(family: FontFamilyValue): Modifier {
  return fontFamilyFactory(family)
}

export function registerFontFamilyModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata(
    'fontFamily',
    fontFamilyFactory,
    metadata,
    registry,
    plugin,
  )
}
