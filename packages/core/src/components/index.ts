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
export type {
  BasicInputProps,
  BasicInputTheme,
  BasicInputType,
} from './BasicInput'
export { BasicInput, BasicInputStyles, BasicInputUtils } from './BasicInput'
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
export type {
  ButtonProps,
  ButtonRole,
  ButtonSize,
  ButtonState,
  ButtonTheme,
  ButtonVariant,
} from './Button'
export {
  Button,
  ButtonStyles,
  defaultButtonTheme,
  EnhancedButton,
} from './Button'
// DatePicker component has been moved to @tachui/advanced-forms
// Import it from @tachui/advanced-forms instead of @tachui/core
export type { DividerProps, DividerTheme } from './Divider'
export {
  Divider,
  DividerStyles,
  DividerUtils,
  defaultDividerTheme,
} from './Divider'
// BasicForm component types (Phase 6.4)
export type { FormData, BasicFormProps, ValidationError } from './Form'
// BasicForm Components (Phase 6.4)
export {
  BasicFormImplementation,
  BasicForm,
  BasicFormStyles,
  BasicFormValidation,
} from './Form'
export type {
  ImageContentMode,
  ImageLoadingState,
  ImageLoadingStrategy,
  ImageProps,
  ImageResizeMode,
} from './Image'
export {
  EnhancedImage,
  Image,
  ImageContentModes,
  ImageStates,
  ImageUtils,
} from './Image'
// Enhanced Link (SwiftUI-compatible API) - Primary Link Component
export type { EnhancedLinkProps, OpenURLAction } from './EnhancedLink'
export { Link, LinkUtils } from './EnhancedLink'
// Flow control components
// ForEach and For components are temporarily commented out due to circular dependency
// TODO: Either implement these in core or restructure to avoid circular dependency
// export {
//   ForEach,
//   ForEachComponent,
//   For,
//   type ForEachProps,
//   type ForProps,
// } from '@tachui/flow-control'

// Data components (List, Menu, Section) moved to @tachui/data
// Import from @tachui/data instead of core for these components

// Menu component moved to @tachui/data
// Import from @tachui/data instead of core
export type { PickerOption, PickerProps } from './Picker'
export { EnhancedPicker, Picker, PickerStyles, PickerUtils } from './Picker'
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
export type { ShowProps } from './Show'
export { Show, Unless, When } from './Show'

// Slider component has been moved to @tachui/advanced-forms
// Import it from @tachui/advanced-forms instead of @tachui/core
export type { SpacerProps } from './Spacer'
export { Spacer } from './Spacer'
// Stepper component has been moved to @tachui/advanced-forms
// Import it from @tachui/advanced-forms instead of @tachui/core
// Enhanced component types
export type { TextFormatting, TextProps } from './Text'
// Enhanced SwiftUI Components (Primary Exports)
export {
  Text, // Enhanced Text is now the primary Text export
  TextFormat,
  TextStyles,
  Typography,
} from './Text'
export type { ToggleProps } from './Toggle'
export {
  EnhancedToggle,
  Toggle,
  ToggleStyles,
  ToggleUtils,
  ToggleWithLabel,
} from './Toggle'
export type { WrapperOptions } from './wrapper'
// Component wrapper system
export {
  createModifiableComponentFactory,
  createReactiveWrapper,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  HStack,
  HTML, // Simple HTML element wrappers
  Layout,
  VStack,
  withModifierSupport,
  withModifiers,
  // Removed Text export to avoid conflict - use enhanced Text as primary
  wrapComponent,
  ZStack, // SwiftUI-aligned direct exports
} from './wrapper'
