# Modifiers System

TachUI's modifier system allows you to declaratively style and configure components using SwiftUI-familiar chaining syntax. With the latest updates, TachUI now includes comprehensive multi-property modifiers and raw CSS support for maximum flexibility.

## Overview

The modifier system follows SwiftUI's declarative approach where you chain modifiers to build up component styling. Each modifier returns a new modified component, allowing for clean, readable component composition.

```typescript
import { Text, VStack } from '@tachui/core'

// Basic modifier chaining
Text("Hello World")
  .modifier
  .fontSize(24)
  .fontWeight('bold')
  .foregroundColor('#007AFF')
  .padding(16)
  .backgroundColor('white')
  .cornerRadius(8)
  .build()
```

## Modifier Categories

### 1. Layout Modifiers

Layout modifiers control the positioning, sizing, and spacing of components.

#### Size Modifiers

Control element dimensions with flexible sizing options:

```typescript
// Multi-property size modifier
Text("Responsive container")
  .modifier
  .size({
    width: '100%',
    height: 200,
    minWidth: 320,
    maxWidth: 800,
    minHeight: 100,
    maxHeight: 400
  })
  .build()

// Individual size properties
Text("Fixed size")
  .modifier
  .width(300)
  .height(150)
  .maxWidth(500)
  .minHeight(100)
  .build()
```

**Available size modifiers:**
- `.size(options)` - Set multiple size properties at once
- `.width(value)` - Set width only
- `.height(value)` - Set height only  
- `.maxWidth(value)` - Set maximum width
- `.minWidth(value)` - Set minimum width
- `.maxHeight(value)` - Set maximum height
- `.minHeight(value)` - Set minimum height

#### Margin Modifiers

Control external spacing with type-safe margin options:

```typescript
// All sides equal
Text("Equal margins")
  .modifier
  .margin({ all: 16 })
  .build()

// Symmetric spacing
Text("Symmetric margins")
  .modifier
  .margin({ vertical: 12, horizontal: 8 })
  .build()

// Individual sides
Text("Custom margins")
  .modifier
  .margin({ top: 8, bottom: 16, left: 12, right: 12 })
  .build()

// Convenience methods
Text("Quick margins")
  .modifier
  .marginTop(16)
  .marginBottom(24)
  .marginHorizontal(20)
  .marginVertical(12)
  .build()
```

**Available margin modifiers:**
- `.margin(options)` - Multi-property margin with type safety
- `.marginTop(value)` - Top margin only
- `.marginBottom(value)` - Bottom margin only
- `.marginHorizontal(value)` - Left and right margins
- `.marginVertical(value)` - Top and bottom margins

#### Padding Modifiers

Control internal spacing (uses existing TachUI padding system):

```typescript
// Equal padding on all sides
Text("Padded content")
  .modifier
  .padding(16)
  .build()

// Detailed padding object
Text("Custom padding")
  .modifier
  .padding({ top: 12, right: 16, bottom: 12, left: 16 })
  .build()
```

#### Position Modifiers

**SwiftUI-style positioning modifiers:**

```typescript
// Offset - moves element relative to natural position
Text("Floating label")
  .modifier
  .offset(10, -5)  // x: 10px, y: -5px
  .build()

// Reactive offset with signals
const [xOffset, setXOffset] = createSignal(0)
Text("Animated element")
  .modifier
  .offset(xOffset, 20)  // Responds to signal changes
  .build()
```

#### Flexbox Modifiers

Modern flexbox layout with comprehensive options:

```typescript
// Flex growth and alignment
VStack({
  children: [/* content */]
})
.modifier
.flexGrow(1)
.justifyContent('center')
.alignItems('stretch')
.gap(16)
.build()

// Individual flexbox properties
Text("Flexible item")
  .modifier
  .flexGrow(2)
  .flexShrink(0)
  .alignItems('center')
  .build()
```

**Available flexbox modifiers:**
- `.flexGrow(value)` - Flex grow factor
- `.flexShrink(value)` - Flex shrink factor
- `.justifyContent(value)` - Main axis alignment
- `.alignItems(value)` - Cross axis alignment
- `.gap(value)` - Gap between flex items

### 2. Typography Modifiers

