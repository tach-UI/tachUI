---
title: '@tachui/primitives - Enhanced Documentation v0.9.0'
---

# @tachui/primitives

Foundation UI components for tachUI - 71+ components including stacks, text, images, controls, forms, and layout utilities with SwiftUI-compatible API.

## Install

```bash
pnpm add @tachui/primitives@0.9.0
```

## Component Categories

### 🏗️ **Layout Components**
Stacks, spacers, dividers for responsive layouts

### 📝 **Display Components**  
Text, images, scroll views for content presentation

### 🎛️ **Control Components**
Buttons, toggles, pickers for user interaction

### 📋 **Form Components**
Text inputs, form containers for data collection

## Quick Start Examples

### Basic Layout with Stacks

```typescript
import { VStack, HStack, Text, Spacer } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic' // Load modifiers

const profileCard = VStack({
  children: [
    HStack({
      children: [
        VStack({
          children: [
            Text('John Doe')
              .fontSize(18)
              .fontWeight('bold')
              .foregroundColor('#333'),
            Text('Software Engineer')
              .fontSize(14)
              .foregroundColor('#666'),
          ],
          spacing: 4,
          alignment: 'leading',
        }),
        Spacer(),
        Text('Active')
          .fontSize(12)
          .foregroundColor('#007AFF')
          .backgroundColor('#e3f2fd')
          .padding({ horizontal: 8, vertical: 4 })
          .cornerRadius(4),
      ],
      spacing: 12,
      alignment: 'center',
    }),
  ],
  spacing: 16,
  padding: 20,
  backgroundColor('white'),
  cornerRadius(12),
})
```

### Interactive Controls

```typescript
import { VStack, Button, Toggle, Picker } from '@tachui/primitives'
import { createSignal } from '@tachui/core'
import '@tachui/modifiers/preload/basic'

const [isEnabled, setIsEnabled] = createSignal(true)
const [selectedOption, setSelectedOption] = createSignal('option1')

const controlPanel = VStack({
  children: [
    Text('Settings')
      .fontSize(20)
      .fontWeight('bold'),
    
    // Toggle Switch
    Toggle(isEnabled, setIsEnabled)
      .size(40),
    
    // Picker (Dropdown)
    Picker({
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' },
      ],
      selected: selectedOption,
      onSelectionChange: setSelectedOption,
    }),
  ],
  spacing: 20,
  padding: 20,
  backgroundColor('#f8f9fa'),
  cornerRadius(12),
})
```

### Form Example

```typescript
import { VStack, BasicInput, Button } from '@tachui/primitives'
import { createSignal, createComputed } from '@tachui/core'
import '@tachui/modifiers/preload/basic'

const [name, setName] = createSignal('')
const [email, setEmail] = createSignal('')

const canSubmit = createComputed(() => {
  return name().length > 0 && email().length > 0
})

const contactForm = VStack({
  children: [
    Text('Contact Form')
      .fontSize(24)
      .fontWeight('bold'),
    
    VStack({
      children: [
        Text('Name')
          .fontSize(16)
          .fontWeight('medium'),
        BasicInput({
          placeholder: 'Enter your name',
          value: name,
          onValueChange: setName,
        }),
      ],
      spacing: 4,
      alignment: 'leading',
    }),
    
    VStack({
      children: [
        Text('Email')
          .fontSize(16)
          .fontWeight('medium'),
        BasicInput({
          placeholder: 'Enter your email',
          value: email,
          onValueChange: setEmail,
          type: 'email',
        }),
      ],
      spacing: 4,
      alignment: 'leading',
    }),
    
    Button('Submit', () => {
      console.log('Form submitted:', { name: name(), email: email() })
    })
      .backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ horizontal: 32, vertical: 12 })
      .cornerRadius(8)
      .disabled(!canSubmit()),
  ],
  spacing: 20,
  padding: 24,
  backgroundColor('white'),
  cornerRadius(12),
})
```

### Scrollable Content

```typescript
import { ScrollView, VStack, Text } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'

const scrollableList = ScrollView({
  children: [
    VStack({
      children: Array.from({ length: 50 }, (_, i) => 
        VStack({
          children: [
            Text(`Item ${i + 1}`)
              .fontSize(18)
              .fontWeight('medium'),
            Text(`Description for item ${i + 1}`)
              .fontSize(14)
              .foregroundColor('#666'),
          ],
          spacing: 8,
          padding: 16,
          backgroundColor(i % 2 === 0 ? '#f8f9fa' : 'white'),
          cornerRadius(8),
        })
      ),
      spacing: 12,
    }),
  ],
  height: 400,
  padding: 16,
  backgroundColor('#ffffff'),
})
```

## Component Reference

### Layout Components

#### `VStack(props: StackProps)`
Vertical stack layout with spacing and alignment.

