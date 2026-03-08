# Hover Effects API

Advanced hover effects and interactive states for tachUI components, providing SwiftUI-style interaction patterns with modern CSS capabilities.

## Overview

The hover effects system provides multiple ways to add interactive hover states to components:

- **SwiftUI-style presets** with `hoverEffect()` 
- **Custom hover styles** with `hover()`
- **Conditional hover states** with `conditionalHover()`
- **Hover with transitions** with `hoverWithTransition()`

## SwiftUI-Style Hover Effects

### `.hoverEffect(effect, isEnabled?)`

Applies predefined SwiftUI-style hover effects with consistent timing and behavior.

```typescript
import { Button, Text } from '@tachui/core'

// Default SwiftUI hover (scale + shadow)
Button("Hover Me")
  .modifier
  .hoverEffect('automatic')
  .build()

// Elevation effect with shadow
Text("Lift Effect")
  .modifier
  .hoverEffect('lift')
  .build()

// Subtle background highlight
Button("Highlight")
  .modifier
  .hoverEffect('highlight')
  .build()

// Scale transform only
Text("Scale Only")
  .modifier
  .hoverEffect('scale')
  .build()
```

#### Parameters
- `effect`: `'automatic' | 'lift' | 'highlight' | 'scale'`
- `isEnabled?`: `boolean | Signal<boolean>` - Optional enable/disable control

#### Effect Types

| Effect | Description | CSS Properties |
|--------|-------------|----------------|
| `automatic` | Default SwiftUI behavior | `transform: scale(1.02)` + `box-shadow` |
| `lift` | Elevation with shadow | `transform: translateY(-2px)` + enhanced shadow |
| `highlight` | Background color change | `background-color` + subtle opacity |
| `scale` | Scale transform only | `transform: scale(1.05)` |

## Custom Hover Styles

### `.hover(styles, duration?)`

Apply custom CSS styles on hover with optional transition duration.

```typescript
import { Button, VStack } from '@tachui/core'

// Custom background and transform
Button("Custom Hover")
  .modifier
  .hover({
    backgroundColor: '#4F46E5',
    color: 'white',
    transform: 'scale(1.05) rotate(2deg)'
  })
  .build()

// With custom transition timing
VStack()
  .modifier
  .hover({
    opacity: 0.8,
    filter: 'blur(1px)'
  }, 500) // 500ms transition
  .build()
```

#### Parameters
- `styles`: `CSSStyleDeclaration` - CSS properties to apply on hover
- `duration?`: `number` - Transition duration in milliseconds (default: 200)

## Advanced Hover Controls

### `.hoverWithTransition(styles, duration?)`

Hover effects with explicit transition control and better performance.

```typescript
import { Text } from '@tachui/core'

Text("Smooth Transition")
  .modifier
  .hoverWithTransition({
    transform: 'translateX(10px)',
    color: '#EF4444'
  }, 300)
  .build()
```

### `.conditionalHover(condition, styles)`

Apply hover effects only when a condition is met.

```typescript
import { Button, createSignal } from '@tachui/core'

const [isEnabled, setEnabled] = createSignal(true)

Button("Conditional Hover")
  .modifier
  .conditionalHover(isEnabled, {
    backgroundColor: '#10B981',
    transform: 'scale(1.1)'
  })
  .build()
```

## Hover Effect Presets

Quick access to common hover patterns:

### Component Hover Presets

```typescript
import { Button, Text, Image } from '@tachui/core'

// Button-specific hover
Button("Button Hover")
  .modifier
  .buttonHover() // Optimized for buttons
  .build()

// Card hover effect
VStack()
  .modifier
  .cardHover() // Shadow + lift for cards
  .build()

// Link hover
Text("Link")
  .modifier
  .linkHover() // Color + underline
  .build()

// Image hover
Image({ src: 'photo.jpg' })
  .modifier
  .imageHover() // Scale + overlay
  .build()
```

## Cursor Integration

Hover effects work seamlessly with cursor modifiers:

```typescript
import { Button } from '@tachui/core'

Button("Interactive")
  .modifier
  .hoverEffect('automatic')
  .interactiveCursor() // Changes to pointer
  .build()

Button("Loading")
  .modifier
  .hoverEffect('highlight')
  .loadingCursor() // Shows loading cursor
  .build()
```

## Performance Considerations

### Hardware Acceleration

Hover effects use CSS transforms and opacity for best performance:

```typescript
// ✅ Good - Hardware accelerated
.hover({
  transform: 'scale(1.05) translateZ(0)', // Force hardware acceleration
  opacity: 0.9
})

// ❌ Avoid - Layout-triggering properties
.hover({
  width: '110%', // Causes layout recalculation
  height: '110%'
})
```

### Efficient Transitions

```typescript
// ✅ Optimal transition properties
Button("Efficient")
  .modifier
  .transition('transform', 200, 'ease-out')
  .hoverEffect('scale')
  .build()

// ✅ Multiple optimized properties
.transitions([
  { property: 'transform', duration: 200 },
  { property: 'opacity', duration: 150 },
  { property: 'box-shadow', duration: 300 }
])
```

## Accessibility

Hover effects automatically include focus states for keyboard navigation:

```typescript
Button("Accessible Hover")
  .modifier
  .hoverEffect('automatic') // Also applies on :focus
  .aria({ label: 'Interactive button' })
  .tabIndex(0)
  .build()
```

## Browser Support

- **Modern Browsers**: Full support for all hover effects
- **Mobile Devices**: Hover effects adapt to touch interactions
- **Fallbacks**: Graceful degradation for older browsers

## Examples

### Interactive Card

```typescript
import { VStack, Text, Button } from '@tachui/core'

const InteractiveCard = () => 
  VStack([
    Text("Card Title")
      .modifier
      .font({ size: 18, weight: 'bold' })
      .build(),
    
    Text("Card description with hover effects")
      .modifier
      .opacity(0.7)
      .build(),
    
    Button("Action")
      .modifier
      .buttonHover()
      .build()
  ])
  .modifier
  .cardHover()
  .padding(20)
  .cornerRadius(12)
  .backgroundColor('white')
  .shadow({ x: 0, y: 2, blur: 8, color: 'rgba(0,0,0,0.1)' })
  .build()
```

### Animated Navigation

```typescript
import { HStack, Text } from '@tachui/core'

const NavItem = (title: string) =>
  Text(title)
    .modifier
    .hoverWithTransition({
      color: '#4F46E5',
      transform: 'translateY(-2px)'
    }, 200)
    .cursor('pointer')
    .padding({ horizontal: 15, vertical: 8 })
    .build()

const Navigation = () =>
  HStack([
    NavItem("Home"),
    NavItem("About"),
    NavItem("Contact")
  ])
  .modifier
  .gap(20)
  .build()
```

## Integration with Other Modifiers

Hover effects work with all tachUI modifiers:

```typescript
import { Button } from '@tachui/core'

Button("Complete Example")
  .modifier
  .hoverEffect('automatic')
  .backgroundColor('#3B82F6')
  .foregroundColor('white')
  .cornerRadius(8)
  .padding({ horizontal: 20, vertical: 10 })
  .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
  .transition('all', 200, 'ease-out')
  .build()
```