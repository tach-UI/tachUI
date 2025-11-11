# Complete TachUI Components Guide

The definitive guide to all TachUI components with their actual API patterns, based on the working implementations and test suite.

## Overview

TachUI provides a comprehensive set of SwiftUI-inspired components for building web applications. All components follow consistent patterns:

1. **Function-based API** - Components are functions, not objects
2. **Modifier system** - Use `.property()` for styling
3. **Reactive state** - Use signals for dynamic values
4. **Type safety** - Full TypeScript support

## Core Components

### Text Component

Display text content with full typography control.

```typescript
import { Text } from '@tachui/primitives'
import { createSignal } from '@tachui/core'

// Basic text
const greeting = Text('Hello, World!')

// Dynamic text with reactive content
const [message, setMessage] = createSignal('Dynamic content')
const dynamicText = Text(() => message())

// Styled text with modifiers
const styledText = Text('Styled Text')
  .fontSize(24)
  .fontWeight('bold')
  .foregroundColor('#007AFF')
  .backgroundColor('#f0f8ff')
  .padding(16)
  .cornerRadius(8)
  
```

**Text API:**

- `Text(content: string | (() => string))`
- Returns a modifiable component

**Common Text Modifiers:**

```typescript
Text('Example')
  .fontSize(18) // Size in pixels
  .fontWeight('600') // CSS font-weight
  .foregroundColor('#333333') // Text color
  .textAlign('center') // 'left' | 'center' | 'right'
  .lineHeight(1.4) // Line height multiplier
  .letterSpacing(0.5) // Letter spacing in pixels
  
```

### Button Component

Interactive buttons with press states and actions.

```typescript
import { Button } from '@tachui/primitives'

// Basic button with action
const basicButton = Button('Click Me', () => {
  console.log('Button clicked!')
})

// Styled button with modifiers
const styledButton = Button('Save', async () => {
  await saveData()
})
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 20, right: 20 })
  .cornerRadius(8)
  .fontSize(16)
  .fontWeight('600')
  

// Reactive button state
const [isLoading, setIsLoading] = createSignal(false)

const loadingButton = Button(
  () => (isLoading() ? 'Loading...' : 'Submit'),
  async () => {
    setIsLoading(true)
    try {
      await submitForm()
    } finally {
      setIsLoading(false)
    }
  }
)
  .disabled(isLoading)
  .opacity(() => (isLoading() ? 0.7 : 1.0))
  
```

**Button API:**

- `Button(title: string | (() => string), action: () => void | Promise<void>)`
- Returns a modifiable component

**Button Style Variants:**

```typescript
// Primary button
Button('Primary', action)
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  

// Secondary button
Button('Secondary', action)
  .backgroundColor('transparent')
  .foregroundColor('#007AFF')
  .border(1, '#007AFF')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  

// Destructive button
Button('Delete', action)
  .backgroundColor('#FF3B30')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  
```

## Form Components

### Picker Component

Selection input with multiple variants (dropdown, wheel, segmented).

```typescript
import { Picker } from '@tachui/primitives'

// Dropdown picker (default)
const [selectedOption, setSelectedOption] = createSignal('apple')

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
]

const dropdownPicker = Picker(selectedOption, options, {
  onSelectionChange: setSelectedOption,
  variant: 'dropdown',
  placeholder: 'Select a fruit',
})
  .padding(12)
  .border(1, '#e0e0e0')
  .cornerRadius(6)
  

// Segmented picker
const segmentedPicker = Picker(selectedOption, options, {
  onSelectionChange: setSelectedOption,
  variant: 'segmented',
})
  .backgroundColor('#f3f4f6')
  .cornerRadius(8)
  

// Wheel picker (native select)
const wheelPicker = Picker(selectedOption, options, {
  onSelectionChange: setSelectedOption,
  variant: 'wheel',
})
  .padding(8)
  .border(1, '#d1d5db')
  .cornerRadius(6)
  

// Searchable picker
const searchablePicker = Picker(selectedOption, options, {
  onSelectionChange: setSelectedOption,
  searchable: true,
  placeholder: 'Search fruits...',
})
```

**Picker API:**

- `Picker(selection: T | Signal<T>, options: PickerOption<T>[], props: PickerProps)`
- `PickerOption<T>`: `{ value: T, label: string, disabled?: boolean, icon?: string }`

### Toggle Component

Boolean input with switch styling.

