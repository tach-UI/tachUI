---
title: '@tachui/modifiers - Enhanced Documentation'
---

# @tachui/modifiers

130+ chainable modifiers covering layout, typography, interaction, visual effects, accessibility, and responsive helpers with SwiftUI-compatible syntax.

## Install

```bash
pnpm add @tachui/modifiers
```

## Modifier Categories

### 🏗️ **Layout Modifiers**
Spacing, sizing, positioning, alignment for responsive layouts

### 🎨 **Appearance Modifiers**  
Colors, backgrounds, borders, typography for visual styling

### ⚡ **Interaction Modifiers**
Hover, focus, gestures, cursor for user interaction

### 📱 **Responsive Modifiers**
Breakpoint-aware utilities for adaptive design

### ♿ **Accessibility Modifiers**
ARIA attributes, semantic roles, screen reader support

## Quick Start Examples

### Basic Styling

```typescript
import { VStack, Text, Button } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic' // Load modifiers

const styledComponent = VStack({
  children: [
    Text('Hello World')
      .fontSize(24)
      .fontWeight('bold')
      .foregroundColor('#007AFF')
      .padding(16)
      .backgroundColor('#f0f8ff')
      .cornerRadius(12),
    
    Button('Click me', () => console.log('Hovered'))
      .backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ horizontal: 24, vertical: 12 })
      .cornerRadius(8),
  ],
  spacing: 16,
  alignment: 'center',
})
```

### Advanced Layout

```typescript
import { VStack, HStack, Text, Spacer } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'

const complexLayout = VStack({
  children: [
    // Header
    HStack({
      children: [
        Text('tachUI')
          .fontSize(20)
          .fontWeight('bold')
          .foregroundColor('#007AFF'),
        Spacer(),
        Text('v0.9.0')
          .fontSize(14)
          .foregroundColor('#666'),
      ],
      padding({ horizontal: 20, vertical: 16 })
      .backgroundColor('white')
      .shadow({ x: 0, y: 1, radius: 3, color: 'rgba(0,0,0,0.1)' }),
    },
    
    // Content
    VStack({
      children: [
        Text('Main Content')
          .fontSize(32)
          .fontWeight('bold')
          .foregroundColor('#333')
          .padding(20),
        Text('This is a main content area with responsive design')
          .fontSize(16)
          .foregroundColor('#666')
          .lineHeight(1.6)
          .padding({ horizontal: 20 }),
      ],
      spacing: 16,
      padding: 20,
    }),
  ],
})
```

### Interactive Component

```typescript
import { VStack, Text, Button } from '@tachui/primitives'
import { createSignal } from '@tachui/core'
import '@tachui/modifiers/preload/animations'

const [isHovered, setIsHovered] = createSignal(false)
const [isPressed, setIsPressed] = createSignal(false)

const interactiveCard = VStack({
  children: [
    Text('Interactive Card')
      .fontSize(20)
      .fontWeight('bold')
      .foregroundColor(isHovered() ? '#007AFF' : '#333'),
    
    Text('Hover and click to see effects')
      .fontSize(14)
      .foregroundColor('#666'),
    
    Button('Action Button', () => {
      setIsPressed(true)
      setTimeout(() => setIsPressed(false), 200)
    })
      .backgroundColor(isPressed() ? '#0056b3' : '#007AFF')
      .foregroundColor('white')
      .padding({ horizontal: 24, vertical: 12 })
      .cornerRadius(8)
      .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,122,255,0.3)' })
      .transition({ duration: 0.2, properties: ['background-color', 'transform'] })
      .transform({ scale: isPressed() ? 0.95 : 1 }),
  ],
  spacing: 16,
  padding: 24,
  backgroundColor(isHovered() ? '#f8f9fa' : 'white'),
  cornerRadius(12),
  shadow({ 
    x: 0, 
    y: isHovered() ? 4 : 2, 
    radius: isHovered() ? 8 : 4, 
    color: 'rgba(0,0,0,0.1)' 
  }),
  onHover(setIsHovered),
})
```

## Modifier Reference

### Layout Modifiers

#### `padding(value)`
Add padding to all sides or specific sides.

```typescript
Text('Padded text')
  .padding(16)                    // All sides
  .padding({ horizontal: 20, vertical: 12 }) // Specific
  .padding({ top: 10, right: 15, bottom: 10, left: 15 }) // Individual
```

#### `margin(value)`
Add margin around component.

