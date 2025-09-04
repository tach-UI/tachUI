/**
 * @tachui/mobile Plugin
 *
 * Mobile-optimized UI components:
 * - ActionSheet: Mobile action selection pattern
 * - Alert: Modal dialogs with backdrop and animations
 * - ScrollView: Enhanced scrolling with pull-to-refresh, touch gestures, and mobile optimizations
 *
 * Bundle size: ~65KB (includes ScrollView)
 * Use cases: Mobile apps, responsive design, touch interfaces, scrollable content
 */

// Mobile UI patterns
export {
  ActionSheet,
  ActionSheetStyles,
  ActionSheetUtils,
  type ActionSheetProps,
  type ActionSheetButton,
  type ActionSheetButtonRole,
  type ActionSheetPresentationStyle,
  type ActionSheetTheme,
} from './ActionSheet'

export {
  Alert,
  AlertStyles,
  AlertUtils,
  defaultAlertTheme,
  type AlertProps,
  type AlertButton,
  type AlertTheme,
} from './Alert'

export {
  ScrollView,
  EnhancedScrollView,
  ScrollViewUtils,
  type ScrollViewProps,
  type ScrollDirection,
  type ScrollBehavior,
  type ContentOffset,
  type ScrollEdges,
  type ScrollEventInfo,
  type PullToRefreshState,
} from './ScrollView'

// Mobile modifiers
export * from './modifiers'

// Plugin metadata
export const PLUGIN_NAME = '@tachui/mobile'
export const PLUGIN_VERSION = '0.1.0'
export const PLUGIN_DESCRIPTION =
  'Mobile UI components - ActionSheet, Alert, ScrollView with mobile optimizations'
export const BUNDLE_SIZE_TARGET = '~65KB'

// Component registry (static exports - no dynamic loading to avoid duplication)
export const COMPONENTS = {
  ActionSheet: 'ActionSheet',
  Alert: 'Alert',
  ScrollView: 'ScrollView',
} as const

export type MobilePatternsComponent = keyof typeof COMPONENTS

/**
 * Note: Dynamic imports removed to prevent bundle duplication warnings.
 * Components are available as static exports for better tree-shaking.
 *
 * If dynamic loading is needed, import components individually:
 * const { ActionSheet } = await import('@tachui/mobile-patterns/ActionSheet')
 */