Comprehensive text styling with a unified typography modifier:

```typescript
// Complete typography styling
Text("Styled text")
  .modifier
  .typography({
    size: 18,
    weight: '600',
    family: 'Inter, sans-serif',
    align: 'center',
    transform: 'uppercase',
    letterSpacing: '0.5px',
    lineHeight: 1.5,
    color: '#1a1a1a'
  })
  .build()

// Individual typography properties
Text("Quick styling")
  .modifier
  .textAlign('center')
  .textTransform('capitalize')
  .letterSpacing('1px')
  .lineHeight(1.4)
  .build()
```

**Available typography modifiers:**
- `.typography(options)` - Complete text styling in one modifier
- `.textAlign(value)` - Text alignment
- `.textTransform(value)` - Text transformation
- `.letterSpacing(value)` - Letter spacing
- `.lineHeight(value)` - Line height
- `.fontSize(value)` - Font size (existing)
- `.fontWeight(value)` - Font weight (existing)

**Typography options:**
- `size`: number | string
- `weight`: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
- `family`: string
- `align`: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end'
- `transform`: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
- `letterSpacing`: number | string
- `lineHeight`: number | string
- `color`: string

### 3. Border Modifiers

Flexible border styling with directional support:

```typescript
// All sides border
Text("Bordered content")
  .modifier
  .border(1, '#e0e0e0', 'solid')
  .build()

// Directional borders
Text("Custom borders")
  .modifier
  .borderTop(2, '#007AFF')
  .borderBottom(1, '#f0f0f0')
  .borderLeft(3, '#34C759', 'dashed')
  .build()
```

**Available border modifiers:**
- `.border(width, color, style?)` - Border on all sides (existing)
- `.borderTop(width, color, style?)` - Top border only
- `.borderRight(width, color, style?)` - Right border only
- `.borderBottom(width, color, style?)` - Bottom border only
- `.borderLeft(width, color, style?)` - Left border only

**Border styles:**
`'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset'`

### 4. Utility Modifiers

Miscellaneous CSS properties for advanced styling:

```typescript
// Cursor and overflow
Text("Interactive content")
  .modifier
  .cursor('pointer')
  .overflowY('scroll')
  .position('relative')
  .zIndex(10)
  .display('flex')
  .build()
```

**Available utility modifiers:**
- `.cursor(value)` - Cursor style
- `.overflowY(value)` - Vertical overflow
- `.overflowX(value)` - Horizontal overflow  
- `.position(value)` - Position type
- `.zIndex(value)` - Z-index layer
- `.display(value)` - Display type

### 5. Raw CSS Modifier 🆕

For ultimate flexibility and future-proofing:

```typescript
// Modern CSS features
Text("Cutting-edge styles")
  .modifier
  .css({
    backdropFilter: 'blur(10px)',
    containerType: 'inline-size',
    scrollBehavior: 'smooth',
    aspectRatio: '16/9',
    maskImage: 'linear-gradient(to bottom, black, transparent)'
  })
  .build()

// CSS custom properties
Text("Themed content")
  .modifier
  .cssVariable('primary-color', '#007AFF')
  .cssVariable('spacing', '16px')
  .css({
    backgroundColor: 'var(--primary-color)',
    padding: 'var(--spacing)'
  })
  .build()

// Single CSS property
Text("One-off styling")
  .modifier
  .cssProperty('backdrop-filter', 'blur(5px)')
  .cssProperty('scroll-snap-align', 'start')
  .build()
```

**Available CSS modifiers:**
- `.css(properties)` - Apply multiple raw CSS properties
- `.cssProperty(property, value)` - Apply single CSS property
- `.cssVariable(name, value)` - Set CSS custom property

**Use cases for CSS modifier:**
- **Experimental CSS features** - Use cutting-edge CSS without waiting for TachUI updates
- **Browser-specific properties** - Vendor prefixes and experimental features
- **CSS Grid and advanced layouts** - Complex layout properties
- **Modern CSS features** - Container queries, backdrop filters, scroll features
- **CSS custom properties** - Design tokens and theming variables

## New SwiftUI-Style Modifiers (Version 1.1) 🆕

