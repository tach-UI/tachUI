/**
 * TachUI Component System
 *
 * High-level component wrappers and utilities that integrate
 * the modifier system with the runtime system.
 */

// Re-export useful types from other modules
export type { ModifiableComponent, ModifierBuilder } from '../modifiers/types'
export type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '../runtime/types'
// Alert and ActionSheet components have been moved to @tachui/mobile-patterns
// Import them from @tachui/mobile-patterns instead of @tachui/core
// BasicInput moved to @tachui/primitives
// Grid Layout System (Phase 1)
export type {
  BaseGridProps,
  GridAlignment,
  GridItemConfig,
  GridProps,
  GridRowProps,
  LazyHGridProps,
  LazyVGridProps,
  ResponsiveGridItemConfig,
} from './Grid'
export {
  BaseGridComponent,
  EnhancedGrid,
  EnhancedGridRow,
  EnhancedLazyHGrid,
  EnhancedLazyVGrid,
  Grid,
  GridCSSGenerator,
  GridItem,
  GridRow,
  LazyHGrid,
  LazyVGrid,
} from './Grid'
// Button moved to @tachui/primitives
// DatePicker component has been moved to @tachui/advanced-forms
// Import it from @tachui/advanced-forms instead of @tachui/core
// Divider moved to @tachui/primitives
// BasicForm component types (Phase 6.4)
// BasicForm moved to @tachui/primitives
// Image moved to @tachui/primitives
// Link moved to @tachui/primitives

// Data components (List, Menu, Section) moved to @tachui/data
// Import from @tachui/data instead of core for these components

// Menu component moved to @tachui/data
// Import from @tachui/data instead of core
// Picker moved to @tachui/primitives
export type {
  ContentOffset,
  PullToRefreshState,
  ScrollBehavior,
  ScrollDirection,
  ScrollEdges,
  ScrollEventInfo,
  ScrollViewProps,
} from './ScrollView'
export { EnhancedScrollView, ScrollView, ScrollViewUtils } from './ScrollView'
// Section component moved to @tachui/data
// Import from @tachui/data instead of core
// Show, When, Unless moved to @tachui/flow-control

// Slider component has been moved to @tachui/advanced-forms
// Import it from @tachui/advanced-forms instead of @tachui/core
// Spacer moved to @tachui/primitives
// Stepper component has been moved to @tachui/advanced-forms
// Import it from @tachui/advanced-forms instead of @tachui/core
// Text moved to @tachui/primitives
// Toggle moved to @tachui/primitives
export type { WrapperOptions } from './wrapper'
// Component wrapper system
export {
  createModifiableComponentFactory,
  createReactiveWrapper,
  // Layout components (HStack, VStack, ZStack, HTML, H1-H6) moved to @tachui/primitives
  withModifierSupport,
  withModifiers,
  // Removed Text export to avoid conflict - use enhanced Text as primary
  wrapComponent,
  // ZStack moved to @tachui/primitives
} from './wrapper'
