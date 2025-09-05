# @tachui/modifiers

Complete SwiftUI-style modifier system for tachUI applications with 200+ modifiers for styling, layout, and behavior.

## Overview

The `@tachui/modifiers` package is the heart of tachUI's declarative styling system. It provides a comprehensive collection of chainable modifiers that allow you to style and configure components in a SwiftUI-inspired manner.

## Installation

```bash
npm install @tachui/modifiers
# or
pnpm add @tachui/modifiers
```

The modifiers package is automatically imported when you use `@tachui/core` and registers all modifiers globally.

## Categories

### Layout Modifiers

Control positioning, sizing, and spatial relationships:

```typescript
import { VStack, Text } from '@tachui/primitives'

VStack({
  children: [
    Text('Padded Text')
      .modifier.padding(16)
      .margin({ vertical: 8 })
      .size({ width: 200, height: 50 })
      .position('relative')
      .build(),
  ],
})
```

**Available Layout Modifiers:**

- `padding()`, `paddingVertical()`, `paddingHorizontal()`
- `margin()`, `marginTop()`, `marginBottom()`
- `size()`, `width()`, `height()`, `maxWidth()`, `maxHeight()`
- `position()`, `offset()`, `zIndex()`
- `aspectRatio()`, `fixedSize()`, `overlay()`

### Appearance Modifiers

Visual styling and theming:

```typescript
Text('Styled Text')
  .modifier.backgroundColor('#007AFF')
  .foregroundColor('white')
  .cornerRadius(8)
  .border(1, '#E5E5EA')
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
  .build()
```

**Available Appearance Modifiers:**

- `backgroundColor()`, `foregroundColor()`
- `border()`, `cornerRadius()`
- `shadow()`, `opacity()`
- `clipShape()`, `clipped()`

### Typography Modifiers

Text styling and formatting:

```typescript
Text('Styled Text')
  .modifier.font({ family: 'San Francisco', size: 18, weight: 600 })
  .textAlign('center')
  .lineHeight(1.4)
  .letterSpacing(0.5)
  .textTransform('uppercase')
  .build()
```

**Available Typography Modifiers:**

- `font()`, `fontSize()`, `fontWeight()`, `fontFamily()`
- `textAlign()`, `lineHeight()`, `letterSpacing()`
- `textTransform()`, `lineClamp()`, `wordBreak()`

### Interaction Modifiers

User interaction and behavior:

```typescript
Button('Interactive Button')
  .modifier.focusable(true)
  .hover({ backgroundColor: '#0051D5' })
  .onTap(() => console.log('Tapped!'))
  .keyboardShortcut('Enter')
  .build()
```

**Available Interaction Modifiers:**

- `focusable()`, `focused()`, `allowsHitTesting()`
- `hover()`, `onContinuousHover()`
- `onTap()`, `onLongPressGesture()`
- `keyboardShortcut()`, `scroll()`

### Layout-Specific Modifiers

Grid, flexbox, and advanced layout:

```typescript
VStack({
  children: items,
})
  .modifier.flexbox({
    direction: 'column',
    justify: 'space-between',
    align: 'center',
  })
  .gap(12)
  .build()
```

**Available Layout-Specific Modifiers:**

- `flexbox()`, `gap()`, `alignSelf()`
- `gridColumn()`, `gridRow()`, `gridArea()`
- `scaleEffect()`, `rotateEffect()`

## Advanced Usage

### Conditional Modifiers

```typescript
import { createSignal } from '@tachui/core'

const [isActive, setIsActive] = createSignal(false)

Text('Conditional Style')
  .modifier.backgroundColor(() => (isActive() ? '#007AFF' : '#F2F2F7'))
  .foregroundColor(() => (isActive() ? 'white' : 'black'))
  .scale(() => (isActive() ? 1.05 : 1.0))
  .build()
```

### Custom Modifier Combinations

```typescript
// Create reusable modifier combinations
const cardStyle = (component: any) =>
  component.modifier
    .padding(16)
    .backgroundColor('white')
    .cornerRadius(12)
    .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
    .border(1, 'rgba(0,0,0,0.05)')
    .build()

// Apply to components
const myCard = cardStyle(
  VStack({
    children: [Text('Card Title'), Text('Card Content')],
  })
)
```

### Responsive Modifiers

```typescript
Text('Responsive Text')
  .modifier.fontSize({ mobile: 14, tablet: 16, desktop: 18 })
  .padding({ mobile: 8, tablet: 12, desktop: 16 })
  .textAlign({ mobile: 'left', desktop: 'center' })
  .build()
```

## Modifier Categories by Package

### Basic Modifiers

From `@tachui/modifiers/basic`:

- Padding, margin, size control
- Essential layout properties

### Layout Modifiers

From `@tachui/modifiers/layout`:

- Advanced positioning and spatial relationships
- Grid and flexbox integration

### Appearance Modifiers

From `@tachui/modifiers/appearance`:

- Colors, borders, shadows
- Visual styling properties

### Typography Modifiers

From `@tachui/modifiers/typography`:

- Font properties and text styling
- Text layout and formatting

### Interaction Modifiers

From `@tachui/modifiers/interaction`:

- User interaction handling
- Focus management and gestures

### Utility Modifiers

From `@tachui/modifiers/utility`:

- CSS property injection
- Custom styling utilities

## Performance Optimization

### Modifier Caching

```typescript
// Modifiers are automatically cached for performance
const buttonStyle = Button('Example')
  .modifier.padding(16)
  .backgroundColor('#007AFF')
  .build() // Cached modifier chain
```

### Batch Updates

```typescript
// Multiple modifiers are batched into single DOM update
Text('Optimized')
  .modifier.padding(16) // \
  .backgroundColor() // | Batched
  .cornerRadius(8) // | together
  .shadow() // /
  .build()
```

## Auto-Registration

All modifiers are automatically registered when you import the package:

```typescript
// This happens automatically on import
import '@tachui/modifiers' // Registers all 200+ modifiers

// Modifiers become available on all components
Text('Auto-registered').modifier.padding(16).build()
```

## Integration Examples

### With Primitives

```typescript
import { VStack, HStack, Text, Button } from '@tachui/primitives'

VStack({
  children: [
    Text('Title').modifier.font({ size: 24, weight: 'bold' }).build(),
    HStack({
      children: [
        Button('Cancel').modifier.backgroundColor('#8E8E93').build(),
        Button('Save').modifier.backgroundColor('#007AFF').build(),
      ],
    })
      .modifier.gap(12)
      .build(),
  ],
})
  .modifier.padding(20)
  .build()
```

### With Effects

```typescript
import { shadow, blur } from '@tachui/effects'

Text('Enhanced')
  .modifier.padding(20)
  .backgroundColor('white')
  .cornerRadius(12)
  .apply(shadow({ x: 0, y: 4, radius: 12, color: 'rgba(0,0,0,0.1)' }))
  .apply(blur(2))
  .build()
```

## Type Safety

Full TypeScript support with intelligent autocomplete:

```typescript
// TypeScript will provide autocomplete and type checking
Text('Type Safe')
  .modifier.padding(16) // ✓ number | PaddingConfig
  .backgroundColor() // ✓ string | ColorAsset
  .opacity() // ✓ number (0-1)
  .build() // ✓ ComponentInstance
```

## Browser Support

- Modern browsers with CSS3 support
- Graceful fallback for older browsers
- Progressive enhancement for advanced features

## Contributing

The modifier system is designed to be extensible. See the [contributing guide](../../CONTRIBUTING.md) for information on adding new modifiers.

## License

This package is part of the tachUI framework and is licensed under the MPL-2.0 License.