TachUI now includes three essential SwiftUI modifiers that were previously missing:

### Position & Transform Modifiers

**`.offset(x, y)` - SwiftUI-style positioning**
```typescript
// Basic offset
Text("Badge")
  .modifier
  .offset(10, -5)  // Move 10px right, 5px up
  .build()

// Reactive offset for animations  
const [x, setX] = createSignal(0)
Text("Animated")
  .modifier
  .offset(x, 0)  // Responds to signal changes
  .build()
```

**`.rotationEffect(angle, anchor)` - Element rotation**
```typescript
// Basic rotation around center
Image("/arrow.svg")
  .modifier
  .rotationEffect(45)  // 45 degrees clockwise
  .build()

// Rotation with custom anchor point
Text("Rotated corner")
  .modifier
  .rotationEffect(30, 'topLeading')  // Rotate around top-left
  .build()

// Available anchor points: 
// 'center', 'top', 'bottom', 'leading', 'trailing',
// 'topLeading', 'topTrailing', 'bottomLeading', 'bottomTrailing'
```

### Content Clipping

**`.clipped()` - Content overflow control**
```typescript
// Prevent content from overflowing bounds
Text("Very long text that might overflow the container")
  .modifier
  .frame(200, 50)
  .clipped()  // Clips overflow content
  .build()

// Common pattern: Clipped images
Image("/large-photo.jpg")
  .modifier
  .frame(100, 100)
  .cornerRadius(8)
  .clipped()  // Ensures corners are properly rounded
  .build()
```

### Combining New Modifiers

```typescript
// Complex transformation example
VStack({
  children: [/* content */]
})
.modifier
.backgroundColor('#f0f0f0')
.cornerRadius(12)
.clipped()  // Ensure clean corners
.offset(0, -10)  // Lift up slightly
.rotationEffect(2, 'center')  // Subtle rotation
.build()
```

## Advanced SwiftUI-Style Modifiers (Version 1.2) 🆕

TachUI now includes four additional essential SwiftUI modifiers for advanced layout and content control:

### Layout & Sizing Modifiers

**`.aspectRatio(ratio, contentMode)` - Responsive aspect ratios**
```typescript
// Basic aspect ratio (16:9)
Image("/video-thumbnail.jpg")
  .modifier
  .aspectRatio(16/9)  // Default 'fit' mode
  .build()

// Square aspect ratio with fill mode
Image("/profile-photo.jpg")
  .modifier
  .aspectRatio(1, 'fill')  // Crops to square
  .build()

// Reactive aspect ratio
const [isWidescreen, setWidescreen] = createSignal(false)
const aspectRatio = createComputed(() => isWidescreen() ? 21/9 : 16/9)

Video("/movie.mp4")
  .modifier
  .aspectRatio(aspectRatio, 'fit')  // Responds to signal changes
  .build()
```

**`.fixedSize(horizontal?, vertical?)` - Prevent size changes**
```typescript
// Prevent shrinking in both directions (default)
Text("Never shrink this text")
  .modifier
  .fixedSize()  // Same as fixedSize(true, true)
  .build()

// Prevent only horizontal shrinking
Text("Long text that should not wrap")
  .modifier
  .fixedSize(true, false)  // Keep natural width
  .build()

// Prevent only vertical shrinking  
VStack({
  children: [/* many items */]
})
.modifier
.fixedSize(false, true)  // Keep natural height
.build()
```

### Advanced Content Clipping

**`.clipShape(shape, parameters)` - Custom shape clipping**
```typescript
// Circular clipping (perfect for avatars)
Image("/avatar.jpg")
  .modifier
  .frame(80, 80)
  .clipShape('circle')
  .build()

// Elliptical clipping with custom radii
Image("/banner.jpg")
  .modifier
  .clipShape('ellipse', { radiusX: '60%', radiusY: '40%' })
  .build()

// Rectangular clipping with inset
VStack({
  children: [/* content */]
})
.modifier
.clipShape('rect', { inset: 10 })  // 10px inset on all sides
.build()

// Custom polygon shapes
Image("/photo.jpg")
  .modifier
  .clipShape('polygon', { 
    points: '0% 0%, 100% 0%, 80% 100%, 20% 100%'  // Trapezoid
  })
  .build()
```

