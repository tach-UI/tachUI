# CSS Transforms API

Advanced CSS transform system providing SwiftUI-style transforms with 2D and 3D capabilities, hardware acceleration, and comprehensive transform chaining.

## Overview

The transform system provides multiple ways to apply transforms:

- **SwiftUI-style modifiers** - `.rotationEffect()`, `.scaleEffect()`, `.offset()`
- **Direct transform functions** - `.transform()`, `.scale()`, `.rotate()`, `.translate()`
- **3D transforms** - `perspective()`, 3D rotations, and translations
- **Transform chaining** - Combine multiple transforms efficiently

## SwiftUI Transform Modifiers

### `.rotationEffect(angle, anchor?)`

Rotates element around specified anchor point with SwiftUI-style API.

```typescript
import { Text, Button } from '@tachui/core'

// Basic rotation
Text("Rotated Text")
  .modifier
  .rotationEffect(45) // 45 degrees
  .build()

// Rotation with custom anchor
Button("Corner Rotate")
  .modifier
  .rotationEffect(30, 'topLeading')
  .build()

// Reactive rotation
const [angle, setAngle] = createSignal(0)

Text("Dynamic Rotation")
  .modifier
  .rotationEffect(angle)
  .build()
```

#### Parameters
- `angle`: `number | Signal<number>` - Rotation angle in degrees
- `anchor?`: Transform anchor point (default: `'center'`)

#### Anchor Points
```typescript
type TransformAnchor = 
  | 'center' | 'top' | 'bottom' | 'leading' | 'trailing'
  | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'
```

### `.scaleEffect(x, y?, anchor?)`

Scales element with optional separate X/Y scaling and anchor control.

```typescript
import { Image, VStack } from '@tachui/core'

// Uniform scaling
Image({ src: 'logo.png' })
  .modifier
  .scaleEffect(1.2)
  .build()

// Non-uniform scaling
VStack()
  .modifier
  .scaleEffect(1.5, 0.8) // Wide and short
  .build()

// Scale from corner
Button("Scale from Corner")
  .modifier
  .scaleEffect(1.1, 1.1, 'topLeading')
  .build()
```

### `.offset(x, y?)`

Moves element by specified pixel amounts without affecting layout.

```typescript
import { Text } from '@tachui/core'

// Horizontal offset only
Text("Shifted Right")
  .modifier
  .offset(20)
  .build()

// Both X and Y offset
Text("Diagonal Shift")
  .modifier
  .offset(15, -10)
  .build()

// Reactive offset
const [x, setX] = createSignal(0)
const [y, setY] = createSignal(0)

Text("Dynamic Position")
  .modifier
  .offset(x, y)
  .build()
```

## Direct Transform Functions

### `.transform(transformString)`

Apply raw CSS transform string for maximum control.

```typescript
import { VStack } from '@tachui/core'

VStack()
  .modifier
  .transform('rotate(45deg) scale(1.2) translateX(10px)')
  .build()

// 3D transforms
VStack()
  .modifier
  .transform('rotateX(45deg) rotateY(30deg) translateZ(50px)')
  .perspective(1000)
  .build()
```

### Individual Transform Functions

```typescript
import { Button, Text } from '@tachui/core'

// Individual transform functions
Button("Scaled")
  .modifier
  .scale(1.2) // Uniform scale
  .build()

Button("Rotated")
  .modifier
  .rotate(30) // 30 degrees
  .build()

Text("Translated")
  .modifier
  .translate({ x: 20, y: -10 })
  .build()
```

## 3D Transforms

### `.perspective(distance)`

Sets perspective for 3D transforms.

```typescript
import { VStack, Text } from '@tachui/core'

// 3D card flip effect
VStack([
  Text("Front").modifier.build(),
  Text("Back").modifier.transform('rotateY(180deg)').build()
])
.modifier
.perspective(1000)
.transform('rotateY(45deg)')
.build()
```

### 3D Transform Examples

```typescript
import { Button } from '@tachui/core'

// 3D rotation
Button("3D Rotate")
  .modifier
  .perspective(800)
  .transform('rotateX(45deg) rotateY(30deg)')
  .build()

// 3D translation
Button("3D Translate")
  .modifier
  .perspective(1200)
  .transform('translateZ(50px) rotateX(20deg)')
  .build()
```

## Transform Chaining

Combine multiple transforms efficiently:

```typescript
import { VStack } from '@tachui/core'

// Method chaining
VStack()
  .modifier
  .rotationEffect(30)
  .scaleEffect(1.2)
  .offset(10, -5)
  .build()

// Complex transform combination
VStack()
  .modifier
  .perspective(1000)
  .transform('rotateX(15deg)')
  .scale(1.1)
  .translate({ x: 20, y: 0 })
  .build()
```

## Transform with Transitions

Animate transforms smoothly with transition modifiers:

```typescript
import { Button } from '@tachui/core'

Button("Smooth Transform")
  .modifier
  .rotationEffect(0) // Initial state
  .transition('transform', 300, 'ease-out')
  .onTap(() => {
    // Animate to rotated state
    // This would typically be handled by reactive state
  })
  .build()

// Transform transition presets
Button("Transform Transition")
  .modifier
  .transformTransition(400) // 400ms transform transition
  .scaleEffect(1)
  .hoverEffect('scale') // Will animate smoothly
  .build()
```

## Performance Optimization

### Hardware Acceleration

Transforms automatically trigger hardware acceleration:

```typescript
// ✅ Hardware accelerated transforms
.transform('translateZ(0)') // Force hardware acceleration
.scale(1.2)
.rotationEffect(45)

// ✅ 3D transforms (always hardware accelerated)
.perspective(1000)
.transform('rotateX(30deg)')
```

### Efficient Transform Properties

```typescript
// ✅ Good - Composite layer properties
.transform('translate3d(10px, 20px, 0)')
.scale(1.1)
.rotationEffect(45)

// ❌ Avoid - Layout-triggering properties
.css({ 
  left: '10px',    // Triggers layout
  top: '20px',     // Triggers layout
  width: '110%'    // Triggers layout
})
```

## Advanced Transform Patterns

### Card Flip Animation

```typescript
import { VStack, Text, createSignal } from '@tachui/core'

const [isFlipped, setFlipped] = createSignal(false)

const FlipCard = () => {
  const frontTransform = () => isFlipped() ? 'rotateY(180deg)' : 'rotateY(0deg)'
  const backTransform = () => isFlipped() ? 'rotateY(0deg)' : 'rotateY(-180deg)'
  
  return VStack()
    .modifier
    .perspective(1000)
    .css({ position: 'relative' })
    .onTap(() => setFlipped(!isFlipped()))
    .build()
}
```

### Parallax Effect

```typescript
import { VStack, createEffect, createSignal } from '@tachui/core'

const [scrollY, setScrollY] = createSignal(0)

// Track scroll position
createEffect(() => {
  const handleScroll = () => setScrollY(window.scrollY)
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
})

const ParallaxElement = () =>
  VStack()
    .modifier
    .transform(() => `translateY(${scrollY() * 0.5}px)`) // Parallax factor
    .build()
```

### Loading Spinner

```typescript
import { VStack } from '@tachui/core'

const Spinner = () =>
  VStack()
    .modifier
    .css({
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    })
    .build()

// CSS animation would be defined globally
const spinnerCSS = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`
```

## Transform with Hover Effects

Combine transforms with hover effects:

```typescript
import { Button } from '@tachui/core'

// Scale on hover
Button("Hover Scale")
  .modifier
  .transition('transform', 200, 'ease-out')
  .hover({
    transform: 'scale(1.05)'
  })
  .build()

// Rotate on hover
Button("Hover Rotate")
  .modifier
  .hoverWithTransition({
    transform: 'rotate(5deg) scale(1.02)'
  }, 300)
  .build()

// 3D hover effect
Button("3D Hover")
  .modifier
  .perspective(1000)
  .transformTransition(250)
  .hover({
    transform: 'rotateX(10deg) translateZ(10px)'
  })
  .build()
```

## Browser Support

- **2D Transforms**: 99%+ browser support (IE9+)
- **3D Transforms**: 97%+ browser support (IE10+)
- **Hardware Acceleration**: Automatic on supporting browsers
- **Fallbacks**: Graceful degradation for older browsers

## Common Transform Recipes

### Entrance Animations

```typescript
import { VStack, createSignal, createEffect } from '@tachui/core'

const [isVisible, setVisible] = createSignal(false)

// Fade in from bottom
const FadeInUp = (children: any) => {
  createEffect(() => {
    setTimeout(() => setVisible(true), 100)
  })
  
  return VStack(children)
    .modifier
    .transform(() => isVisible() ? 'translateY(0)' : 'translateY(20px)')
    .opacity(() => isVisible() ? 1 : 0)
    .transition('all', 300, 'ease-out')
    .build()
}

// Scale in
const ScaleIn = (children: any) => {
  return VStack(children)
    .modifier
    .scaleEffect(() => isVisible() ? 1 : 0.8)
    .opacity(() => isVisible() ? 1 : 0)
    .transition('all', 250, 'ease-out')
    .build()
}
```

### Interactive Transforms

```typescript
import { Button, createSignal } from '@tachui/core'

const [rotation, setRotation] = createSignal(0)

Button("Click to Rotate")
  .modifier
  .rotationEffect(rotation)
  .transition('transform', 300, 'ease-out')
  .onTap(() => setRotation(rotation() + 90))
  .build()
```

## Integration with Layout

Transforms don't affect document flow:

```typescript
import { HStack, VStack, Text } from '@tachui/core'

// Transform doesn't affect sibling positioning
HStack([
  Text("Before"),
  Text("Transformed")
    .modifier
    .rotationEffect(45)
    .scaleEffect(1.2)
    .build(),
  Text("After") // Stays in original position
])
.modifier
.gap(20)
.build()
```