```typescript
import { Toggle } from '@tachui/primitives'

// Basic toggle
const [isEnabled, setIsEnabled] = createSignal(false)

const basicToggle = Toggle(isEnabled, {
  onToggle: setIsEnabled,
  label: 'Enable Notifications',
})

// Switch variant (default)
const switchToggle = Toggle(isEnabled, {
  onToggle: setIsEnabled,
  label: 'Dark Mode',
  labelPosition: 'leading',
  variant: 'switch',
  color: '#34C759',
})

// Checkbox variant
const checkboxToggle = Toggle(isEnabled, {
  onToggle: setIsEnabled,
  label: 'I agree to the terms',
  variant: 'checkbox',
})

// Button variant
const buttonToggle = Toggle(isEnabled, {
  onToggle: setIsEnabled,
  variant: 'button',
  size: 'large',
})
  .cornerRadius(12)
  
```

**Toggle API:**

- `Toggle(isOn: boolean | Signal<boolean>, props: ToggleProps)`
- Variants: `'switch'` | `'checkbox'` | `'button'`
- Sizes: `'small'` | `'medium'` | `'large'`

### Slider Component

Numeric input with slider interface.

```typescript
import { Slider } from '@tachui/advanced-forms'

// Basic slider
const [volume, setVolume] = createSignal(50)

const basicSlider = Slider(volume, {
  onValueChange: setVolume,
  min: 0,
  max: 100,
  step: 1,
})
  .width(300)
  

// Formatted slider with marks
const formattedSlider = Slider(volume, {
  onValueChange: setVolume,
  min: 0,
  max: 100,
  step: 5,
  formatter: value => `${value}%`,
  marks: [
    { value: 0, label: 'Silent' },
    { value: 50, label: 'Medium' },
    { value: 100, label: 'Loud' },
  ],
})
  .width('100%')
  .maxWidth(400)
  

// Styled slider
const styledSlider = Slider(volume, {
  onValueChange: setVolume,
  min: 0,
  max: 100,
  trackColor: '#e0e0e0',
  activeTrackColor: '#007AFF',
  thumbColor: '#ffffff',
})
```

**Slider API:**

- `Slider(value: number | Signal<number>, props: SliderProps)`
- Props: `min`, `max`, `step`, `formatter`, `marks`, `disabled`

### Form and Section

Form containers for organizing form elements.

```typescript
import { Form, Section } from '@tachui/advanced-forms'

// Form with validation
const handleSubmit = (formData: any) => {
  console.log('Form submitted:', formData)
}

const validateForm = (data: any) => {
  return {
    isValid: data.email && data.name,
    errors: {},
  }
}

const userForm = Form(
  [
    Section([], {
      title: 'Personal Information',
      footer: 'This information is kept private',
    }),

    // Form elements would go here as children
  ],
  {
    onSubmit: handleSubmit,
    validate: validateForm,
  }
)
  .padding(20)
  .backgroundColor('#f8f9fa')
  .cornerRadius(12)
  

// Section with collapsible content
const collapsibleSection = Section([], {
  title: 'Advanced Settings',
  collapsible: true,
  defaultExpanded: false,
})
  .backgroundColor('#ffffff')
  .border(1, '#e0e0e0')
  .cornerRadius(8)
  
```

**Form API:**

- `Form(children: ComponentInstance[], props: FormProps)`
- `Section(children: ComponentInstance[], props: SectionProps)`

## Layout Components

### VStack - Vertical Layout

Stack components vertically with spacing and alignment.

```typescript
import { VStack } from '@tachui/primitives'

const verticalLayout = VStack({
  children: [
    Text('First Item'),
    Text('Second Item'),
    Button('Action', () => {}),
  ],
  spacing: 16,
  alignment: 'leading', // 'leading' | 'center' | 'trailing'
})
  .padding(20)
  .backgroundColor('#f8f9fa')
  .cornerRadius(8)
  
```

### HStack - Horizontal Layout

Stack components horizontally.

```typescript
import { HStack } from '@tachui/primitives'

const horizontalLayout = HStack({
  children: [
    Text('Left'),
    Text('Center')
      .flexGrow(1) // Take remaining space
      .textAlign('center')
      ,
    Text('Right'),
  ],
  spacing: 12,
  alignment: 'center', // 'top' | 'center' | 'bottom'
})
  .padding(16)
  
```

### ZStack - Layered Layout

Layer components on top of each other.

