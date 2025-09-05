# @tachui/primitives

Foundation UI components for tachUI applications - the building blocks of modern web interfaces.

## Overview

The `@tachui/primitives` package provides essential UI components that serve as the foundation for all tachUI applications. These components offer SwiftUI-inspired APIs with web-native performance and accessibility.

## Installation

```bash
npm install @tachui/primitives@0.8.0-alpha
# or
pnpm add @tachui/primitives@0.8.0-alpha
```

## Core Components

### Layout Components

#### VStack

Vertically stacks child components with customizable spacing and alignment.

```typescript
import { VStack, Text } from '@tachui/primitives'

VStack({
  spacing: 16,
  alignment: 'leading',
  children: [Text('First Item'), Text('Second Item'), Text('Third Item')],
})
```

#### HStack

Horizontally arranges child components with flexible alignment options.

```typescript
import { HStack, Button } from '@tachui/primitives'

HStack({
  spacing: 12,
  alignment: 'center',
  children: [Button('Cancel'), Spacer(), Button('Save')],
})
```

#### ZStack

Overlays components on top of each other with alignment control.

```typescript
import { ZStack, Image, Text } from '@tachui/primitives'

ZStack({
  alignment: 'bottomTrailing',
  children: [
    Image('/hero-background.jpg'),
    Text('Overlay Text')
      .modifier.padding(16)
      .backgroundColor('rgba(0,0,0,0.7)')
      .foregroundColor('white')
      .build(),
  ],
})
```

#### Spacer

Flexible space that expands to fill available space in stacks.

```typescript
HStack({
  children: [
    Text('Left'),
    Spacer(), // Pushes content to edges
    Text('Right'),
  ],
})
```

#### Divider

Visual separator line with customizable appearance.

```typescript
VStack({
  children: [Text('Section 1'), Divider(), Text('Section 2')],
})
```

### Display Components

#### Text

Displays text content with full typography control.

```typescript
Text('Hello, tachUI!')
  .modifier.font({ family: 'San Francisco', size: 18, weight: 600 })
  .foregroundColor('#007AFF')
  .textAlign('center')
  .build()
```

**Advanced Text Features:**

```typescript
// Multiline text with line clamping
Text(longContent).modifier.lineClamp(3).wordBreak('break-word').build()

// Reactive text content
const [count, setCount] = createSignal(0)
Text(() => `Count: ${count()}`)
```

#### Image

Displays images with loading states and aspect ratio control.

```typescript
Image('/path/to/image.jpg')
  .modifier.size({ width: 200, height: 150 })
  .cornerRadius(8)
  .aspectRatio('cover')
  .build()
```

**Image with Assets:**

```typescript
import { Assets } from '@tachui/core'

Image(Assets.profilePicture)
  .modifier.size({ width: 60, height: 60 })
  .cornerRadius(30)
  .build()
```

#### HTML

Renders raw HTML content safely with sanitization.

```typescript
HTML({
  content: '<p>Safe <strong>HTML</strong> content</p>',
  sanitize: true,
})
```

### Control Components

#### Button

Interactive button component with full customization support.

```typescript
Button('Click Me', () => {
  console.log('Button clicked!')
})
  .modifier.padding({ horizontal: 16, vertical: 8 })
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .cornerRadius(8)
  .build()
```

**Button States:**

```typescript
Button('Stateful Button', handleClick)
  .modifier.backgroundColor('#007AFF')
  .hover({ backgroundColor: '#0051D5' })
  .active({ transform: 'scale(0.95)' })
  .disabled({ opacity: 0.5 })
  .build()
```

#### Toggle

Switch/toggle component for boolean states.

```typescript
const [isEnabled, setIsEnabled] = createSignal(false)

Toggle({
  isOn: () => isEnabled(),
  onToggle: setIsEnabled,
})
  .modifier.accentColor('#007AFF')
  .build()
```

#### Picker

Selection component for choosing from multiple options.

```typescript
const options = ['Option 1', 'Option 2', 'Option 3']
const [selected, setSelected] = createSignal(options[0])

Picker({
  selection: () => selected(),
  onSelectionChange: setSelected,
  options: options,
  renderOption: option => Text(option),
})
```

### Form Components

#### BasicInput

Text input component with validation and formatting support.

```typescript
const [text, setText] = createSignal('')

BasicInput({
  value: () => text(),
  onInput: setText,
  placeholder: 'Enter your name',
})
  .modifier.padding(12)
  .border(1, '#E5E5EA')
  .cornerRadius(8)
  .build()
```

**Advanced Input Features:**

```typescript
BasicInput({
  value: () => email(),
  onInput: setEmail,
  type: 'email',
  validation: value => value.includes('@'),
  errorMessage: 'Please enter a valid email',
})
```

#### BasicForm

Simple form container with validation and submission handling.

