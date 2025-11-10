/**
 * Mobile Modifiers
 *
 * Modifiers for mobile-specific functionality including
 * touch gestures, pull-to-refresh, and mobile interactions.
 */

import { registerModifierWithMetadata } from '@tachui/core/modifiers'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { TACHUI_PACKAGE_VERSION } from '../version'
import { refreshable } from './gestures'

export { refreshable } from './gestures'
export type { RefreshableOptions } from './types'

const MOBILE_PLUGIN_INFO: PluginInfo = {
  name: '@tachui/mobile',
  version: TACHUI_PACKAGE_VERSION,
  author: 'TachUI Team',
  verified: true,
}

const refreshableMetadata = {
  category: 'interaction' as const,
  priority: 120,
  signature: '(options: RefreshableOptions) => Modifier',
  description:
    'Adds pull-to-refresh gesture support with built-in loading indicator management.',
}

let mobileRegistered = false

export interface RegisterMobileModifiersOptions {
  registry?: ModifierRegistry
  plugin?: PluginInfo
  force?: boolean
}

export function registerMobileModifiers(
  options?: RegisterMobileModifiersOptions,
): void {
  const targetRegistry = options?.registry
  const targetPlugin = options?.plugin ?? MOBILE_PLUGIN_INFO
  const shouldForce = options?.force === true
  const isCustomTarget = Boolean(targetRegistry || options?.plugin)

  if (!isCustomTarget && mobileRegistered && !shouldForce) {
    return
  }

  registerModifierWithMetadata(
    'refreshable',
    refreshable,
    refreshableMetadata,
    targetRegistry,
    targetPlugin,
  )

  if (!isCustomTarget) {
    mobileRegistered = true
  }
}

registerMobileModifiers()

if (typeof import.meta !== 'undefined' && (import.meta as any).hot) {
  ;(import.meta as any).hot.accept(() => {
    registerMobileModifiers({ force: true })
  })
}
