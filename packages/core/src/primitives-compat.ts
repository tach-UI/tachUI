/**
 * Backwards compatibility layer for primitives components
 *
 * This file provides re-exports from @tachui/primitives to maintain
 * compatibility during the restructuring process.
 */

// TODO: Once @tachui/primitives is built and published, these will be real imports
// For now, we'll re-export from the existing local files

// Layout components (partial - still in wrapper.ts)
export { VStack, HStack, ZStack } from './components/wrapper'
export { Spacer, type SpacerProps } from './components/Spacer'
export {
  Divider,
  DividerUtils,
  DividerStyles,
  defaultDividerTheme,
  type DividerProps,
  type DividerTheme,
} from './components/Divider'

// Display components
export {
  Text,
  EnhancedText,
  TextFormat,
  TextStyles,
  Typography,
  type TextProps,
  type TextFormatting,
} from './components/Text'
export {
  Image,
  EnhancedImage,
  ImageUtils,
  ImageStates,
  ImageContentModes,
  type ImageProps,
  type ImageContentMode,
  type ImageLoadingState,
  type ImageLoadingStrategy,
  type ImageResizeMode,
} from './components/Image'
export { HTML } from './components/wrapper'

// Control components
export {
  Button,
  EnhancedButton,
  ButtonStyles,
  defaultButtonTheme,
  type ButtonProps,
  type ButtonRole,
  type ButtonSize,
  type ButtonState,
  type ButtonTheme,
  type ButtonVariant,
} from './components/Button'
export {
  Link,
  LinkUtils,
  type EnhancedLinkProps,
  type OpenURLAction,
} from './components/EnhancedLink'
export {
  Toggle,
  EnhancedToggle,
  ToggleStyles,
  ToggleUtils,
  ToggleWithLabel,
  type ToggleProps,
} from './components/Toggle'
export {
  Picker,
  EnhancedPicker,
  PickerStyles,
  PickerUtils,
  type PickerOption,
  type PickerProps,
} from './components/Picker'

// Basic form components
export {
  BasicForm,
  BasicFormImplementation,
  BasicFormStyles,
  BasicFormValidation,
  type BasicFormProps,
  type FormData,
  type ValidationError,
} from './components/Form'
export {
  BasicInput,
  BasicInputStyles,
  BasicInputUtils,
  type BasicInputProps,
  type BasicInputTheme,
  type BasicInputType,
} from './components/BasicInput'

// This file will eventually look like:
// export * from '@tachui/primitives'
