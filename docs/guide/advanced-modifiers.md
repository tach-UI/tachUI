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
  .offset(10, -5)                    // Position offset
  .scaleEffect(() => isHovered() ? 1.05 : 1.0)  // Reactive scaling
  .rotationEffect(45, 'topLeading')  // Rotation with anchor
  .clipped()                         // Clip overflow
  
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
  .aspectRatio(16/9, 'fit')     // 16:9 aspect ratio
  .frame({ maxWidth: 600 })     // Responsive width
  .fixedSize(false, true)       // Allow horizontal flex
  
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
  .blur(() => isLoading() ? 3 : 0)
  .brightness(() => isDarkMode() ? 0.8 : 1.0)
  .saturation(() => isDisabled() ? 0.3 : 1.0)
  .transition({ property: 'all', duration: 300 })
  

// Glassmorphism effect
VStack({ children })
  .backgroundColor('rgba(255, 255, 255, 0.1)')
  .blur(10)
  .border(1, 'rgba(255, 255, 255, 0.2)')
  .cornerRadius(16)
  
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
  .clipShape('circle')           // Circular clipping
  .overlay(
    Text("Badge").foregroundColor('white'),
    'topTrailing'
  )
  .shadow({ x: 0, y: 4, radius: 8, color: 'rgba(0,0,0,0.1)' })
  
```

`overlay()` accepts a component, a content closure (SwiftUI's `@ViewBuilder`
shape), a plain string or number, a signal — which renders as reactive text —
or a DOM element:

```typescript
.overlay(Text('Badge'), 'topTrailing')     // component
.overlay(() => Text('Badge'))              // content closure
.overlay('3')                              // string
.overlay(unreadCount)                      // signal, re-renders on change
```

Overlays stack: apply `.overlay()` more than once and each container layers in
the order applied, which is how multi-layer compositions (a ring, then a badge,
then a status dot) are built.

The overlay is proposed the host's bounds, as in SwiftUI. Content with an
intrinsic size (a badge) sits at the alignment and keeps its size, overflowing
the host if it is larger; content sized to `100%` fills the host without
repeating the host's size in a `.frame()`. The options form takes an `offset`:
a number insets the content from every edge it is anchored to (both edges of
a corner), negative moving it outward, and `{ x, y }` moves the content by
that many pixels, positive `x` rightward and positive `y` downward:

```typescript
.overlay(Text('3'), { alignment: 'topTrailing', offset: 4 })       // 4px in from the top and trailing edges
.overlay(Text('3'), { alignment: 'center', offset: { x: 0, y: -8 } })  // nudged up 8px
```

An offset moves the content by adjusting the overlay's edges rather than
translating a host-sized box, so an inward or centered move never extends the
overlay past the host. Only a move outward past the trailing or bottom edge
can add scrollable overflow to a scrolling host, as it would for any element.
Because the offset moves those edges, it also shrinks the area the content is
offered, so content sized to `100%` stops covering the host once an offset
applies to it.

Alignment follows the writing direction, so a `trailing` badge lands on the
right in a left-to-right document and on the left in a right-to-left one.
Offsets follow it too: positive `x` is rightward in a left-to-right document
and leftward in a right-to-left one, so an offset always moves the content
away from the edge it is anchored to rather than across the box.

Content with more than one item layers in place, each item filling the same
area, rather than stacking. That holds for a `ForEach` or a `Show` inside an
overlay too, and it is what SwiftUI does with an overlay's views. Put a stack
inside the overlay when you want a list.

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
  .onLongPressGesture({
    minimumDuration: 500,
    perform: () => showContextMenu()
  })
  .keyboardShortcut('Enter', [], () => activate())
  .focused(() => isFocused())
  .focusable(true, ['activate', 'edit'])
  
```

## Reactive Modifier System

All modifiers support reactive values using TachUI's signal system:

```typescript
const [isActive, setIsActive] = createSignal(false)
const [scale, setScale] = createSignal(1.0)

Button('Interactive', () => setIsActive(!isActive()))
  .scaleEffect(() => scale())                    // Reactive scaling
  .backgroundColor(() => isActive() ? '#007AFF' : '#F0F0F0')
  .opacity(() => isActive() ? 1.0 : 0.7)
  .transition({ property: 'all', duration: 200 })
  
```

## Modifier Composition & Performance

### Chaining Modifiers

Modifiers can be chained in any order and are applied efficiently:

```typescript
Text('Styled Text')
  .padding(16)                    // Layout
  .backgroundColor('#FFFFFF')     // Appearance
  .cornerRadius(8)               // Shape
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
  .onTap(handleTap)              // Interaction
  .transition({ duration: 200 }) // Animation
  
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
Text('Hello').padding(16)

// Advanced modifiers (new capabilities)
Text('Hello')
  .padding(16)
  .scaleEffect(() => isHovered() ? 1.05 : 1.0)
  .blur(() => isLoading() ? 2 : 0)
  
```

## Related Documentation

- [Modifier Catalog](/modifiers/catalog) - Complete modifier API
- [Component Examples](/examples/) - Practical usage examples
- [Getting Started Guide](/guide/getting-started) - Basic modifier usage
- [Performance Guide](/guide/performance) - Optimization techniques

Last updated: 2025-08-19
