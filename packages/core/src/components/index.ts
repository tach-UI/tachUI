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
// Grid Layout System - Temporarily commented out to avoid circular dependency
// TODO: Re-enable once circular dependency is resolved
// export type {
//   BaseGridProps,
//   GridAlignment,
//   GridItemConfig,
//   GridProps,
//   GridRowProps,
//   LazyHGridProps,
//   LazyVGridProps,
//   ResponsiveGridItemConfig,
//   GridSpanConfig
// } from '@tachui/grid'
// export {
//   BaseGridComponent,
//   EnhancedGrid,
//   EnhancedGridRow,
//   EnhancedLazyHGrid,
//   EnhancedLazyVGrid,
//   Grid,
//   GridCSSGenerator,
//   GridItem,
//   GridRow,
//   LazyHGrid,
//   LazyVGrid,
// } from '@tachui/grid'

// DatePicker component has been moved to @tachui/forms
// Import it from @tachui/forms instead of @tachui/core
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
// ScrollView moved to @tachui/mobile
// Import ScrollView from @tachui/mobile instead of @tachui/core
// Section component moved to @tachui/data
// Import from @tachui/data instead of core
// Show, When, Unless moved to @tachui/flow-control

// Slider component has been moved to @tachui/forms
// Import it from @tachui/forms instead of @tachui/core
// Spacer moved to @tachui/primitives
// Stepper component has been moved to @tachui/forms
// Import it from @tachui/forms instead of @tachui/core

export type { WrapperOptions } from './wrapper'
// Component wrapper system
export {
  createModifiableComponentFactory,
  createReactiveWrapper,
  withModifierSupport,
  withModifiers,
  wrapComponent,
} from './wrapper'
