import { AppearanceModifier } from './base'
import { ModifierPriority } from './types'
import type { AppearanceModifierProps, Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

type FontWeightValue = NonNullable<AppearanceModifierProps['font']>['weight']

const metadata = {
  category: 'appearance' as const,
  priority: ModifierPriority.APPEARANCE,
  signature: '(weight: AppearanceModifierProps["font"]["weight"]) => Modifier',
  description: 'Sets the font weight for typographic styling.',
}

const fontWeightFactory = (weight: FontWeightValue): Modifier => {
  return new AppearanceModifier({ font: { weight } })
}

export function fontWeight(weight: FontWeightValue): Modifier {
  return fontWeightFactory(weight)
}

export function registerFontWeightModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata(
    'fontWeight',
    fontWeightFactory,
    metadata,
    registry,
    plugin,
  )
}