```typescript
VStack({
  children: [
    Text('First'),
    Text('Second'),
    Text('Third'),
  ],
  spacing: 16,           // Space between items
  alignment: 'leading',   // 'leading' | 'center' | 'trailing' | 'stretch'
  padding: 20,           // Padding around stack
  backgroundColor('white'), // Background color
  cornerRadius(8),        // Corner radius
})
```

**Props:**
- `children: ComponentChildren[]` - Child components
- `spacing?: number` - Space between children (default: 0)
- `alignment?: StackAlignment` - Cross-axis alignment
- `padding?: number | PaddingProps` - Padding
- `backgroundColor?: string` - Background color
- `cornerRadius?: number` - Corner radius
- `shadow?: ShadowProps` - Shadow properties

#### `HStack(props: StackProps)`
Horizontal stack layout.

```typescript
HStack({
  children: [
    Text('Left'),
    Spacer(), // Flexible space
    Text('Right'),
  ],
  spacing: 12,
  alignment: 'center', // Vertical alignment
})
```

#### `Spacer()`
Flexible space that expands to fill available space.

```typescript
HStack({
  children: [
    Text('Start'),
    Spacer(), // Takes remaining space
    Text('End'),
  ],
})
```

### Display Components

#### `Text(props: TextProps)`
Text display with typography support.

```typescript
Text('Hello World')
  .fontSize(16)
  .fontWeight('medium')
  .foregroundColor('#333')
  .lineHeight(1.5)
  .textAlign('center')

// Reactive content
Text(() => `Count: ${count()}`)
  .fontSize(20)
  .fontWeight('bold')
```

**Props:**
- `content: string | (() => string)` - Static or reactive text
- `font?: FontProps` - Font specification
- `color?: string` - Text color
- `fontSize?: number` - Font size
- `fontWeight?: FontWeight` - Font weight
- `lineHeight?: number` - Line height
- `textAlign?: TextAlign` - Text alignment

#### `Image(props: ImageProps)`
Image display with loading states.

```typescript
Image({
  src: 'https://example.com/image.jpg',
  alt: 'Description',
  width: 200,
  height: 150,
  contentMode: 'cover', // 'cover' | 'contain' | 'fill'
  loading: 'lazy',      // 'lazy' | 'eager'
  onLoad: () => console.log('Image loaded'),
  onError: () => console.log('Image failed to load'),
})
```

### Control Components

#### `Button(props: ButtonProps)`
Interactive button with styling.

```typescript
Button('Click me', () => {
  console.log('Button clicked!')
})
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding({ horizontal: 24, vertical: 12 })
  .cornerRadius(8)
  .fontSize(16)
  .fontWeight('medium')

// Disabled state
Button('Disabled', () => {})
  .backgroundColor('#cccccc')
  .foregroundColor('#666666')
  .disabled(true)
```

**Props:**
- `title: string` - Button text
- `onTap: () => void` - Click handler
- `disabled?: boolean` - Disabled state
- `variant?: 'primary' | 'secondary' | 'destructive'` - Button style
- `size?: 'small' | 'medium' | 'large'` - Button size

#### `Toggle(props: ToggleProps)`
Toggle switch for binary state.

```typescript
const [isEnabled, setIsEnabled] = createSignal(false)

Toggle(isEnabled, setIsEnabled)
  .size(40)
  .tintColor('#cccccc')
  .onTintColor('#007AFF')
```

### Form Components

#### `BasicInput(props: InputProps)`
Text input with validation.

```typescript
const [value, setValue] = createSignal('')

BasicInput({
  placeholder: 'Enter text...',
  value: value,
  onValueChange: setValue,
  type: 'text', // 'text' | 'email' | 'password' | 'number'
  validation: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    errorMessage: 'Please enter valid text',
  },
  onFocus: () => console.log('Input focused'),
  onBlur: () => console.log('Input blurred'),
  onSubmit: () => console.log('Form submitted'),
})
```

## Advanced Patterns

### Responsive Layout

```typescript
import { VStack, HStack, Text } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'

const responsiveLayout = VStack({
  children: [
    HStack({
      children: [
        VStack({
          children: [
            Text('Sidebar')
              .fontSize(18)
              .fontWeight('bold'),
            Text('Navigation items')
              .fontSize(14)
              .foregroundColor('#666'),
          ],
          spacing: 8,
          padding: 16,
          backgroundColor('#f8f9fa'),
        }),
        VStack({
          children: [
            Text('Main Content')
              .fontSize(24)
              .fontWeight('bold'),
            Text('Page content goes here')
              .fontSize(16),
          ],
          spacing: 16,
          padding: 24,
          backgroundColor('white'),
        }),
      ],
      spacing: 20,
    }),
  ],
  padding: 20,
})
```

### Custom Component with Primitives

