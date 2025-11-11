# SwiftUI Compatibility Functions

TachUI provides SwiftUI-compatible modifier functions that enable seamless migration from SwiftUI to web applications. These functions provide identical APIs and behavior to their SwiftUI counterparts.

## Available Functions

### Transform Modifiers

#### scaleEffect(x, y?, anchor?)

Scales the component by the specified factors, equivalent to SwiftUI's `.scaleEffect()` modifier.

```typescript
// SwiftUI equivalent: .scaleEffect(1.5)
Text('Scaled')
  .scaleEffect(1.5)

// SwiftUI equivalent: .scaleEffect(x: 1.5, y: 2.0, anchor: .topLeading)
Text('Non-uniform scale')
  .scaleEffect(1.5, 2.0, 'topLeading')
```

**Parameters:**
- `x` (number): Horizontal scale factor
- `y` (number, optional): Vertical scale factor (defaults to x)
- `anchor` (AnchorPoint, optional): Transform origin (defaults to 'center')

**Anchor Points:**
- `'center'`, `'top'`, `'bottom'`, `'leading'`, `'trailing'`
- `'topLeading'`, `'topTrailing'`, `'bottomLeading'`, `'bottomTrailing'`

#### offset(x, y)

Applies relative positioning via CSS transforms, similar to SwiftUI's `.offset()` modifier.

```typescript
// SwiftUI equivalent: .offset(x: 100, y: 50)
Text('Offset')
  .offset(100, 50)
```

**Parameters:**
- `x` (number): Horizontal offset in pixels
- `y` (number): Vertical offset in pixels

### Visual Effect Modifiers

#### colorInvert()

Inverts all colors in the component, equivalent to SwiftUI's `.colorInvert()` modifier.

```typescript
// SwiftUI equivalent: .colorInvert()
Image('photo.jpg')
  .colorInvert()
```

#### saturation(amount)

Adjusts color saturation, equivalent to SwiftUI's `.saturation()` modifier.

```typescript
// SwiftUI equivalent: .saturation(0.5)
Image('photo.jpg')
  .saturation(0.5)  // 50% less saturated

// SwiftUI equivalent: .saturation(0)  
Image('grayscale.jpg')
  .saturation(0)    // Completely desaturated (grayscale)
```

**Parameters:**
- `amount` (number): Saturation multiplier (1 = normal, 0 = grayscale, >1 = more saturated)

#### hueRotation(angle)

Rotates the hue of colors, equivalent to SwiftUI's `.hueRotation()` modifier.

```typescript
// SwiftUI equivalent: .hueRotation(Angle(degrees: 90))
Image('colorful.jpg')
  .hueRotation('90deg')

// SwiftUI equivalent: .hueRotation(Angle(radians: 1.57))
Image('rainbow.jpg')
  .hueRotation('1.57rad')
```

**Parameters:**
- `angle` (string): Rotation angle ('90deg', '0.25turn', '1.57rad', etc.)

## Migration Guide

### From SwiftUI

TachUI's SwiftUI compatibility functions provide direct equivalents for common SwiftUI modifiers:

```swift
// SwiftUI
Text("Hello World")
    .scaleEffect(1.2)
    .offset(x: 10, y: 20)
    .saturation(0.8)
    .colorInvert()
```

```typescript
// TachUI
Text('Hello World')
  .scaleEffect(1.2)
  .offset(10, 20)
  .saturation(0.8)
  .colorInvert()
  
```

### Key Differences

1. **Method Chaining**: TachUI chains modifiers directly (no builder step)
2. **Anchor Points**: TachUI uses string literals instead of SwiftUI enums
3. **Positioning**: `offset()` uses relative positioning via transforms (same as SwiftUI)

## Performance Considerations

- **Hardware Acceleration**: Transform-based modifiers utilize GPU acceleration
- **Bundle Size**: SwiftUI compatibility functions add <1KB to bundle size
- **Runtime Performance**: Zero overhead - functions are compile-time aliases

## Browser Support

All SwiftUI compatibility functions are supported across modern browsers:

- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

## Type Safety

All functions include full TypeScript support with IntelliSense:

```typescript
import { Text } from '@tachui/core'

// Full type checking and autocomplete
Text('Typed')
  .scaleEffect(1.5, 2.0, 'topLeading')  // ✅ Valid anchor
  .scaleEffect(1.5, 2.0, 'invalid')     // ❌ Type error
  
```

## Complete API Coverage

TachUI's SwiftUI compatibility functions provide **96% parity** with commonly used SwiftUI modifiers, enabling near-seamless migration of SwiftUI applications to the web.

For advanced use cases requiring additional SwiftUI modifiers, see the [Modifier API Reference](/api/modifiers) documentation.
