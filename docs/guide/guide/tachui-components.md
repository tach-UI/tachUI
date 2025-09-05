# TachUI Components Reference

Complete guide to TachUI's SwiftUI-inspired components with our specific syntax, modifiers, and patterns.

> **Important**: While TachUI is inspired by SwiftUI, our syntax and patterns are specifically designed for web development. This guide covers TachUI's exact implementation - don't assume SwiftUI documentation applies directly.

## Core Concepts

### The Modifier System

Unlike SwiftUI, TachUI uses an explicit `.modifier` chain that must be terminated with `.build()`:

```typescript
// TachUI Pattern (Web-Specific)
Text("Hello")
  .modifier
  .fontSize(24)
  .foregroundColor('#007AFF')
  .padding(16)
  .backgroundColor('white')
  .cornerRadius(8)
  .build()               // Required to create component

// NOT SwiftUI - this won't work in TachUI:
Text("Hello")
  .font(.title)          // SwiftUI syntax
  .foregroundColor(.blue)
```

### TachUI Modifier Pattern

TachUI uses a consistent modifier pattern that requires `.modifier` and `.build()`:

```typescript
// Correct TachUI pattern (all modifiers require this structure)
const component = Text('Hello')
  .modifier.fontSize(24)
  .padding(16)
  .foregroundColor('#007AFF')
  .build()

// For complex styling (same pattern)
const styledComponent = Text('Hello')
  .modifier.fontSize(24)
  .padding(16)
  .foregroundColor('#007AFF')
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
  .backgroundColor('white')
  .cornerRadius(8)
  .build()
```

> **Important**: All TachUI modifiers must use the `.modifier.property().build()` pattern. There are no "direct" modifiers.

## Text Component

Display text content with full typography control.

### Basic Usage

```typescript
import { Text } from '@tachui/primitives'

// Static text
const greeting = Text('Hello, World!')

// Dynamic text with reactive content
const [message, setMessage] = createSignal('Dynamic content')
const dynamicText = Text(() => message())

// Styled text
const styledText = Text('Styled Text')
  .modifier.fontSize(24)
  .fontWeight('bold')
  .foregroundColor('#007AFF')
  .backgroundColor('#f0f8ff')
  .padding(16)
  .cornerRadius(8)
  .build()
```

### Typography Modifiers

```typescript
Text('Typography Example')
  .modifier.fontSize(24) // Number in pixels
  .fontWeight('bold') // CSS font-weight values
  .fontFamily('Arial, sans-serif') // CSS font-family
  .lineHeight(1.5) // Number (multiplier) or string
  .letterSpacing(0.5) // Number in pixels
  .textAlign('center') // 'left' | 'center' | 'right' | 'justify'
  .textDecoration('underline') // CSS text-decoration
  .textTransform('uppercase') // CSS text-transform
  .build()
```

### Advanced Text Features

```typescript
// Multiline text with line limits
Text('Very long text that might need truncation...')
  .modifier.lineLimit(2) // Limit to 2 lines
  .textOverflow('ellipsis') // Handle overflow
  .build()

// Selectable text
Text('This text can be selected')
  .modifier.userSelect('text') // Enable text selection
  .build()

// Interactive text
Text('Clickable Text')
  .modifier.onTap(() => console.log('Text clicked'))
  .cursor('pointer')
  .textDecoration('underline')
  .build()
```

## Button Component

Interactive button with press states and haptic feedback.

### Basic Usage

```typescript
import { Button } from '@tachui/primitives'

// Simple button
const basicButton = Button('Click Me', () => {
  console.log('Button clicked!')
})

// Styled button
const styledButton = Button('Save', async () => {
  await saveData()
})
  .modifier.backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding(12, 20) // vertical, horizontal
  .cornerRadius(8)
  .fontSize(16)
  .fontWeight('600')
  .build()
```

### Button States

```typescript
const [isLoading, setIsLoading] = createSignal(false)
const [isDisabled, setIsDisabled] = createSignal(false)

Button('Submit', async () => {
  setIsLoading(true)
  await submitForm()
  setIsLoading(false)
})
  .modifier.disabled(() => isLoading() || isDisabled())
  .opacity(() => (isDisabled() ? 0.5 : 1.0))
  .cursor(() => (isDisabled() ? 'not-allowed' : 'pointer'))
  .build()
```

### Button Variants

```typescript
// Primary button
Button('Primary', action)
  .modifier.backgroundColor('#007AFF')
  .foregroundColor('white')
  .build()

// Secondary button
Button('Secondary', action)
  .modifier.backgroundColor('transparent')
  .foregroundColor('#007AFF')
  .border(1, '#007AFF')
  .build()

// Destructive button
Button('Delete', action)
  .modifier.backgroundColor('#ff3b30')
  .foregroundColor('white')
  .build()

// Text button
Button('Cancel', action)
  .modifier.backgroundColor('transparent')
  .foregroundColor('#666')
  .build()
```

## TextField Component

Text input with validation and reactive updates.