```typescript
interface CardProps extends ComponentProps {
  title: string
  subtitle?: string
  image?: string
  onTap?: () => void
}

const CustomCard = createComponent<CardProps>('Card', props => {
  return VStack({
    children: [
      props.image ? Image({
        src: props.image,
        alt: props.title,
        height: 200,
        contentMode: 'cover',
      }) : null,
      VStack({
        children: [
          Text(props.title)
            .fontSize(18)
            .fontWeight('bold'),
          props.subtitle ? Text(props.subtitle)
            .fontSize(14)
            .foregroundColor('#666') : null,
        ],
        spacing: 8,
        padding: 16,
        alignment: 'leading',
      }),
    ],
    spacing: 0,
    backgroundColor('white'),
    cornerRadius(12),
    shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' }),
    onTap: props.onTap,
  })
})
```

## Integration Examples

### With @tachui/core Reactivity

```typescript
import { VStack, Text, Button } from '@tachui/primitives'
import { createSignal, createComputed } from '@tachui/core'
import '@tachui/modifiers/preload/basic'

const [count, setCount] = createSignal(0)
const [name, setName] = createSignal('World')

const greeting = createComputed(() => `Hello, ${name()}!`)

const interactiveComponent = VStack({
  children: [
    Text(greeting())
      .fontSize(24)
      .fontWeight('bold')
      .foregroundColor('#007AFF'),
    
    Text(`Count: ${count()}`)
      .fontSize(18),
    
    Button('Increment', () => setCount(count() + 1))
      .backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ horizontal: 24, vertical: 12 })
      .cornerRadius(8),
  ],
  spacing: 20,
  padding: 24,
  backgroundColor('#f8f9fa'),
  cornerRadius(12),
})
```

### With @tachui/modifiers

```typescript
import { VStack, Text, Button } from '@tachui/primitives'
import '@tachui/modifiers/preload/animations' // Load animation modifiers

const animatedButton = Button('Animated', () => console.log('Clicked'))
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding({ horizontal: 24, vertical: 12 })
  .cornerRadius(8)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,122,255,0.3)' })
  .transition({ duration: 0.2, properties: ['background-color', 'transform'] })
  .transform({ scale: 1 })
  .hover({ transform: { scale: 1.05 } })
  .active({ transform: { scale: 0.95 } })
```

### With @tachui/symbols

```typescript
import { VStack, Button } from '@tachui/primitives'
import { Symbol } from '@tachui/symbols'
import '@tachui/modifiers/preload/basic'

const iconComponent = VStack({
  children: [
    Symbol('person.fill')
      .size(24)
      .foregroundColor('#007AFF'),
    Button('Open Profile', () => console.log('Profile opened')),
  ],
  spacing: 16,
  padding: 20,
  backgroundColor('white'),
  cornerRadius(12),
})
```

## Performance Considerations

### Lazy Loading

```typescript
import { ScrollView, VStack } from '@tachui/primitives'
import { lazy, Suspense } from '@tachui/core'

const LazyHeavyComponent = lazy(() => import('./HeavyComponent'))

const optimizedList = ScrollView({
  children: [
    VStack({
      children: Array.from({ length: 1000 }, (_, i) => 
        Suspense({
          fallback: () => Text('Loading...'),
          children: () => LazyHeavyComponent({ id: i }),
        })
      ),
      spacing: 8,
    }),
  ],
  height: 400,
})
```

### Component Memoization

```typescript
import { VStack, Text, memo } from '@tachui/primitives'

const MemoizedItem = memo(({ title, description }: { title: string; description: string }) => {
  return VStack({
    children: [
      Text(title)
        .fontSize(16)
        .fontWeight('medium'),
      Text(description)
        .fontSize(14)
        .foregroundColor('#666'),
    ],
    spacing: 4,
    padding: 12,
    backgroundColor('white'),
    cornerRadius(6),
  })
})

const optimizedList = VStack({
  children: largeDataArray.map(item => 
    MemoizedItem({
      key: item.id,
      title: item.title,
      description: item.description,
    })
  ),
  spacing: 8,
})
```

## Accessibility Features

All components include built-in accessibility support:

```typescript
// Semantic roles and ARIA attributes are automatically handled
Button('Submit', () => handleSubmit())
  // Automatically gets role="button", proper ARIA states

// Keyboard navigation support
BasicInput({
  placeholder: 'Enter name',
  value: name,
  onValueChange: setName,
  // Automatically handles focus, tab order
})
```

## Status

✅ **Production Ready** - 22 test files, 500+ assertions passing  
✅ **71+ Components** - Complete UI component library  
✅ **Type Safe** - Full TypeScript support with props validation  
✅ **Responsive** - Built-in breakpoint and layout support  
✅ **Accessible** - WCAG compliance with semantic HTML  
✅ **Performance Optimized** - Lazy loading and memoization support  

## Next Steps

- [Component catalog](/components/catalog) - Visual component gallery
- [Layout patterns](/guide/layout) - Common layout recipes
- [Form patterns](/guide/forms) - Form validation and submission
- [API reference](/api/primitives) - Complete props reference