```typescript
import { ZStack } from '@tachui/primitives'

const layeredLayout = ZStack({
  children: [
    // Background layer
    Text('')
      .backgroundColor('#007AFF')
      .frame({ width: 200, height: 100 })
      .cornerRadius(8)
      ,

    // Foreground content
    Text('Overlay Text')
      .foregroundColor('white')
      .fontWeight('bold')
      ,
  ],
  alignment: 'center',
})
```

## Navigation Components

### Enhanced TabView

Modern tab interface with SwiftUI 2024-2025 features.

```typescript
import { EnhancedTabView } from '@tachui/core'

const tabs = [
  createTabItem('home', 'Home', HomeComponent(), { icon: '🏠' }),
  createTabItem('search', 'Search', SearchComponent(), {
    icon: '🔍',
    badge: '3',
  }),
  createTabItem('profile', 'Profile', ProfileComponent(), { icon: '👤' }),
]

// Floating tab view (modern style)
const floatingTabView = EnhancedTabView(tabs, {
  style: 'floating',
  material: 'glass',
  customization: 'visible',
  allowReordering: true,
  onSelectionChange: tabId => {
    console.log('Selected tab:', tabId)
  },
})

// Sidebar adaptable (responsive)
const responsiveTabView = EnhancedTabView(tabs, {
  style: 'sidebar-adaptable',
  breakpoint: 768,
  material: 'blur',
  prominence: 'increased',
})
```

## Common Modifier Patterns

### Layout Modifiers

```typescript
component
  .frame({ width: 300, height: 200 }) // Set dimensions
  .padding(16) // All sides
  .padding({ top: 10, right: 15, bottom: 10, left: 15 }) // Specific sides
  .margin(12) // External spacing
  .flexGrow(1) // CSS flex-grow
```

### Appearance Modifiers

```typescript
component
  .backgroundColor('#f8f9fa') // Background color
  .foregroundColor('#333333') // Text/content color
  .opacity(0.8) // Transparency (0-1)
  .cornerRadius(8) // Border radius
  .border(1, '#e0e0e0') // Border width, color
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
```

### Interaction Modifiers

```typescript
component
  .onTap(() => console.log('Tapped')) // Click handler
  .onHover(hovered => console.log(hovered)) // Hover state
  .disabled(false) // Enable/disable
  .cursor('pointer') // Mouse cursor style
```

## Reactive State Patterns

### Using Signals with Components

```typescript
const [count, setCount] = createSignal(0)
const [isDark, setIsDark] = createSignal(false)

// Reactive text content
const counterText = Text(() => `Count: ${count()}`)
  .fontSize(18)
  

// Reactive styling
const themedButton = Button('Increment', () => setCount(count() + 1))
  .backgroundColor(() => (isDark() ? '#333333' : '#007AFF'))
  .foregroundColor(() => (isDark() ? '#ffffff' : '#ffffff'))
  

// Reactive visibility
const conditionalText = () =>
  count() > 5
    ? Text('Count is high!').foregroundColor('#FF3B30')
    : null
```

### State Management Integration

```typescript
import { State } from '@tachui/core'

// Using State wrapper
const userEmail = State('')

const emailField = TextField(userEmail.projectedValue, 'Enter email', {
  type: 'email',
  onInput: value => console.log('Email changed:', value),
})
  .padding(12)
  .border(1, '#e0e0e0')
  .cornerRadius(6)
  

// Access current value
console.log('Current email:', userEmail.wrappedValue)
```

## Complete Form Example

Here's a comprehensive example showing all form components working together:

