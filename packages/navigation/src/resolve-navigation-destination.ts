import type { ComponentInstance } from '@tachui/core'
import type { NavigationDestination } from './types'

export function resolveNavigationDestination(
  destination: NavigationDestination
): ComponentInstance {
  const resolved =
    typeof destination === 'function' ? destination() : destination

  if (
    resolved &&
    typeof resolved === 'object' &&
    'render' in resolved &&
    typeof (resolved as { render?: unknown }).render === 'function'
  ) {
    return resolved as ComponentInstance
  }

  if (
    resolved &&
    typeof resolved === 'object' &&
    'build' in resolved &&
    typeof (resolved as { build?: () => ComponentInstance }).build === 'function'
  ) {
    return (resolved as { build: () => ComponentInstance }).build()
  }

  return resolved as ComponentInstance
}
