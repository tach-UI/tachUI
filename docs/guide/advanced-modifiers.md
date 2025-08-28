# Advanced Modifier System

TachUI provides comprehensive SwiftUI-style modifiers, achieving 95% coverage of commonly used SwiftUI modifiers for web development.

## Overview

The TachUI modifier system brings familiar SwiftUI APIs to web development while leveraging TachUI's fine-grained reactive system. With over 130 modifiers available, developers can create sophisticated UIs using declarative, chainable modifiers.

## Core Modifier Categories

### Transform & Positioning Modifiers

Transform modifiers provide SwiftUI-style positioning and transformation capabilities:

- **`.offset(x, y?)`** - Position offset with reactive support
- **`.scaleEffect(x, y?, anchor?)`** - Element scaling with anchor points
- **`.rotationEffect(angle, anchor?)`** - Element rotation with 9 anchor positions
- **`.clipped()`** - Content overflow clipping

#### Example Usage

```typescript
Text("Interactive Content")
  .modifier
  .offset(10, -5)                    // Position offset
  .scaleEffect(() => isHovered() ? 1.05 : 1.0)  // Reactive scaling
  .rotationEffect(45, 'topLeading')  // Rotation with anchor
  .clipped()                         // Clip overflow
  .build()
```

### Layout & Sizing Modifiers

Advanced layout modifiers for responsive design:

- **`.aspectRatio(ratio?, contentMode?)`** - Maintain aspect ratio with fit/fill modes
- **`.fixedSize(horizontal?, vertical?)`** - Prevent element shrinking
- **`.frame(options)`** - Comprehensive sizing with constraints
- **`.layoutPriority(priority)`** - Control layout priority in containers

#### Responsive Layout Example

```typescript
Image('/hero-image.jpg')
  .modifier
  .aspectRatio(16/9, 'fit')     // 16:9 aspect ratio
  .frame({ maxWidth: 600 })     // Responsive width
  .fixedSize(false, true)       // Allow horizontal flex
  .build()
```

### Visual Effects Modifiers

Complete CSS filter effects system:

- **`.blur(radius)`** - Gaussian blur filter
- **`.brightness(amount)`** - Brightness adjustment (0-2, 1 = normal)
- **`.contrast(amount)`** - Contrast adjustment (0-2, 1 = normal)
- **`.saturation(amount)`** - Saturation adjustment (0-2, 1 = normal)
- **`.hueRotation(angle)`** - Hue rotation in degrees (0-360)
- **`.grayscale(amount)`** - Grayscale conversion (0-1)
- **`.colorInvert(amount?)`** - Color inversion (0-1)

#### Visual Effects Example

```typescript
Image('/photo.jpg')
  .modifier
  .blur(() => isLoading() ? 3 : 0)
  .brightness(() => isDarkMode() ? 0.8 : 1.0)
  .saturation(() => isDisabled() ? 0.3 : 1.0)
  .transition({ property: 'all', duration: 300 })
  .build()

// Glassmorphism effect
VStack({ children })
  .modifier
  .backgroundColor('rgba(255, 255, 255, 0.1)')
  .blur(10)
  .border(1, 'rgba(255, 255, 255, 0.2)')
  .cornerRadius(16)
  .build()
```

### Shape & Clipping Modifiers

Advanced shape clipping and overlay system:

- **`.clipShape(shape, parameters?)`** - Custom shape clipping
- **`.overlay(content, alignment?)`** - Content layering with alignment
- **`.cornerRadius(radius)`** - Rounded corners
- **`.shadow(options)`** - Drop shadows

#### Shape & Overlay Example

```typescript
VStack({ children })
  .modifier
  .clipShape('circle')           // Circular clipping
  .overlay(
    Text("Badge").modifier.foregroundColor('white').build(),
    'topTrailing'
  )
  .shadow({ x: 0, y: 4, radius: 8, color: 'rgba(0,0,0,0.1)' })
  .build()
```

