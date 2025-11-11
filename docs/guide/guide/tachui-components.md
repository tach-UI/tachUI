# TachUI Components Reference

Complete guide to TachUI's SwiftUI-inspired components with our specific syntax, modifiers, and patterns.

> **Important**: While TachUI is inspired by SwiftUI, our syntax and patterns are specifically designed for web development. This guide covers TachUI's exact implementation - don't assume SwiftUI documentation applies directly.

## Core Concepts

### Fluent Modifier System

TachUI components expose modifiers directly—call them on the component you
create, just like SwiftUI, and there is no extra builder step:

```typescript
Text('Hello')
  .fontSize(24)
  .foregroundColor('#007AFF')
  .padding(16)
  .backgroundColor('white')
  .cornerRadius(8)
```

> **Important**: Modifiers always use the `.property()` naming pattern (for
> example, `.padding(12)`, `.shadow(...)`).

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
  .fontSize(24)
  .fontWeight('bold')
  .foregroundColor('#007AFF')
  .backgroundColor('#f0f8ff')
  .padding(16)
  .cornerRadius(8)
  
```

### Typography Modifiers

```typescript
Text('Typography Example')
  .fontSize(24) // Number in pixels
  .fontWeight('bold') // CSS font-weight values
  .fontFamily('Arial, sans-serif') // CSS font-family
  .lineHeight(1.5) // Number (multiplier) or string
  .letterSpacing(0.5) // Number in pixels
  .textAlign('center') // 'left' | 'center' | 'right' | 'justify'
  .textDecoration('underline') // CSS text-decoration
  .textTransform('uppercase') // CSS text-transform
  
```

### Advanced Text Features

```typescript
// Multiline text with line limits
Text('Very long text that might need truncation...')
  .lineLimit(2) // Limit to 2 lines
  .textOverflow('ellipsis') // Handle overflow
  

// Selectable text
Text('This text can be selected')
  .userSelect('text') // Enable text selection
  

// Interactive text
Text('Clickable Text')
  .onTap(() => console.log('Text clicked'))
  .cursor('pointer')
  .textDecoration('underline')
  
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
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding(12, 20) // vertical, horizontal
  .cornerRadius(8)
  .fontSize(16)
  .fontWeight('600')
  
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
  .disabled(() => isLoading() || isDisabled())
  .opacity(() => (isDisabled() ? 0.5 : 1.0))
  .cursor(() => (isDisabled() ? 'not-allowed' : 'pointer'))
  
```

### Button Variants

```typescript
// Primary button
Button('Primary', action)
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  

// Secondary button
Button('Secondary', action)
  .backgroundColor('transparent')
  .foregroundColor('#007AFF')
  .border(1, '#007AFF')
  

// Destructive button
Button('Delete', action)
  .backgroundColor('#ff3b30')
  .foregroundColor('white')
  

// Text button
Button('Cancel', action)
  .backgroundColor('transparent')
  .foregroundColor('#666')
  
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
  .padding(12)
  .border(1, '#e0e0e0')
  .cornerRadius(6)
  .fontSize(16)
  
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
  .borderColor(() => (error() ? '#ff3b30' : '#e0e0e0'))
  

// Show error message
if (error()) {
  Text(error()).foregroundColor('#ff3b30').fontSize(14)
}
```

## Image Component

Display images with loading states and content modes.

### Basic Usage

```typescript
import { Image } from '@tachui/primitives'

// Simple image
Image({ src: '/path/to/image.jpg', alt: 'Description' })
  .frame({ width: 300, height: 200 })
  .cornerRadius(8)
  

// Responsive image
Image({ src: '/hero-image.jpg' })
  .frame({ width: '100%', height: 'auto' })
  .maxWidth(800)
  
```

### Content Modes

```typescript
// Aspect fit (like SwiftUI .scaleAspectFit)
Image({ src: '/photo.jpg' })
  .frame({ width: 300, height: 200 })
  .objectFit('contain') // CSS object-fit: contain
  

// Aspect fill (like SwiftUI .scaleAspectFill)
Image({ src: '/photo.jpg' })
  .frame({ width: 300, height: 200 })
  .objectFit('cover') // CSS object-fit: cover
  

// Center (no scaling)
Image({ src: '/icon.png' })
  .frame({ width: 100, height: 100 })
  .objectFit('none')
  .objectPosition('center')
  
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
  .opacity(() => (loadingState() === 'loaded' ? 1 : 0.5))
  

// Show loading indicator
if (loadingState() === 'loading') {
  Text('Loading...').fontSize(14).foregroundColor('#666')
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
  .padding(20)
  .backgroundColor('#f8f9fa')
  .cornerRadius(8)
  
```

### HStack - Horizontal Layout

Stack components horizontally.

```typescript
HStack({
  children: [
    Text('Left'),
    Text('Center').flexGrow(1), // Take remaining space
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
ZStack({
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
  .padding(20)
  .backgroundColor('#f8f9fa')
  
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
  .accentColor('#007AFF') // Switch color when enabled
  
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
  .accentColor('#007AFF')
  .frame({ width: 300 })
  

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
  .frame({ width: 300 })
  
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
- **TachUI**: Complex styling requires `` pattern

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

Always use the `` pattern for TachUI components:

```typescript
// Correct TachUI pattern
Text('Hello').fontSize(24).padding(16)

// This syntax doesn't exist in TachUI
// Text('Hello').fontSize(24).padding(16)
```

### 3. Reactive Styling

Use signals for dynamic values:

```typescript
const [isDark, setIsDark] = createSignal(false)

Text('Themed Text')
  .foregroundColor(() => (isDark() ? 'white' : 'black'))
  .backgroundColor(() => (isDark() ? '#333' : 'white'))
  
```

### 4. Semantic Component Names

Create meaningful component names that express intent:

```typescript
function PrimaryButton(title: string, action: () => void) {
  return Button(title, action)
    .backgroundColor('#007AFF')
    .foregroundColor('white')
    .padding(12, 20)
    .cornerRadius(8)
    
}
```

This comprehensive guide covers TachUI's specific implementation. While inspired by SwiftUI, always refer to this documentation for accurate TachUI syntax and patterns.
