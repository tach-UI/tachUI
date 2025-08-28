/**
 * @tachui/mobile-patterns Plugin
 * 
 * Mobile-first UI patterns and components:
 * - ActionSheet: Mobile action selection pattern
 * - Alert: Modal dialogs with backdrop and animations
 * - Mobile navigation patterns
 * 
 * Bundle size: ~45KB
 * Use cases: Mobile apps, responsive design, touch interfaces
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

// Plugin metadata
export const PLUGIN_NAME = '@tachui/mobile-patterns'
export const PLUGIN_VERSION = '0.1.0'
export const PLUGIN_DESCRIPTION = 'Mobile UI patterns - ActionSheet, Alert, navigation'
export const BUNDLE_SIZE_TARGET = '~45KB'

// Component registry (static exports - no dynamic loading to avoid duplication)
export const COMPONENTS = {
  ActionSheet: 'ActionSheet',
  Alert: 'Alert',
} as const

export type MobilePatternsComponent = keyof typeof COMPONENTS

/**
 * Note: Dynamic imports removed to prevent bundle duplication warnings.
 * Components are available as static exports for better tree-shaking.
 * 
 * If dynamic loading is needed, import components individually:
 * const { ActionSheet } = await import('@tachui/mobile-patterns/ActionSheet')
 */