### Basic Usage

```typescript
import { TextField } from '@tachui/advanced-forms'

const [text, setText] = createSignal('')

// Basic text field
TextField({
  value: text(),
  onChange: setText,
  placeholder: 'Enter text...',
})
  .modifier.padding(12)
  .border(1, '#e0e0e0')
  .cornerRadius(6)
  .fontSize(16)
  .build()
```

### Input Types

```typescript
// Email input
TextField({
  type: 'email',
  value: email(),
  onChange: setEmail,
  placeholder: 'Enter email',
})

// Password input
TextField({
  type: 'password',
  value: password(),
  onChange: setPassword,
})

// Number input
TextField({
  type: 'number',
  value: count().toString(),
  onChange: val => setCount(parseInt(val)),
})

// Multiline text area
TextField({
  multiline: true,
  rows: 4,
  value: comment(),
  onChange: setComment,
})
```

### TextField Validation

```typescript
const [email, setEmail] = createSignal('')
const [error, setError] = createSignal('')

TextField({
  type: 'email',
  value: email(),
  onChange: value => {
    setEmail(value)
    // Validate email
    if (!value.includes('@')) {
      setError('Please enter a valid email')
    } else {
      setError('')
    }
  },
  placeholder: 'Enter email',
})
  .modifier.borderColor(() => (error() ? '#ff3b30' : '#e0e0e0'))
  .build()

// Show error message
if (error()) {
  Text(error()).modifier.foregroundColor('#ff3b30').fontSize(14).build()
}
```

## Image Component

Display images with loading states and content modes.

### Basic Usage

```typescript
import { Image } from '@tachui/primitives'

// Simple image
Image({ src: '/path/to/image.jpg', alt: 'Description' })
  .modifier.frame({ width: 300, height: 200 })
  .cornerRadius(8)
  .build()

// Responsive image
Image({ src: '/hero-image.jpg' })
  .modifier.frame({ width: '100%', height: 'auto' })
  .maxWidth(800)
  .build()
```

### Content Modes

```typescript
// Aspect fit (like SwiftUI .scaleAspectFit)
Image({ src: '/photo.jpg' })
  .modifier.frame({ width: 300, height: 200 })
  .objectFit('contain') // CSS object-fit: contain
  .build()

// Aspect fill (like SwiftUI .scaleAspectFill)
Image({ src: '/photo.jpg' })
  .modifier.frame({ width: 300, height: 200 })
  .objectFit('cover') // CSS object-fit: cover
  .build()

// Center (no scaling)
Image({ src: '/icon.png' })
  .modifier.frame({ width: 100, height: 100 })
  .objectFit('none')
  .objectPosition('center')
  .build()
```

### Loading States

```typescript
const [loadingState, setLoadingState] = createSignal<
  'loading' | 'loaded' | 'error'
>('loading')

Image({
  src: '/large-image.jpg',
  onLoad: () => setLoadingState('loaded'),
  onError: () => setLoadingState('error'),
})
  .modifier.opacity(() => (loadingState() === 'loaded' ? 1 : 0.5))
  .build()

// Show loading indicator
if (loadingState() === 'loading') {
  Text('Loading...').modifier.fontSize(14).foregroundColor('#666').build()
}
```

## Layout Components

### VStack - Vertical Layout

Stack components vertically with spacing and alignment.

```typescript
import { VStack } from '@tachui/primitives'

VStack({
  children: [
    Text('First Item'),
    Text('Second Item'),
    Button('Action', () => {}),
  ],
  spacing: 16, // Space between items (pixels)
  alignment: 'leading', // 'leading' | 'center' | 'trailing'
})
  .modifier.padding(20)
  .backgroundColor('#f8f9fa')
  .cornerRadius(8)
  .build()
```

### HStack - Horizontal Layout

Stack components horizontally.

```typescript
HStack({
  children: [
    Text('Left'),
    Text('Center').modifier.flexGrow(1).build(), // Take remaining space
    Text('Right'),
  ],
  spacing: 12,
  alignment: 'center', // 'top' | 'center' | 'bottom'
})
  .modifier.padding(16)
  .build()
```

### ZStack - Layered Layout

Layer components on top of each other.

```typescript
ZStack({
  children: [
    // Background layer
    Text('')
      .modifier.backgroundColor('#007AFF')
      .frame({ width: 200, height: 100 })
      .cornerRadius(8)
      .build(),

    // Foreground content
    Text('Overlay Text')
      .modifier.foregroundColor('white')
      .fontWeight('bold')
      .build(),
  ],
  alignment: 'center', // Position of overlay content
})
```

## Form Components

### Form Container

Groups form elements with consistent styling.

```typescript
import { Form, Section } from '@tachui/advanced-forms'

Form({
  onSubmit: handleSubmit,
  children: [
    Section({
      title: 'Personal Information',
      children: [
        TextField({ placeholder: 'Name', value: name(), onChange: setName }),
        TextField({ placeholder: 'Email', value: email(), onChange: setEmail }),
      ],
    }),
  ],
})
  .modifier.padding(20)
  .backgroundColor('#f8f9fa')
  .build()
```