```typescript
Text('Margined text')
  .margin(16)
  .margin({ horizontal: 20, vertical: 12 })
```

#### `frame(width?, height?, maxWidth?, maxHeight?)`
Set component dimensions.

```typescript
Text('Fixed size')
  .frame({ width: 200, height: 100 })

Text('Responsive')
  .frame({ maxWidth: 400, maxHeight: 200 })
```

#### `position(x, y, anchor?)`
Absolute positioning within container.

```typescript
Text('Positioned')
  .position({ x: 50, y: 100, anchor: 'top-left' })
```

#### `alignment(horizontal?, vertical?)`
Set alignment within container.

```typescript
VStack({
  children: [
    Text('Aligned text')
      .alignment({ horizontal: 'center', vertical: 'middle' }),
  ],
})
```

### Appearance Modifiers

#### `foregroundColor(color)`
Set text/icon color.

```typescript
Text('Colored text')
  .foregroundColor('#007AFF')
  .foregroundColor('rgba(0, 122, 255, 0.8)')
  .foregroundColor('red')
```

#### `backgroundColor(color)`
Set background color.

```typescript
Text('Background')
  .backgroundColor('#f0f8ff')
  .backgroundColor('linear-gradient(45deg, #007AFF, #00c6ff)')
```

#### `fontSize(size)`
Set font size.

```typescript
Text('Large text')
  .fontSize(24)
  .fontSize('2rem')
```

#### `fontWeight(weight)`
Set font weight.

```typescript
Text('Bold text')
  .fontWeight('bold')
  .fontWeight('600')
  .fontWeight('semibold')
```

#### `cornerRadius(radius)`
Rounded corners.

```typescript
Text('Rounded')
  .cornerRadius(8)
  .cornerRadius({ topLeft: 12, topRight: 8, bottomLeft: 8, bottomRight: 12 })
```

#### `border(properties)`
Add borders.

```typescript
Text('Bordered')
  .border({
    color: '#007AFF',
    width: 2,
    style: 'solid',
    radius: 4,
  })
```

#### `shadow(properties)`
Add drop shadow.

```typescript
Text('Shadowed')
  .shadow({
    x: 0,
    y: 2,
    radius: 4,
    color: 'rgba(0, 0, 0, 0.2)',
  })
```

### Interaction Modifiers

#### `onTap(handler)`
Handle click/tap events.

```typescript
Button('Click me', () => {
  console.log('Clicked!')
})
  .onTap(() => console.log('Tap detected!'))
```

#### `onHover(handler)`
Handle hover events.

```typescript
Text('Hover me')
  .onHover((isHovering) => {
    console.log(isHovering ? 'Hovered' : 'Unhovered')
  })
```

#### `onFocus(handler)`
Handle focus events.

```typescript
BasicInput({
  placeholder: 'Focus me',
})
  .onFocus(() => console.log('Focused'))
  .onBlur(() => console.log('Blurred'))
```

#### `disabled(condition)`
Disable interaction.

```typescript
Button('Disabled button', () => {})
  .disabled(true)
  .disabled(isLoading())
```

#### `cursor(type)`
Set cursor style.

```typescript
Text('Clickable')
  .cursor('pointer')
  .cursor('help')
```

#### `opacity(value)`
Set opacity level.

```typescript
Text('Semi-transparent')
  .opacity(0.7)
```

### Animation Modifiers

#### `transition(properties)`
Define CSS transitions.

```typescript
Button('Animated', () => {})
  .transition({
    duration: 0.3,
    curve: 'ease-out',
    properties: ['background-color', 'transform'],
  })
```

#### `transform(properties)`
Apply CSS transforms.

```typescript
Text('Transformed')
  .transform({
    scale: 1.1,
    rotate: 45,
    translateX: 10,
    translateY: 5,
  })
```

#### `hover(modifiers)`
Apply modifiers on hover.

```typescript
Button('Hover me', () => {})
  .backgroundColor('#007AFF')
  .hover({ backgroundColor: '#0056b3', transform: { scale: 1.05 } })
```

#### `active(modifiers)`
Apply modifiers when active/pressed.

```typescript
Button('Press me', () => {})
  .backgroundColor('#007AFF')
  .active({ transform: { scale: 0.95 }, backgroundColor: '#004085' })
```

### Responsive Modifiers

#### `responsive(breakpoints)`
Apply different styles per breakpoint.