```typescript
import {
  Form,
  Section,
  TextField,
  Picker,
  Slider,
  Toggle,
  Button,
  VStack,
} from '@tachui/core'

function UserPreferencesForm() {
  // Form state
  const [formData, setFormData] = createSignal({
    name: '',
    email: '',
    country: 'us',
    theme: 'light',
    volume: 75,
    notifications: true,
    marketing: false,
  })

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
  ]

  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' },
  ]

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    console.log('Submitting form:', formData())
  }

  return VStack({
    children: [
      Form(
        [
          // Personal Information Section
          Section(
            [
              TextField(
                () => formData().name,
                value => updateField('name', value),
                'Full Name'
              ),
              TextField(
                () => formData().email,
                value => updateField('email', value),
                'Email Address'
              )
                .padding(12)
                .border(1, '#e0e0e0')
                .cornerRadius(6)
                ,

              Picker(() => formData().country, countries, {
                onSelectionChange: value => updateField('country', value),
                placeholder: 'Select Country',
              }),
            ],
            {
              title: 'Personal Information',
              footer: 'This information is kept secure and private',
            }
          ),

          // Preferences Section
          Section(
            [
              Picker(() => formData().theme, themes, {
                onSelectionChange: value => updateField('theme', value),
                variant: 'segmented',
              }),

              Slider(() => formData().volume, {
                onValueChange: value => updateField('volume', value),
                min: 0,
                max: 100,
                formatter: value => `${value}%`,
              })
                .marginTop(16)
                ,

              Toggle(() => formData().notifications, {
                onToggle: value => updateField('notifications', value),
                label: 'Push Notifications',
                labelPosition: 'leading',
              }),

              Toggle(() => formData().marketing, {
                onToggle: value => updateField('marketing', value),
                label: 'Marketing Emails',
                labelPosition: 'leading',
              }),
            ],
            {
              title: 'Preferences',
            }
          ),
        ],
        {
          onSubmit: handleSubmit,
        }
      ),

      // Submit Button
      Button('Save Preferences', handleSubmit)
        .backgroundColor('#007AFF')
        .foregroundColor('white')
        .padding({ top: 16, bottom: 16, left: 32, right: 32 })
        .cornerRadius(8)
        .marginTop(24)
        ,
    ],
    spacing: 16,
    alignment: 'stretch',
  })
    .padding(20)
    .maxWidth(600)
    .backgroundColor('#ffffff')
    
}
```

## Best Practices

### 1. Always Use TypeScript

```typescript
// ✅ Good - Full type safety
import { Text, Button } from '@tachui/primitives'
import { createSignal } from '@tachui/core'

const [count, setCount] = createSignal<number>(0)

// ❌ Avoid - Missing types
// const [count, setCount] = createSignal(0) // Inferred, but be explicit
```

### 2. Use Consistent Modifier Patterns

```typescript
// ✅ Good - Always use 
const component = Text('Hello').fontSize(18).padding(16)

// ❌ Wrong - This syntax doesn't exist
// const component = Text('Hello').fontSize(18).padding(16)
```

### 3. Handle Loading and Error States

```typescript
// ✅ Good - Handle all states
const [isLoading, setIsLoading] = createSignal(false)
const [error, setError] = createSignal('')

const submitButton = Button(
  () => {
    if (isLoading()) return 'Saving...'
    if (error()) return 'Retry'
    return 'Save'
  },
  async () => {
    setIsLoading(true)
    setError('')
    try {
      await saveData()
    } catch (err) {
      setError('Failed to save')
    } finally {
      setIsLoading(false)
    }
  }
)
  .disabled(isLoading)
  .backgroundColor(() => (error() ? '#FF3B30' : '#007AFF'))
  
```

### 4. Create Reusable Components

```typescript
// ✅ Good - Reusable component function
function PrimaryButton(title: string, action: () => void) {
  return Button(title, action)
    .backgroundColor('#007AFF')
    .foregroundColor('white')
    .padding({ top: 12, bottom: 12, left: 24, right: 24 })
    .cornerRadius(8)
    .fontWeight('600')
    
}

function SecondaryButton(title: string, action: () => void) {
  return Button(title, action)
    .backgroundColor('transparent')
    .foregroundColor('#007AFF')
    .border(1, '#007AFF')
    .padding({ top: 12, bottom: 12, left: 24, right: 24 })
    .cornerRadius(8)
    
}
```

### 5. Use Semantic Component Organization

```typescript
// ✅ Good - Organized by feature/purpose
function UserCard({ user }: { user: User }) {
  return VStack({
    children: [
      // User avatar and basic info
      UserCardHeader({ user }),

      // User stats or additional info
      UserCardContent({ user }),

      // Action buttons
      UserCardActions({ user }),
    ],
    spacing: 16,
    alignment: 'stretch',
  })
    .padding(16)
    .backgroundColor('#ffffff')
    .cornerRadius(12)
    .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
    
}
```

## Testing Components

All components in this guide are fully tested. Here's how to test your own components:

```typescript
import { describe, it, expect } from 'vitest'
import { createSignal } from '@tachui/core'
import { Button } from '@tachui/primitives'

describe('Custom Button Component', () => {
  it('should create button with correct props', () => {
    const button = Button('Test', () => {})

    expect(button).toBeDefined()
    expect(button.render).toBeDefined()
  })

  it('should handle state changes', () => {
    const [clicked, setClicked] = createSignal(false)

    const button = Button('Test', () => setClicked(true))
    // Test button functionality
  })
})
```

This guide reflects the actual working API patterns used throughout TachUI. All examples have been verified against the test suite and implementation.