### Content Overlay System

**`.overlay(content, alignment)` - Layer content on top**
```typescript
import { Text, VStack, Image } from '@tachui/core'

// Badge overlay on image
Image("/product.jpg")
  .modifier
  .frame(200, 200)
  .overlay(
    Text("NEW")
      .modifier
      .backgroundColor('#FF3B30')
      .foregroundColor('#FFFFFF')
      .padding(8)
      .cornerRadius(4)
      .fontSize(12)
      .fontWeight('bold')
      .build(),
    'topTrailing'  // Position in top-right corner
  )
  .build()

// Loading indicator overlay
VStack({
  children: [/* main content */]
})
.modifier
.overlay(
  VStack({
    children: [
      Text("⏳"),
      Text("Loading...")
        .modifier
        .fontSize(14)
        .foregroundColor('#8E8E93')
        .build()
    ]
  })
  .modifier
  .backgroundColor('rgba(255,255,255,0.9)')
  .padding(20)
  .cornerRadius(12)
  .build(),
  'center'  // Center the loading indicator
)
.build()

// Available alignment options:
// 'center', 'top', 'bottom', 'leading', 'trailing'
// 'topLeading', 'topTrailing', 'bottomLeading', 'bottomTrailing'
```

### Dynamic Overlay Content

```typescript
// Overlay with reactive content
const [showNotification, setShowNotification] = createSignal(false)

Button("Click me")
  .modifier
  .overlay(
    () => showNotification() ? 
      Text("✓ Done!")
        .modifier
        .backgroundColor('#34C759')
        .foregroundColor('#FFFFFF')
        .padding(8)
        .cornerRadius(6)
        .build()
      : null,
    'top'
  )
  .onTap(() => {
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 2000)
  })
  .build()
```

### Complex Version 1.2 Combinations

```typescript
// Image gallery item with advanced modifiers
function GalleryItem({ src }: { src: string }) {
  const [isHovered, setIsHovered] = createSignal(false)
  
  return Image(src)
    .modifier
    .aspectRatio(1, 'fill')          // Square with cropping
    .frame(200, 200)                 // Fixed size
    .clipShape('circle')             // Circular crop
    .overlay(
      // Hover overlay with gradient
      VStack({
        children: [
          Text("♥")
            .modifier
            .fontSize(24)
            .build(),
          Text("Like")
            .modifier
            .fontSize(12)
            .fontWeight('bold')
            .build()
        ]
      })
      .modifier
      .backgroundColor('rgba(0,0,0,0.6)')
      .foregroundColor('#FFFFFF')
      .padding(16)
      .cornerRadius(50)
      .opacity(() => isHovered() ? 1 : 0)
      .transition({ property: 'opacity', duration: 200 })
      .build(),
      'center'
    )
    .onHover(setIsHovered)
    .build()
}
```

### Responsive Design with Version 1.2

```typescript
// Card layout that adapts to screen size
const [screenSize, setScreenSize] = createSignal<'mobile' | 'tablet' | 'desktop'>('desktop')

function ResponsiveCard() {
  const aspectRatio = createComputed(() => {
    switch (screenSize()) {
      case 'mobile': return 9/16    // Portrait
      case 'tablet': return 4/3     // Traditional
      case 'desktop': return 16/9   // Widescreen
    }
  })
  
  return VStack({
    children: [
      Image("/hero.jpg")
        .modifier
        .aspectRatio(aspectRatio, 'fill')
        .clipShape('rect', { inset: 0 })
        .overlay(
          Text("Featured Content")
            .modifier
            .backgroundColor('rgba(0,0,0,0.7)')
            .foregroundColor('#FFFFFF')
            .padding(16)
            .fontSize(18)
            .fontWeight('bold')
            .build(),
          'bottomLeading'
        )
        .build(),
      
      // Content that maintains size
      Text("This text never shrinks")
        .modifier
        .fixedSize(true, false)
        .padding(16)
        .build()
    ]
  })
  .modifier
  .backgroundColor('#FFFFFF')
  .cornerRadius(12)
  .clipped()  // Ensure clean rounded corners
  .build()
}
```

## Modifier Priority System