```typescript
BasicForm({
  onSubmit: data => {
    console.log('Form submitted:', data)
  },
  children: [
    BasicInput({ name: 'username', placeholder: 'Username' }),
    BasicInput({ name: 'email', type: 'email', placeholder: 'Email' }),
    Button('Submit', null), // null indicates form submission
  ],
})
```

## Usage Patterns

### Building Complex Layouts

```typescript
VStack({
  spacing: 20,
  children: [
    // Header
    HStack({
      alignment: 'center',
      children: [
        Image(Assets.logo).modifier.size({ width: 40, height: 40 }).build(),
        Text('My App').modifier.font({ size: 24, weight: 'bold' }).build(),
        Spacer(),
        Button('Menu', toggleMenu),
      ],
    }),

    // Content
    VStack({
      spacing: 16,
      children: [
        Text('Welcome to tachUI!')
          .modifier.font({ size: 18 })
          .textAlign('center')
          .build(),

        Divider(),

        HStack({
          spacing: 12,
          children: [
            Button('Get Started', startOnboarding),
            Button('Learn More', openDocs)
              .modifier.backgroundColor('transparent')
              .foregroundColor('#007AFF')
              .build(),
          ],
        }),
      ],
    }),
  ],
})
```

### Responsive Design

```typescript
VStack({
  children: items.map(item =>
    HStack({
      spacing: { mobile: 8, desktop: 16 },
      children: [
        Image(item.image)
          .modifier.size({ mobile: 40, desktop: 60 })
          .cornerRadius({ mobile: 4, desktop: 8 })
          .build(),

        VStack({
          alignment: 'leading',
          children: [
            Text(item.title)
              .modifier.font({ size: { mobile: 16, desktop: 18 } })
              .build(),

            Text(item.description)
              .modifier.font({ size: { mobile: 14, desktop: 16 } })
              .opacity(0.7)
              .build(),
          ],
        }),
      ],
    })
  ),
})
```

## Accessibility Features

All primitive components include comprehensive accessibility support:

- **ARIA Labels**: Automatic and customizable ARIA attributes
- **Keyboard Navigation**: Full keyboard support for interactive elements
- **Screen Reader Support**: Optimized for screen reader compatibility
- **Focus Management**: Proper focus handling and visual indicators
- **High Contrast**: Support for high contrast modes

```typescript
Button('Accessible Button', handleClick)
  .modifier.accessibilityLabel('Save document')
  .accessibilityRole('button')
  .accessibilityHint('Saves the current document')
  .build()
```

## Styling Integration

Primitives work seamlessly with the modifier system:

```typescript
import { padding, margin, backgroundColor } from '@tachui/modifiers'

Text('Styled with modifiers')
  .modifier.apply(padding(16))
  .apply(margin({ vertical: 8 }))
  .apply(backgroundColor('#F2F2F7'))
  .build()
```

## Performance Characteristics

- **Minimal Bundle Size**: Tree-shakeable components
- **Efficient Rendering**: Fine-grained reactivity with minimal re-renders
- **Memory Efficient**: Automatic cleanup and memory management
- **GPU Accelerated**: CSS transforms and animations when possible

## Component Validation

Built-in validation ensures proper component usage:

```typescript
// Development warnings for common mistakes
VStack({
  children: 'String', // ❌ Warning: children should be array
})

// Type-safe props
Text(123) // ❌ TypeScript error: content must be string or signal
```

## Integration with Other Packages

### With Flow Control

```typescript
import { Show, ForEach } from '@tachui/flow-control'

VStack({
  children: [
    Show({
      when: () => isLoading(),
      children: Text('Loading...'),
    }),

    ForEach({
      data: () => items(),
      renderItem: item =>
        HStack({
          children: [
            Text(item.name),
            Spacer(),
            Button('Edit', () => editItem(item)),
          ],
        }),
    }),
  ],
})
```

### With Navigation

```typescript
import { NavigationLink } from '@tachui/navigation'

VStack({
  children: [
    NavigationLink({
      destination: '/profile',
      children: HStack({
        children: [
          Image(userAvatar),
          Text(userName),
          Spacer(),
          Text('>').modifier.opacity(0.5).build(),
        ],
      }),
    }),
  ],
})
```

## Best Practices

1. **Use Semantic Components**: Choose components based on meaning, not appearance
2. **Leverage the Stack System**: Use VStack, HStack, and ZStack for layouts instead of CSS
3. **Apply Modifiers Consistently**: Use the modifier chain for all styling
4. **Consider Accessibility**: Always provide appropriate labels and roles
5. **Optimize for Performance**: Use signals for reactive content, avoid object creation in renders

## Browser Support

- Modern browsers (Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)
- Progressive enhancement for older browsers
- Graceful fallback for unsupported features

## License

This package is part of the tachUI framework and is licensed under the MPL-2.0 License.
