# BasicInput

A lightweight text input component for TachUI Core applications. BasicInput provides SwiftUI-style reactive binding without the complexity of the Forms plugin validation and formatting system.

## Overview

BasicInput is designed for applications that need simple text input functionality without requiring the full Forms plugin. It supports reactive signals, multiple input types, event handling, and full integration with the TachUI modifier system.

## Basic Usage

```typescript
import { BasicInput, createSignal } from '@tachui/core'

// Create reactive text state
const [text, setText] = createSignal('')

// Create basic input
const input = BasicInput({
  text,
  setText,
  placeholder: 'Enter your text...'
})
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `text` | `Signal<string>` | Reactive signal containing the current text value |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `setText` | `(value: string) => void` | - | Function to update the text signal |
| `placeholder` | `string \| Signal<string>` | `''` | Placeholder text (can be reactive) |
| `inputType` | `BasicInputType \| Signal<BasicInputType>` | `'text'` | HTML input type (can be reactive) |
| `disabled` | `boolean \| Signal<boolean>` | `false` | Whether the input is disabled (can be reactive) |
| `readonly` | `boolean \| Signal<boolean>` | `false` | Whether the input is read-only |
| `onChange` | `(text: string) => void` | - | Called when text changes |
| `onSubmit` | `(text: string) => void` | - | Called when Enter key is pressed |
| `onFocus` | `() => void` | - | Called when input gains focus |
| `onBlur` | `() => void` | - | Called when input loses focus |
| `accessibilityLabel` | `string` | - | Accessibility label for screen readers |
| `accessibilityHint` | `string` | - | Accessibility hint for additional context |

### Input Types

BasicInput supports the following input types:

- `'text'` - Standard text input
- `'email'` - Email address input with validation
- `'password'` - Password input (masked text)
- `'search'` - Search input with search styling
- `'tel'` - Telephone number input
- `'url'` - URL input with validation

## Examples

### Text Input with Validation

```typescript
const [username, setUsername] = createSignal('')
const [isValid, setIsValid] = createSignal(false)

const usernameInput = BasicInput({
  text: username,
  setText: setUsername,
  placeholder: 'Enter username',
  onChange: (value) => {
    setIsValid(value.length >= 3)
  },
  onSubmit: (value) => {
    if (value.length >= 3) {
      handleLogin(value)
    }
  }
})
```

### Reactive Properties

```typescript
const [email, setEmail] = createSignal('')
const [placeholder, setPlaceholder] = createSignal('Email address')
const [isDisabled, setIsDisabled] = createSignal(false)

const emailInput = BasicInput({
  text: email,
  setText: setEmail,
  placeholder, // Reactive placeholder
  inputType: 'email',
  disabled: isDisabled, // Reactive disabled state
  onChange: (value) => validateEmail(value)
})
```

### Search Input

```typescript
const [query, setQuery] = createSignal('')

const searchInput = BasicInput({
  text: query,
  setText: setQuery,
  inputType: 'search',
  placeholder: 'Search...',
  onSubmit: (searchQuery) => {
    performSearch(searchQuery)
  }
})
```

### Password Input

```typescript
const [password, setPassword] = createSignal('')

const passwordInput = BasicInput({
  text: password,
  setText: setPassword,
  inputType: 'password',
  placeholder: 'Enter password',
  onChange: (value) => {
    checkPasswordStrength(value)
  }
})
```

## Utility Functions

BasicInput provides utility functions for common input patterns:

### BasicInputUtils.search()

```typescript
const [searchText, setSearchText] = createSignal('')

const searchProps = BasicInputUtils.search(
  searchText,
  setSearchText,
  (query) => handleSearch(query) // Optional onSubmit handler
)

const searchInput = BasicInput(searchProps)
```

### BasicInputUtils.email()

```typescript
const [emailText, setEmailText] = createSignal('')

const emailProps = BasicInputUtils.email(emailText, setEmailText)
const emailInput = BasicInput(emailProps)
```

### BasicInputUtils.password()

```typescript
const [passwordText, setPasswordText] = createSignal('')

const passwordProps = BasicInputUtils.password(passwordText, setPasswordText)
const passwordInput = BasicInput(passwordProps)
```

### BasicInputUtils.phone()

```typescript
const [phoneText, setPhoneText] = createSignal('')