Modifiers are applied in priority order to ensure predictable styling:

1. **CSS Modifier** (Priority 5) - Lowest priority, won't override specific modifiers
2. **Utility Modifiers** (Priority 10) - General utility properties
3. **Typography Modifiers** (Priority 30) - Text styling
4. **Border Modifiers** (Priority 40) - Border properties
5. **Margin Modifiers** (Priority 50) - External spacing
6. **Flexbox Modifiers** (Priority 60) - Flexbox layout
7. **Size Modifiers** (Priority 80) - Dimensions
8. **Layout Modifiers** (Priority 100) - Frame, padding, offset
9. **Appearance Modifiers** (Priority 200) - Colors, borders, clipped
10. **Animation Modifiers** (Priority 400) - Transforms, rotationEffect

## Reactive Modifiers

All modifiers support reactive values using TachUI signals:

```typescript
import { createSignal } from '@tachui/core'

const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
const [isActive, setIsActive] = createSignal(false)

Text("Reactive styling")
  .modifier
  .backgroundColor(() => theme() === 'dark' ? '#1a1a1a' : '#ffffff')
  .foregroundColor(() => theme() === 'dark' ? '#ffffff' : '#1a1a1a')
  .transform(() => isActive() ? 'scale(1.05)' : 'scale(1)')
  .css({
    backdropFilter: () => isActive() ? 'blur(10px)' : 'blur(0px)'
  })
  .build()
```

### Computed Signal Modifiers 🆕

TachUI now fully supports computed signals in all modifier contexts. Computed signals enable derived reactive values that automatically update when their dependencies change:

```typescript
import { createSignal, createComputed } from '@tachui/core'

const [isDark, setIsDark] = createSignal(false)
const [size, setSize] = createSignal<'small' | 'large'>('small')

// Computed signals for derived styling
const textColor = createComputed(() => isDark() ? '#ffffff' : '#000000')
const backgroundColor = createComputed(() => isDark() ? '#333333' : '#ffffff')
const fontSize = createComputed(() => size() === 'large' ? 20 : 14)
const borderWidth = createComputed(() => size() === 'large' ? 2 : 1)

Text("Computed reactive styling")
  .modifier
  .foregroundColor(textColor)           // Computed signal for color
  .backgroundColor(backgroundColor)     // Computed signal for background
  .fontSize(fontSize)                   // Computed signal for size
  .border(borderWidth, textColor)       // Multiple computed signals
  .opacity(createComputed(() => isDark() ? 0.9 : 1.0))  // Inline computed
  .build()
```

#### Advanced Computed Examples

```typescript
// Complex theme computation
const [theme, setTheme] = createSignal<'light' | 'dark' | 'auto'>('auto')
const [userPrefersDark] = createSignal(
  window.matchMedia('(prefers-color-scheme: dark)').matches
)

const resolvedTheme = createComputed(() => {
  if (theme() === 'auto') {
    return userPrefersDark() ? 'dark' : 'light'
  }
  return theme()
})

// Computed border configuration
const dynamicBorder = createComputed(() => ({
  width: resolvedTheme() === 'dark' ? 1 : 2,
  color: resolvedTheme() === 'dark' ? '#444444' : '#e0e0e0'
}))

Text("Advanced computed styling")
  .modifier
  .foregroundColor(createComputed(() => 
    resolvedTheme() === 'dark' ? '#ffffff' : '#1a1a1a'
  ))
  .backgroundColor(createComputed(() =>
    resolvedTheme() === 'dark' ? '#1a1a1a' : '#ffffff'  
  ))
  .borderTop(dynamicBorder().width, dynamicBorder().color)
  .cornerRadius(createComputed(() => resolvedTheme() === 'dark' ? 8 : 4))
  .build()
```

#### Computed Signals in Multi-Property Modifiers

Computed signals work seamlessly with multi-property modifiers:

