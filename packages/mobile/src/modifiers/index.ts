/**
 * Mobile Modifiers
 *
 * Modifiers for mobile-specific functionality including
 * touch gestures, pull-to-refresh, and mobile interactions.
 */

import { globalModifierRegistry } from '@tachui/registry'
import { refreshable } from './gestures'

export { refreshable } from './gestures'
export type { RefreshableOptions } from './types'

// Registry integration for mobile modifiers
const mobileModifierRegistrations: Array<[string, (...args: any[]) => any]> = [
  ['refreshable', refreshable],
]

// Auto-register mobile modifiers on import
mobileModifierRegistrations.forEach(([name, factory]) => {
  globalModifierRegistry.register(name, factory)
})

if (process.env.NODE_ENV !== 'production') {
  console.info(
    `🔍 [@tachui/mobile] Registered ${mobileModifierRegistrations.length} mobile modifiers with global registry`
  )
}