const phoneProps = BasicInputUtils.phone(phoneText, setPhoneText)
const phoneInput = BasicInput(phoneProps)
```

## Styling and Theming

BasicInput supports custom themes through the `BasicInputStyles` object:

### Default Theme

```typescript
import { BasicInputStyles } from '@tachui/core'

console.log(BasicInputStyles.theme)
// {
//   colors: {
//     background: '#FFFFFF',
//     border: '#D1D1D6',
//     text: '#000000',
//     placeholder: '#8E8E93',
//     focusBorder: '#007AFF',
//     disabledBackground: '#F2F2F7',
//     disabledText: '#8E8E93'
//   },
//   spacing: {
//     padding: 8,
//     borderWidth: 1
//   },
//   borderRadius: 4,
//   fontSize: 16,
//   fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//   transition: 'border-color 0.2s ease, background-color 0.2s ease'
// }
```

### Custom Theme

```typescript
const customTheme = BasicInputStyles.createTheme({
  colors: {
    background: '#2D2D2D',
    border: '#404040',
    text: '#FFFFFF',
    placeholder: '#888888',
    focusBorder: '#00D4AA',
    disabledBackground: '#1A1A1A',
    disabledText: '#666666'
  },
  borderRadius: 8,
  fontSize: 18
})
```

## Modifier System Integration

BasicInput fully supports the TachUI modifier system:

```typescript
const styledInput = BasicInput({ text, setText })
  .modifier
  .padding(16)
  .margin(8)
  .background('#F0F0F0')
  .borderRadius(12)
  .width('300px')
  .build()
```

### Common Modifier Patterns

```typescript
// Rounded input with shadow
const roundedInput = BasicInput({ text, setText })
  .modifier
  .borderRadius(20)
  .padding(12, 16)
  .boxShadow('0 2px 4px rgba(0,0,0,0.1)')
  .build()

// Full-width input with custom styling
const fullWidthInput = BasicInput({ text, setText })
  .modifier
  .width('100%')
  .fontSize(18)
  .padding(14)
  .border('2px solid #E0E0E0')
  .build()

// Compact input with minimal styling
const compactInput = BasicInput({ text, setText })
  .modifier
  .fontSize(14)
  .padding(8, 10)
  .height(32)
  .build()
```

## Event Handling

BasicInput provides comprehensive event handling:

### Input Change Events

```typescript
const input = BasicInput({
  text,
  setText,
  onChange: (newValue) => {
    console.log('Text changed:', newValue)
    // Perform validation, filtering, etc.
  }
})
```

### Submit Events (Enter Key)

```typescript
const input = BasicInput({
  text,
  setText,
  onSubmit: (finalValue) => {
    console.log('Form submitted with:', finalValue)
    // Handle form submission
  }
})
```

### Focus and Blur Events

```typescript
const input = BasicInput({
  text,
  setText,
  onFocus: () => {
    console.log('Input focused')
    // Show validation messages, expand UI, etc.
  },
  onBlur: () => {
    console.log('Input blurred')
    // Hide validation messages, save draft, etc.
  }
})
```

## Accessibility

BasicInput includes built-in accessibility features:

### Screen Reader Support

```typescript
const accessibleInput = BasicInput({
  text,
  setText,
  accessibilityLabel: 'Username',
  accessibilityHint: 'Enter your username to log in',
  placeholder: 'Username'
})
```

### Keyboard Navigation

- **Tab**: Focus the input
- **Enter**: Trigger `onSubmit` callback
- **Escape**: Blur the input (if focused)

## Reactive Patterns

BasicInput is designed to work seamlessly with TachUI's reactive system:

### Computed Properties

```typescript
const [firstName, setFirstName] = createSignal('')
const [lastName, setLastName] = createSignal('')

const fullName = createComputed(() => 
  `${firstName()} ${lastName()}`.trim()
)

const firstNameInput = BasicInput({
  text: firstName,
  setText: setFirstName,
  placeholder: 'First name'
})

const lastNameInput = BasicInput({
  text: lastName,
  setText: setLastName,
  placeholder: 'Last name'
})
```

### Conditional Rendering

```typescript
const [showAdvanced, setShowAdvanced] = createSignal(false)
const [advancedValue, setAdvancedValue] = createSignal('')

