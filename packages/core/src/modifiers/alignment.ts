import { LayoutModifier } from './base'
import { ModifierPriority } from './types'
import type { LayoutModifierProps, Modifier } from './types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from './registration-utils'
import { coreModifierSignatures } from './signatures.generated'

const metadata = {
  category: 'layout' as const,
  priority: ModifierPriority.LAYOUT,
  signature: coreModifierSignatures.alignment,
  description: 'Sets the alignment hint for stack and container layouts.',
}

const alignmentFactory = (
  value: NonNullable<LayoutModifierProps['alignment']>,
): Modifier => {
  return new LayoutModifier({ alignment: value })
}

export function alignment(
  value: NonNullable<LayoutModifierProps['alignment']>,
): Modifier {
  return alignmentFactory(value)
}

export function registerAlignmentModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  registerModifierWithMetadata(
    'alignment',
    alignmentFactory,
    metadata,
    registry,
    plugin,
  )
}