```typescript
const [isPressed, setIsPressed] = createSignal(false)
const [isHovered, setIsHovered] = createSignal(false)

// Computed state for complex interactions
const interactionState = createComputed(() => {
  if (isPressed()) return 'pressed'
  if (isHovered()) return 'hovered' 
  return 'normal'
})

const buttonTypography = createComputed(() => ({
  size: interactionState() === 'pressed' ? 14 : 16,
  weight: interactionState() === 'normal' ? '400' : '600',
  transform: interactionState() === 'pressed' ? 'uppercase' : 'none'
}))

const buttonMargin = createComputed(() => ({
  all: interactionState() === 'pressed' ? 12 : 16
}))

Text("Interactive Button")
  .modifier
  .typography(buttonTypography())      // Computed typography object
  .margin(buttonMargin())              // Computed margin object
  .backgroundColor(createComputed(() => {
    switch (interactionState()) {
      case 'pressed': return '#005bb5'
      case 'hovered': return '#0066cc'
      default: return '#007AFF'
    }
  }))
  .build()
```

#### Computed Signal Features

- **Full Type Safety**: Computed signals maintain complete TypeScript compatibility
- **Automatic Updates**: Changes to dependencies trigger modifier re-evaluation
- **Memory Efficient**: Automatic cleanup prevents memory leaks  
- **Cross-Modifier Support**: Use computed signals in any modifier type
- **Mixed Usage**: Combine with static values and regular signals
- **Performance Optimized**: Only re-compute when dependencies actually change

## Best Practices

### 1. Prefer Specific Modifiers

Use dedicated modifiers for common properties instead of raw CSS:

```typescript
// ✅ Good - Use specific modifiers
Text("Content")
  .modifier
  .padding(16)
  .backgroundColor('#f0f0f0')
  .textAlign('center')
  .build()

// ❌ Avoid - Don't use CSS for common properties
Text("Content")
  .modifier
  .css({
    padding: '16px',
    backgroundColor: '#f0f0f0',
    textAlign: 'center'
  })
  .build()
```

### 2. Use Multi-Property Modifiers

Leverage multi-property modifiers for related properties:

```typescript
// ✅ Good - Group related properties
Text("Comprehensive styling")
  .modifier
  .typography({
    size: 16,
    weight: '500',
    align: 'center',
    transform: 'uppercase'
  })
  .margin({ vertical: 12, horizontal: 8 })
  .build()

// ❌ Verbose - Individual modifiers for everything
Text("Verbose styling")
  .modifier
  .fontSize(16)
  .fontWeight('500')
  .textAlign('center')
  .textTransform('uppercase')
  .marginTop(12)
  .marginBottom(12)
  .marginLeft(8)
  .marginRight(8)
  .build()
```

### 3. CSS Modifier for Edge Cases

Reserve CSS modifier for properties not covered by specific modifiers:

```typescript
// ✅ Good - CSS for advanced features
Text("Modern UI")
  .modifier
  .padding(16)                    // Use specific modifier
  .backgroundColor('#ffffff')     // Use specific modifier
  .css({                         // CSS for advanced features
    backdropFilter: 'blur(10px)',
    containerType: 'inline-size',
    scrollSnapAlign: 'start'
  })
  .build()
```

### 4. Performance Considerations

- Specific modifiers are optimized for performance
- CSS modifier has lower priority to avoid conflicts
- Use reactive values sparingly for frequently updating properties
- Group related CSS properties in single `.css()` call

## Migration from Previous API

If you're using older TachUI modifier APIs, here's how to migrate:

```typescript
// Old API (if applicable)
Text("Content")
  .modifier
  .marginTop(16)     // ❌ May not exist in older versions
  .build()

// New API
Text("Content")
  .modifier
  .marginTop(16)     // ✅ Now available
  .margin({ top: 16 }) // ✅ Alternative with multi-property
  .build()

// For any missing properties
Text("Content")
  .modifier
  .css({ marginTop: '16px' }) // ✅ Always works
  .build()
```

## Examples

For comprehensive examples demonstrating these modifiers in real-world scenarios, see:

- **[Modifier Examples](/examples/modifier-examples)** - Practical usage patterns
- **[Component Examples](/examples/component-examples)** - Complete component implementations
- **[Getting Started](/guide/getting-started)** - Basic modifier introduction

## API Reference

For complete type definitions and method signatures:

- **[API Reference](/api/)** - Complete modifier type definitions
- **[Core Package](/api/index)** - All available modifiers and utilities