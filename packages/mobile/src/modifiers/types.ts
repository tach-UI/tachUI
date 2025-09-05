/**
 * Mobile Modifier Types
 *
 * TypeScript definitions for mobile-specific modifiers.
 */

import type { Signal } from '@tachui/core'

export interface RefreshableOptions {
  /** Function called when pull-to-refresh is triggered */
  onRefresh: () => Promise<void>
  /** Optional reactive signal for external refresh state management */
  isRefreshing?: boolean | Signal<boolean>
}

export interface MobileGestureOptions {
  refreshable?: RefreshableOptions
}