### Advanced Gesture & Interaction Modifiers

Comprehensive interaction system beyond basic events:

- **`.onLongPressGesture(options)`** - Long press with configurable constraints
- **`.keyboardShortcut(key, modifiers, action)`** - Global keyboard shortcuts
- **`.focused(binding)`** - Programmatic focus control
- **`.focusable(enabled, interactions?)`** - Focus behavior configuration
- **`.onContinuousHover(coordinateSpace, perform)`** - Real-time mouse tracking

#### Advanced Interactions Example

```typescript
Button('Action Button', handleAction)
  .modifier
  .onLongPressGesture({
    minimumDuration: 500,
    perform: () => showContextMenu()
  })
  .keyboardShortcut('Enter', [], () => activate())
  .focused(() => isFocused())
  .focusable(true, ['activate', 'edit'])
  .build()
```

## Reactive Modifier System

All modifiers support reactive values using TachUI's signal system:

```typescript
const [isActive, setIsActive] = createSignal(false)
const [scale, setScale] = createSignal(1.0)

Button('Interactive', () => setIsActive(!isActive()))
  .modifier
  .scaleEffect(() => scale())                    // Reactive scaling
  .backgroundColor(() => isActive() ? '#007AFF' : '#F0F0F0')
  .opacity(() => isActive() ? 1.0 : 0.7)
  .transition({ property: 'all', duration: 200 })
  .build()
```

## Modifier Composition & Performance

### Chaining Modifiers

Modifiers can be chained in any order and are applied efficiently:

```typescript
Text('Styled Text')
  .modifier
  .padding(16)                    // Layout
  .backgroundColor('#FFFFFF')     // Appearance
  .cornerRadius(8)               // Shape
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
  .onTap(handleTap)              // Interaction
  .transition({ duration: 200 }) // Animation
  .build()
```

### Performance Optimization

- **Efficient Updates**: Only modified properties trigger DOM updates
- **Reactive Precision**: Fine-grained reactivity updates individual CSS properties
- **Batch Processing**: Multiple modifier changes are batched for optimal performance
- **Memory Management**: Automatic cleanup of reactive effects on component unmount

## SwiftUI Compatibility

TachUI achieves 95% compatibility with commonly used SwiftUI modifiers:

- **Implemented**: 61 of 64 common SwiftUI modifiers
- **API Compatibility**: Identical naming and parameter patterns
- **Behavior Matching**: Consistent behavior with SwiftUI counterparts
- **Documentation**: SwiftUI developers can use existing knowledge

## Best Practices

### Performance
- Use reactive values (signals) for dynamic properties
- Batch related modifiers together
- Avoid creating new objects in reactive callbacks

### Type Safety
- TypeScript validates all modifier parameters
- Use proper types for colors, sizes, and enums
- Leverage IDE autocomplete for discovery

### Readability
- Group related modifiers (typography, colors, layout)
- Use meaningful variable names for reactive values
- Consider creating modifier presets for common patterns

### Accessibility
- Use `accessibilityLabel` for screen readers
- Ensure sufficient contrast ratios
- Provide keyboard navigation alternatives

## Migration from Basic Modifiers

For projects using basic modifiers, the advanced system is fully backward compatible:

```typescript
// Basic modifiers (still supported)
Text('Hello').modifier.padding(16).build()

// Advanced modifiers (new capabilities)
Text('Hello')
  .modifier
  .padding(16)
  .scaleEffect(() => isHovered() ? 1.05 : 1.0)
  .blur(() => isLoading() ? 2 : 0)
  .build()
```

## Related Documentation

- [Modifiers Reference](/sheets/modifiers-reference.md) - Complete modifier API
- [Component Examples](/examples/) - Practical usage examples
- [Getting Started Guide](/guide/getting-started) - Basic modifier usage
- [Performance Guide](/guide/performance) - Optimization techniques

Last updated: 2025-08-19