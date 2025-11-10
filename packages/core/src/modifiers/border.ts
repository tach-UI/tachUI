import type { Signal } from '../reactive/types'
import type { Asset } from '../assets/Asset'
import { AppearanceModifier } from './base'
import { ModifierPriority } from './types'
import type { AppearanceModifierProps, Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

type BorderOptions = AppearanceModifierProps['border']

type BorderWidth = number | Signal<number>

type BorderStyle = NonNullable<BorderOptions>['style']

const metadata = {
  category: 'appearance' as const,
  priority: ModifierPriority.APPEARANCE,
  signature:
    '(widthOrOptions: number | Signal<number> | AppearanceModifierProps["border"], color?: string | Asset, style?: "solid" | "dashed" | "dotted") => Modifier',
  description:
    'Applies a stroke around the component with optional width, color, and style control.',
}

const borderFactory = (
  widthOrOptions: BorderWidth | BorderOptions,
  color?: string | Asset,
  style: BorderStyle = 'solid',
): Modifier => {
  let borderProps: BorderOptions

  if (typeof widthOrOptions === 'object' && widthOrOptions !== null) {
    borderProps = widthOrOptions
  } else {
    borderProps = {
      width: widthOrOptions as BorderWidth,
      color,
      style,
    }
  }

  return new AppearanceModifier({ border: borderProps })
}

export function border(
  widthOrOptions: BorderWidth | BorderOptions,
  color?: string | Asset,
  style: BorderStyle = 'solid',
): Modifier {
  return borderFactory(widthOrOptions, color, style)
}

export function registerBorderModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata(
    'border',
    borderFactory,
    metadata,
    registry,
    plugin,
  )
}