const advancedInput = Show({
  when: showAdvanced,
  children: () => BasicInput({
    text: advancedValue,
    setText: setAdvancedValue,
    placeholder: 'Advanced options...'
  })
})
```

## Best Practices

### 1. Always Provide Both Getter and Setter

```typescript
// ✅ Correct - provides both getter and setter
const [text, setText] = createSignal('')
const input = BasicInput({ text, setText })

// ❌ Incorrect - missing setter, input won't update signal
const input = BasicInput({ text })
```

### 2. Use Appropriate Input Types

```typescript
// ✅ Use semantic input types
const emailInput = BasicInput({ 
  text, setText, 
  inputType: 'email' // Enables email validation and keyboard
})

const phoneInput = BasicInput({ 
  text, setText, 
  inputType: 'tel' // Shows numeric keyboard on mobile
})
```

### 3. Handle Validation Appropriately

```typescript
// ✅ Validate on change for immediate feedback
const input = BasicInput({
  text,
  setText,
  onChange: (value) => {
    // Real-time validation
    setIsValid(validateInput(value))
  },
  onSubmit: (value) => {
    // Final validation before submission
    if (validateInput(value)) {
      handleSubmit(value)
    }
  }
})
```

### 4. Use Accessibility Features

```typescript
// ✅ Provide accessibility information
const input = BasicInput({
  text,
  setText,
  accessibilityLabel: 'Email address',
  accessibilityHint: 'We\'ll use this to send you updates',
  placeholder: 'you@example.com'
})
```

## Comparison with Forms TextField

| Feature | BasicInput | Forms TextField |
|---------|------------|----------------|
| **Dependencies** | Core only | Core + Forms plugin |
| **Validation** | Manual via callbacks | Built-in validators |
| **Formatting** | Manual | Built-in formatters/parsers |
| **Form Integration** | Manual | Automatic with Form context |
| **File Size** | Smaller | Larger |
| **Complexity** | Simple | Feature-rich |
| **Use Case** | Simple inputs | Complex forms |

## Migration from TextField

If you're migrating from Forms TextField to BasicInput:

```typescript
// Before (Forms TextField)
const textField = TextField({
  name: 'username',
  value: username(),
  onChange: setUsername,
  placeholder: 'Username'
})

// After (BasicInput)
const basicInput = BasicInput({
  text: username,
  setText: setUsername,
  placeholder: 'Username'
})
```

## API Reference

### Types

```typescript
type BasicInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'

interface BasicInputProps extends ComponentProps {
  text: Signal<string>
  setText?: (value: string) => void
  placeholder?: string | Signal<string>
  inputType?: BasicInputType | Signal<BasicInputType>
  disabled?: boolean | Signal<boolean>
  readonly?: boolean | Signal<boolean>
  onChange?: (text: string) => void
  onSubmit?: (text: string) => void
  onFocus?: () => void
  onBlur?: () => void
  accessibilityLabel?: string
  accessibilityHint?: string
}

interface BasicInputTheme {
  colors: {
    background: string
    border: string
    text: string
    placeholder: string
    focusBorder: string
    disabledBackground: string
    disabledText: string
  }
  spacing: {
    padding: number
    borderWidth: number
  }
  borderRadius: number
  fontSize: number
  fontFamily: string
  transition: string
}
```

### Functions

```typescript
// Component factory
function BasicInput(props: BasicInputProps): ModifiableComponent<BasicInputProps>

// Utility functions
BasicInputUtils.search(text: Signal<string>, setText: (value: string) => void, onSearch?: (query: string) => void): BasicInputProps
BasicInputUtils.email(text: Signal<string>, setText: (value: string) => void): BasicInputProps
BasicInputUtils.password(text: Signal<string>, setText: (value: string) => void): BasicInputProps
BasicInputUtils.phone(text: Signal<string>, setText: (value: string) => void): BasicInputProps

// Styling
BasicInputStyles.theme: BasicInputTheme
BasicInputStyles.createTheme(overrides: Partial<BasicInputTheme>): BasicInputTheme
```

## Examples Repository

Find more examples and use cases in the [TachUI Examples Repository](../examples/component-examples.md#basicinput).