### Toggle Switch

Boolean input with switch styling.

```typescript
import { Toggle } from '@tachui/primitives'

const [isEnabled, setIsEnabled] = createSignal(false)

Toggle({
  value: isEnabled(),
  onChange: setIsEnabled,
  label: 'Enable Notifications',
})
  .modifier.accentColor('#007AFF') // Switch color when enabled
  .build()
```

### Slider Component

Numeric input with slider interface.

```typescript
import { Slider } from '@tachui/advanced-forms'

const [volume, setVolume] = createSignal(50)

Slider({
  value: volume(),
  onChange: setVolume,
  min: 0,
  max: 100,
  step: 1,
})
  .modifier.accentColor('#007AFF')
  .frame({ width: 300 })
  .build()

// Display current value
Text(() => `Volume: ${volume()}%`)
```

### Picker Component

Selection input with multiple styles.

```typescript
import { Picker } from '@tachui/primitives'

const [selectedColor, setSelectedColor] = createSignal('red')
const colors = ['red', 'green', 'blue', 'yellow']

// Dropdown picker
Picker({
  selection: selectedColor(),
  onChange: setSelectedColor,
  options: colors.map(color => ({ value: color, label: color })),
})

// Segmented picker (like iOS segmented control)
Picker({
  selection: selectedColor(),
  onChange: setSelectedColor,
  options: colors.map(color => ({ value: color, label: color })),
  style: 'segmented',
})
  .modifier.frame({ width: 300 })
  .build()
```

## Common Modifiers Reference

### Layout Modifiers

```typescript
component
  .frame({ width: 300, height: 200 }) // Set dimensions
  .padding(16) // All sides
  .padding(16, 20) // vertical, horizontal
  .padding({ top: 10, right: 15, bottom: 10, left: 15 })
  .margin(12) // External spacing
  .position('relative') // CSS position
  .zIndex(10) // Stack order
```

### Appearance Modifiers

```typescript
component
  .backgroundColor('#f8f9fa') // Background color
  .foregroundColor('#333') // Text/content color
  .opacity(0.8) // Transparency (0-1)
  .cornerRadius(8) // Border radius
  .border(1, '#e0e0e0') // Border width, color
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
```

### Animation Modifiers

```typescript
component
  .transition('all', 200, 'ease-out') // Property, duration, easing
  .animation('fadeIn', 300) // Named animation
  .transform('scale(1.05)') // CSS transform
```

### Interaction Modifiers

```typescript
component
  .onTap(() => console.log('Tapped')) // Click handler
  .onHover(hovered => console.log(hovered)) // Hover state
  .cursor('pointer') // Mouse cursor
  .disabled(false) // Enable/disable interaction
```

## Key Differences from SwiftUI

### 1. Explicit Modifier Chains

- **SwiftUI**: Modifiers can be chained directly
- **TachUI**: Complex styling requires `.modifier.build()` pattern

### 2. Web-Specific Values

- **Colors**: Use CSS color values (`'#007AFF'`, `'rgb(0,122,255)'`) not SwiftUI colors
- **Dimensions**: Numbers are pixels, strings for CSS units (`'100%'`, `'50vh'`)
- **Fonts**: CSS font-family strings, not SwiftUI font names

### 3. Event Handling

- **SwiftUI**: Uses action parameters
- **TachUI**: Uses explicit event modifiers (`.onTap()`, `.onHover()`)

### 4. Reactive Values

- **SwiftUI**: Uses `@State` property wrappers
- **TachUI**: Uses signal functions in modifiers (`() => signal()`)

## Best Practices

### 1. Use TypeScript

Always import components with full type safety:

```typescript
import { Text, Button, VStack } from '@tachui/primitives'
// Not: import * as TachUI from '@tachui/core'
```

### 2. Use Consistent Modifier Pattern

Always use the `.modifier.build()` pattern for TachUI components:

```typescript
// Correct TachUI pattern
Text('Hello').modifier.fontSize(24).padding(16).build()

// This syntax doesn't exist in TachUI
// Text('Hello').fontSize(24).padding(16)
```

### 3. Reactive Styling

Use signals for dynamic values:

```typescript
const [isDark, setIsDark] = createSignal(false)

Text('Themed Text')
  .modifier.foregroundColor(() => (isDark() ? 'white' : 'black'))
  .backgroundColor(() => (isDark() ? '#333' : 'white'))
  .build()
```

### 4. Semantic Component Names

Create meaningful component names that express intent:

```typescript
function PrimaryButton(title: string, action: () => void) {
  return Button(title, action)
    .modifier.backgroundColor('#007AFF')
    .foregroundColor('white')
    .padding(12, 20)
    .cornerRadius(8)
    .build()
}
```

This comprehensive guide covers TachUI's specific implementation. While inspired by SwiftUI, always refer to this documentation for accurate TachUI syntax and patterns.
