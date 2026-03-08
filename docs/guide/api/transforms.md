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
  .rotationEffect(45) // 45 degrees
  

// Rotation with custom anchor
Button("Corner Rotate")
  .rotationEffect(30, 'topLeading')
  

// Reactive rotation
const [angle, setAngle] = createSignal(0)

Text("Dynamic Rotation")
  .rotationEffect(angle)
  
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
  .scaleEffect(1.2)
  

// Non-uniform scaling
VStack()
  .scaleEffect(1.5, 0.8) // Wide and short
  

// Scale from corner
Button("Scale from Corner")
  .scaleEffect(1.1, 1.1, 'topLeading')
  
```

### `.offset(x, y?)`

Moves element by specified pixel amounts without affecting layout.

```typescript
import { Text } from '@tachui/core'

// Horizontal offset only
Text("Shifted Right")
  .offset(20)
  

// Both X and Y offset
Text("Diagonal Shift")
  .offset(15, -10)
  

// Reactive offset
const [x, setX] = createSignal(0)
const [y, setY] = createSignal(0)

Text("Dynamic Position")
  .offset(x, y)
  
```

## Direct Transform Functions

### `.transform(transformString)`

Apply raw CSS transform string for maximum control.

```typescript
import { VStack } from '@tachui/core'

VStack()
  .transform('rotate(45deg) scale(1.2) translateX(10px)')
  

// 3D transforms
VStack()
  .transform('rotateX(45deg) rotateY(30deg) translateZ(50px)')
  .perspective(1000)
  
```

### Individual Transform Functions

```typescript
import { Button, Text } from '@tachui/core'

// Individual transform functions
Button("Scaled")
  .scale(1.2) // Uniform scale
  

Button("Rotated")
  .rotate(30) // 30 degrees
  

Text("Translated")
  .translate({ x: 20, y: -10 })
  
```

## 3D Transforms

### `.perspective(distance)`

Sets perspective for 3D transforms.

```typescript
import { VStack, Text } from '@tachui/core'

// 3D card flip effect
VStack([
  Text("Front"),
  Text("Back").transform('rotateY(180deg)')
])
.perspective(1000)
.transform('rotateY(45deg)')

```

### 3D Transform Examples

```typescript
import { Button } from '@tachui/core'

// 3D rotation
Button("3D Rotate")
  .perspective(800)
  .transform('rotateX(45deg) rotateY(30deg)')
  

// 3D translation
Button("3D Translate")
  .perspective(1200)
  .transform('translateZ(50px) rotateX(20deg)')
  
```

## Transform Chaining

Combine multiple transforms efficiently:

```typescript
import { VStack } from '@tachui/core'

// Method chaining
VStack()
  .rotationEffect(30)
  .scaleEffect(1.2)
  .offset(10, -5)
  

// Complex transform combination
VStack()
  .perspective(1000)
  .transform('rotateX(15deg)')
  .scale(1.1)
  .translate({ x: 20, y: 0 })
  
```

## Transform with Transitions

Animate transforms smoothly with transition modifiers:

```typescript
import { Button } from '@tachui/core'

Button("Smooth Transform")
  .rotationEffect(0) // Initial state
  .transition('transform', 300, 'ease-out')
  .onTap(() => {
    // Animate to rotated state
    // This would typically be handled by reactive state
  })
  

// Transform transition presets
Button("Transform Transition")
  .transformTransition(400) // 400ms transform transition
  .scaleEffect(1)
  .hoverEffect('scale') // Will animate smoothly
  
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
    .perspective(1000)
    .css({ position: 'relative' })
    .onTap(() => setFlipped(!isFlipped()))
    
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
    .transform(() => `translateY(${scrollY() * 0.5}px)`) // Parallax factor
    
```

### Loading Spinner

```typescript
import { VStack } from '@tachui/core'

const Spinner = () =>
  VStack()
    .css({
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    })
    

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
  .transition('transform', 200, 'ease-out')
  .hover({
    transform: 'scale(1.05)'
  })
  

// Rotate on hover
Button("Hover Rotate")
  .hoverWithTransition({
    transform: 'rotate(5deg) scale(1.02)'
  }, 300)
  

// 3D hover effect
Button("3D Hover")
  .perspective(1000)
  .transformTransition(250)
  .hover({
    transform: 'rotateX(10deg) translateZ(10px)'
  })
  
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
    .transform(() => isVisible() ? 'translateY(0)' : 'translateY(20px)')
    .opacity(() => isVisible() ? 1 : 0)
    .transition('all', 300, 'ease-out')
    
}

// Scale in
const ScaleIn = (children: any) => {
  return VStack(children)
    .scaleEffect(() => isVisible() ? 1 : 0.8)
    .opacity(() => isVisible() ? 1 : 0)
    .transition('all', 250, 'ease-out')
    
}
```

### Interactive Transforms

```typescript
import { Button, createSignal } from '@tachui/core'

const [rotation, setRotation] = createSignal(0)

Button("Click to Rotate")
  .rotationEffect(rotation)
  .transition('transform', 300, 'ease-out')
  .onTap(() => setRotation(rotation() + 90))
  
```

## Integration with Layout

Transforms don't affect document flow:

```typescript
import { HStack, VStack, Text } from '@tachui/core'

// Transform doesn't affect sibling positioning
HStack([
  Text("Before"),
  Text("Transformed")
    .rotationEffect(45)
    .scaleEffect(1.2)
    ,
  Text("After") // Stays in original position
])
.gap(20)

```