```typescript
Text('Responsive text')
  .responsive({
    small: { fontSize: 14, padding: 12 },
    medium: { fontSize: 16, padding: 16 },
    large: { fontSize: 20, padding: 20 },
    xlarge: { fontSize: 24, padding: 24 },
  })
```

#### `expand(axis?)`
Expand to fill available space.

```typescript
HStack({
  children: [
    Text('Left'),
    Text('Expandable')
      .expand('horizontal'),
    Text('Right'),
  ],
})
```

### Accessibility Modifiers

#### `accessibilityLabel(label)`
Set ARIA label.

```typescript
Button('×', () => {})
  .accessibilityLabel('Close dialog')
```

#### `accessibilityHint(hint)`
Set ARIA hint.

```typescript
Button('Action', () => {})
  .accessibilityHint('Performs primary action')
```

#### `accessibilityRole(role)`
Set semantic role.

```typescript
VStack({
  children: [/* ... */],
})
  .accessibilityRole('main')
```

#### `screenReaderOnly(condition)`
Hide/show from screen readers.

```typescript
Text('Hidden text')
  .screenReaderOnly(true)
```

## Advanced Patterns

### Custom Modifier Chains

```typescript
import { createComponent } from '@tachui/core'
import '@tachui/modifiers/preload/basic'

const createCardModifier = () => {
  return {
    backgroundColor: 'white',
    cornerRadius: 12,
    padding: 20,
    shadow: { x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' },
  }
}

const customCard = createComponent('Card', props => {
  return VStack({
    ...props,
    ...createCardModifier(),
  })
})
```

### Conditional Modifiers

```typescript
import { createSignal } from '@tachui/core'
import '@tachui/modifiers/preload/basic'

const [isActive, setIsActive] = createSignal(false)

const conditionalComponent = Text('Conditional styling')
  .backgroundColor(isActive() ? '#007AFF' : '#cccccc')
  .foregroundColor(isActive() ? 'white' : '#333')
  .transform({ scale: isActive() ? 1.05 : 1 })
```

### Theme-Aware Modifiers

```typescript
import { createColorAsset } from '@tachui/core'
import '@tachui/modifiers/preload/basic'

const primaryColor = createColorAsset('#007AFF', {
  light: '#007AFF',
  dark: '#0A84FF',
})

const themedComponent = Text('Themed')
  .foregroundColor(primaryColor)
  .backgroundColor('var(--background-color)')
```

### Hover State Management

```typescript
import { createSignal } from '@tachui/core'
import '@tachui/modifiers/preload/basic'

const [isHovered, setIsHovered] = createSignal(false)

const hoverComponent = Text('Hover me')
  .backgroundColor(isHovered() ? '#e3f2fd' : 'white')
  .foregroundColor(isHovered() ? '#007AFF' : '#333')
  .border({
    color: isHovered() ? '#007AFF' : '#e0e0e0',
    width: isHovered() ? 2 : 1,
  })
  .transition({
    duration: 0.2,
    properties: ['background-color', 'border-color', 'color'],
  })
  .onHover(setIsHovered)
  .cursor('pointer')
```

## Bundle Optimization

### Preloading Modifiers

tachUI supports selective modifier preloading for optimal bundle size:

```typescript
// Basic modifiers (layout, colors, typography)
import '@tachui/modifiers/preload/basic'

// Animation modifiers (transitions, transforms)
import '@tachui/modifiers/preload/animations'

// Responsive modifiers (breakpoints, media queries)
import '@tachui/modifiers/preload/responsive'

// Full modifier suite
import '@tachui/modifiers/preload/all'
```

### Lazy Loading

```typescript
// Load modifiers on demand
const loadAdvancedModifiers = async () => {
  await import('@tachui/modifiers/preload/effects')
  // Advanced modifiers now available
}

Button('Load Effects', loadAdvancedModifiers)
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding(12)
  .cornerRadius(6)
```

## Performance Tips

### Modifier Chaining

```typescript
// ✅ Good: Direct modifier calls
Text('Optimized')
  .fontSize(16)
  .fontWeight('medium')
  .foregroundColor('#333')
  .padding(12)
  .cornerRadius(8)

// ❌ Avoid: Old syntax (deprecated)
Text('Less optimal')
  .modifier.fontSize(16)
  .modifier.fontWeight('medium')
  .build()
```

### Caching Modifiers

