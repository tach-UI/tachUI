/**
 * Lifecycle helper factories for core builder integration.
 */

import { LifecycleModifier } from '@tachui/core/modifiers'
import type { LifecycleModifierProps, Modifier } from '@tachui/core/modifiers/types'

export function task(
  options: NonNullable<LifecycleModifierProps['task']>
): Modifier {
  return new LifecycleModifier({ task: options })
}
