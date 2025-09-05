/**
 * Viewport Modifier Types
 *
 * TypeScript definitions for viewport-related modifiers.
 */

export interface ViewportLifecycleOptions {
  /** Handler called when element enters viewport */
  onAppear?: () => void
  /** Handler called when element leaves viewport */
  onDisappear?: () => void
}
