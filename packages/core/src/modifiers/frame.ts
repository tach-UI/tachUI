import type { Dimension } from '../constants/layout'
import { LayoutModifier } from './base'
import { ModifierPriority } from './types'
import type { LayoutModifierProps, Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'

export type FrameOptions = Omit<LayoutModifierProps['frame'], 'width' | 'height'>

const metadata = {
  category: 'layout' as const,
  priority: ModifierPriority.LAYOUT,
  signature:
    '(width?: Dimension, height?: Dimension, options?: FrameOptions) => Modifier',
  description:
    'Constrains a component to the specified width and height with optional min/max constraints.',
}

const frameFactory = (
  width?: Dimension,
  height?: Dimension,
  options?: FrameOptions,
): Modifier => {
  const frameConfig: NonNullable<LayoutModifierProps['frame']> = {
    width,
    height,
  }

  if (options) {
    Object.assign(frameConfig, options)
  }

  return new LayoutModifier({
    frame: frameConfig,
  })
}

export function frame(
  width?: Dimension,
  height?: Dimension,
  options?: FrameOptions,
): Modifier {
  return frameFactory(width, height, options)
}

export function registerFrameModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata('frame', frameFactory, metadata, registry, plugin)
}