```typescript
// Reuse modifier configurations
const commonModifier = () => ({
  fontSize: 16,
  fontWeight: 'medium',
  padding: 12,
  cornerRadius: 8,
})

const styledText1 = Text('Text 1')(commonModifier())
const styledText2 = Text('Text 2')(commonModifier())
```

### Batch Updates

```typescript
import { batch } from '@tachui/core'

const [textColor, setTextColor] = createSignal('#333')
const [bgColor, setBgColor] = createSignal('#fff')

// Batch multiple state updates
batch(() => {
  setTextColor('#007AFF')
  setBgColor('#f0f8ff')
})
```

## Integration Examples

### With @tachui/core Reactivity

```typescript
import { VStack, Text, Button } from '@tachui/primitives'
import { createSignal } from '@tachui/core'
import '@tachui/modifiers/preload/basic'

const [count, setCount] = createSignal(0)

const reactiveComponent = VStack({
  children: [
    Text(`Count: ${count()}`)
      .fontSize(24)
      .fontWeight('bold')
      .foregroundColor('#007AFF')
      .padding(16)
      .backgroundColor('#f0f8ff')
      .cornerRadius(12),
    
    Button('Increment', () => setCount(count() + 1))
      .backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ horizontal: 24, vertical: 12 })
      .cornerRadius(8),
  ],
  spacing: 20,
  padding: 24,
  backgroundColor('#f8f9fa')
  .cornerRadius(12),
})
```

### With @tachui/symbols

```typescript
import { VStack, Text } from '@tachui/primitives'
import { Symbol } from '@tachui/symbols'
import '@tachui/modifiers/preload/basic'

const iconWithModifiers = Symbol('person.fill')
  .size(24)
  .foregroundColor('#007AFF')
  .padding(8)
  .backgroundColor('#e3f2fd')
  .cornerRadius(20)

const iconComponent = VStack({
  children: [iconWithModifiers],
  spacing: 16,
  alignment: 'center',
})
```

### With Custom Components

```typescript
interface CustomCardProps extends ComponentProps {
  title: string
  variant: 'primary' | 'secondary'
}

const CustomCard = createComponent<CustomCardProps>('CustomCard', props => {
  const variantStyles = props.variant === 'primary' 
    ? { backgroundColor: '#007AFF', foregroundColor: 'white' }
    : { backgroundColor: '#f8f9fa', foregroundColor: '#333' }

  return VStack({
    children: [
      Text(props.title)
        .fontSize(18)
        .fontWeight('bold')
        .padding(20)
        .backgroundColor(variantStyles.backgroundColor)
        .foregroundColor(variantStyles.foregroundColor)
        .cornerRadius(12)
        .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' }),
    ],
    ...props,
  })
})
```

## Migration Notes

### From v0.8.1-alpha to v0.9.0

- **Enhanced**: 130+ modifiers available
- **Improved**: Better TypeScript support with props validation
- **Added**: Responsive modifier bundle
- **Deprecated**: `.modifier()` and `.build()` chaining syntax

```bash
# Update package
pnpm add @tachui/modifiers

# Update modifier usage (NEW SYNTAX)
Text('Hello')
  .fontSize(16)
  .fontWeight('bold')
  .foregroundColor('#333')

# Old deprecated syntax
Text('Hello')
  .modifier.fontSize(16)
  .modifier.fontWeight('bold')
  .build()
```

### Deprecated Modifiers

Some modifiers have been renamed or replaced:

```typescript
// OLD v0.8 syntax (deprecated)
Text('Hello')
  .modifier.textColor('#007AFF')
  .modifier.bgColor('#ffffff')
  .build()

// NEW v0.9 syntax
Text('Hello')
  .foregroundColor('#007AFF')
  .backgroundColor('#ffffff')
  // .build() no longer needed
```

## Status

✅ **Production Ready** - 130+ modifiers, comprehensive testing  
✅ **Type Safe** - Full TypeScript props validation  
✅ **Performance Optimized** - Selective loading, minimal overhead  
✅ **Responsive** - Built-in breakpoint and media query support  
✅ **Accessible** - ARIA and screen reader support built-in  
⚠️ **In Development** - Advanced gesture modifiers (drag/magnify)  

## Next Steps

- [Advanced modifiers guide](/guide/advanced-modifiers)
- [Responsive design patterns](/guide/responsive-design)  
- [Animation system](/guide/animations)
- [Custom modifier development](/guide/custom-modifiers)
- [Complete modifier catalog](/modifiers/catalog)
