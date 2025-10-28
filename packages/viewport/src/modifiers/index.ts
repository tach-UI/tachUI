/**
 * Viewport Modifiers
 *
 * Modifiers for viewport-related functionality including
 * visibility detection and responsive behavior.
 */

import { registerModifierWithMetadata } from '@tachui/core/modifiers'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { TACHUI_PACKAGE_VERSION } from '../version'
import { onAppear, onDisappear } from './lifecycle'

export { onAppear, onDisappear } from './lifecycle'
export type { ViewportLifecycleOptions } from './types'

const VIEWPORT_PLUGIN_INFO: PluginInfo = {
  name: '@tachui/viewport',
  version: TACHUI_PACKAGE_VERSION,
  author: 'TachUI Team',
  verified: true,
}

const lifecycleMetadata = {
  category: 'interaction' as const,
  priority: 110,
  signature: '(handler: () => void) => Modifier',
  description:
    'Triggers handlers when an element appears in or disappears from the viewport.',
}

let viewportRegistered = false

export interface RegisterViewportModifiersOptions {
  registry?: ModifierRegistry
  plugin?: PluginInfo
  force?: boolean
}

export function registerViewportModifiers(
  options?: RegisterViewportModifiersOptions,
): void {
  const targetRegistry = options?.registry
  const targetPlugin = options?.plugin ?? VIEWPORT_PLUGIN_INFO
  const shouldForce = options?.force === true
  const isCustomTarget = Boolean(targetRegistry || options?.plugin)

  if (!isCustomTarget && viewportRegistered && !shouldForce) {
    return
  }

  registerModifierWithMetadata(
    'onAppear',
    onAppear,
    {
      ...lifecycleMetadata,
      description:
        'Executes a callback when the component enters the viewport.',
    },
    targetRegistry,
    targetPlugin,
  )

  registerModifierWithMetadata(
    'onDisappear',
    onDisappear,
    {
      ...lifecycleMetadata,
      description:
        'Executes a callback when the component leaves the viewport.',
    },
    targetRegistry,
    targetPlugin,
  )

  if (!isCustomTarget) {
    viewportRegistered = true
  }
}

registerViewportModifiers()

if (typeof import.meta !== 'undefined' && (import.meta as any).hot) {
  ;(import.meta as any).hot.accept(() => {
    registerViewportModifiers({ force: true })
  })
}
