# CSS Features API Documentation

> **Phase 2: Enhanced Visual Effects** - Complete API Reference

This document provides comprehensive API documentation for all CSS Features implemented in Phase 2 of the tachUI framework. These features enable advanced visual effects, transforms, and styling capabilities with SwiftUI-inspired APIs.

## Table of Contents

1. [Transform System](#transform-system)
2. [Hover Effects](#hover-effects)
3. [Transitions](#transitions)
4. [Backdrop Filters](#backdrop-filters)
5. [CSS Filters](#css-filters)
6. [Background Clip Text](#background-clip-text)
7. [Pseudo-elements](#pseudo-elements)
8. [Advanced Transforms](#advanced-transforms)
9. [CSS Custom Properties](#css-custom-properties)
10. [Performance & Accessibility](#performance--accessibility)

---

## Transform System

Modern CSS transforms with hardware acceleration and SwiftUI-inspired APIs.

### Basic 2D Transforms

#### `scale(value: number | {x?: number, y?: number})`

Scales an element uniformly or along specific axes.

```typescript
// Uniform scaling
Text("Scaled Text")
  .modifier
  .scale(1.2)
  .build()

// Axis-specific scaling
Button("Stretched Button")
  .modifier
  .scale({ x: 1.3, y: 0.8 })
  .build()
```

#### `rotate(angle: string)`

Rotates an element by the specified angle.

```typescript
Image("icon.png")
  .modifier
  .rotate('45deg')
  .build()

// Negative rotation
Text("Counter-clockwise")
  .modifier
  .rotate('-30deg')
  .build()
```

#### `translate(offset: {x?: number | string, y?: number | string})`

Translates an element along the X and Y axes.

```typescript
// Pixel values
Button("Moved Button")
  .modifier
  .translate({ x: 10, y: 20 })
  .build()

// CSS units
Text("Responsive Move")
  .modifier
  .translate({ x: '1rem', y: '50%' })
  .build()
```

#### `skew(angles: {x?: string, y?: string})`

Skews an element along specified axes.

```typescript
// Both axes
Text("Skewed Text")
  .modifier
  .skew({ x: '10deg', y: '5deg' })
  .build()

// Single axis
Button("Slanted")
  .modifier
  .skew({ x: '15deg' })
  .build()
```

### 3D Transforms

#### `rotateX(angle: string)`, `rotateY(angle: string)`, `rotateZ(angle: string)`

3D rotation around specific axes.

```typescript
Text("3D Rotation")
  .modifier
  .rotateX('45deg')
  .rotateY('30deg')
  .rotateZ('60deg')
  .build()
```

#### `perspective(distance: number)`

Sets the perspective for 3D transforms.

```typescript
VStack([
  Text("3D Card")
    .modifier
    .perspective(1000)
    .rotateX('30deg')
    .build()
])
```

### Complex Transform Configurations

#### `transform(config: TransformConfig | Transform3DConfig)`

Applies multiple transforms in a single modifier.

```typescript
interface TransformConfig {
  scale?: number | { x?: number; y?: number }
  rotate?: string
  translate?: { x?: number | string; y?: number | string }
  skew?: { x?: string; y?: string }
  perspective?: number
}

interface Transform3DConfig extends TransformConfig {
  rotateX?: string
  rotateY?: string
  rotateZ?: string
  translate?: { x?: number | string; y?: number | string; z?: number | string }
  translateZ?: number | string
  scaleZ?: number
}

// 2D Example
Button("Interactive Button")
  .modifier
  .transform({
    scale: 1.1,
    rotate: '2deg',
    translate: { x: 5, y: 5 }
  })
  .build()

// 3D Example
Image("hero-image.jpg")
  .modifier
  .transform({
    perspective: 1000,
    rotateX: '15deg',
    rotateY: '25deg',
    scale: 1.05
  })
  .build()
```

---

## Hover Effects

SwiftUI-aligned hover system with web-specific enhancements.

### SwiftUI-Style Hover Effects

#### `hoverEffect(effect: SwiftUIHoverEffect, enabled?: boolean)`

```typescript
type SwiftUIHoverEffect = 'automatic' | 'highlight' | 'lift'

// Automatic hover (subtle cursor and transition)
Button("Auto Hover", handleClick)
  .modifier
  .hoverEffect('automatic')
  .build()

// Highlight effect (background color change)
Button("Highlight Hover", handleClick)
  .modifier
  .hoverEffect('highlight')
  .build()

// Lift effect (scale and translate)
Button("Lift Hover", handleClick)
  .modifier
  .hoverEffect('lift')
  .build()

// Conditional hover
Button("Conditional", handleClick)
  .modifier
  .hoverEffect('lift', isEnabled)
  .build()
```

### Custom CSS Hover Styles

#### `hover(styles: HoverStyles)`

Advanced hover styling with CSS properties.

```typescript
interface HoverStyles {
  backgroundColor?: string
  color?: string
  transform?: TransformConfig
  boxShadow?: string
  borderColor?: string
  opacity?: number
  // ... any CSS property
}

Button("Custom Hover", handleClick)
  .modifier
  .hover({
    backgroundColor: '#007AFF',
    transform: { scale: 1.05 },
    boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
    color: 'white'
  })
  .build()
```

#### `hoverWithTransition(styles: HoverStyles, duration?: number)`

Hover effects with custom transition timing.

```typescript
Button("Smooth Hover", handleClick)
  .modifier
  .hoverWithTransition({
    backgroundColor: '#34C759',
    transform: { scale: 1.02 }
  }, 150) // 150ms transition
  .build()
```

---

## Transitions

Declarative CSS transitions with SwiftUI-inspired configuration.

### Simple Transitions

#### `transition(property: string, duration: number, easing?: string, delay?: number)`

```typescript
// Basic transition
Text("Smooth Opacity")
  .modifier
  .transition('opacity', 300, 'ease-out')
  .build()

// With delay
Button("Delayed Transition")
  .modifier
  .transition('transform', 200, 'ease-in-out', 100)
  .build()
```

### Complex Transitions

#### `transitions(config: TransitionsConfig)`

Multiple property transitions with individual timing.

```typescript
interface TransitionConfig {
  duration?: number
  easing?: string
  delay?: number
}

interface TransitionsConfig {
  [property: string]: TransitionConfig
}

// Multi-property transitions
Button("Complex Transition", handleClick)
  .modifier
  .transitions({
    backgroundColor: { duration: 200, easing: 'ease-out' },
    transform: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', delay: 50 },
    boxShadow: { duration: 250, easing: 'ease-in-out' }
  })
  .build()
```

---

## Backdrop Filters

Modern backdrop-filter effects with fallbacks.

#### `backdropFilter(config: FilterConfig | string, fallback?: string)`

```typescript
interface FilterConfig {
  blur?: number
  brightness?: number
  contrast?: number
  saturate?: number
  hueRotate?: string
  invert?: number
  opacity?: number
  sepia?: number
  grayscale?: number
}

// Object configuration
VStack([
  Text("Glass Effect")
    .modifier
    .backdropFilter({
      blur: 10,
      brightness: 1.2,
      saturate: 1.5
    })
    .build()
])

// String configuration
Text("Custom Filter")
  .modifier
  .backdropFilter('blur(20px) hue-rotate(90deg)')
  .build()

// With fallback for unsupported browsers
Text("Safe Glass")
  .modifier
  .backdropFilter({ blur: 15 }, 'rgba(255, 255, 255, 0.8)')
  .build()
```

#### `glassmorphism(blurAmount: number, backgroundColor?: string)`

Pre-configured glassmorphism effect.

```typescript
// Default glassmorphism
VStack([
  Text("Glass Card")
    .modifier
    .glassmorphism(12)
    .build()
])

// Custom background
VStack([
  Text("Tinted Glass")
    .modifier
    .glassmorphism(20, 'rgba(0, 122, 255, 0.1)')
    .build()
])
```

---

## CSS Filters

Comprehensive CSS filter system.

### Individual Filter Functions

```typescript
// Individual filters
Image("photo.jpg")
  .modifier
  .blur(5)
  .brightness(1.2)
  .contrast(1.1)
  .saturate(1.3)
  .grayscale(0.5)
  .sepia(0.3)
  .build()
```

### Combined Filter Configuration

#### `filter(config: FilterConfig | string)`

```typescript
interface FilterConfig {
  blur?: number
  brightness?: number
  contrast?: number
  saturate?: number
  sepia?: number
  hueRotate?: string
  invert?: number
  opacity?: number
  dropShadow?: string
  grayscale?: number
}

// Multiple filters
Image("processed-image.jpg")
  .modifier
  .filter({
    blur: 2,
    brightness: 1.1,
    contrast: 1.2,
    saturate: 1.3,
    sepia: 0.2,
    hueRotate: '90deg'
  })
  .build()

// String filter
Image("custom-filter.jpg")
  .modifier
  .filter('grayscale(100%) invert(1)')
  .build()
```

---

## Background Clip Text

Modern gradient text effects with webkit compatibility.

#### `gradientText(gradient: string)`

Applies gradient text with proper webkit prefixes.

```typescript
// Linear gradient text
Text("Gradient Heading")
  .modifier
  .gradientText('linear-gradient(45deg, #007AFF, #FF3B30)')
  .build()

// Radial gradient text
Text("Radial Text")
  .modifier
  .gradientText('radial-gradient(circle, #34C759, #007AFF)')
  .build()

// Complex gradient
Text("Rainbow Text")
  .modifier
  .gradientText('linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #ffeaa7 100%)')
  .build()
```

#### `backgroundClip(image: string, clip: string, color?: string)`

Custom background clip configuration.

```typescript
// Text clipping
Text("Custom Clip")
  .modifier
  .backgroundClip(
    'linear-gradient(90deg, red, blue)',
    'text',
    'transparent'
  )
  .build()

// Border box clipping
VStack([])
  .modifier
  .backgroundClip(
    'url(pattern.png)',
    'border-box',
    'white'
  )
  .build()
```

#### `backgroundImage(image: string)`

Sets background image without clipping.

```typescript
VStack([])
  .modifier
  .backgroundImage('linear-gradient(135deg, purple, pink)')
  .build()
```

---

## Pseudo-elements

CSS pseudo-element support with automatic CSS injection.

### Basic Pseudo-elements

#### `before(styles: PseudoElementStyles)`

Adds ::before pseudo-element with specified styles.

```typescript
interface PseudoElementStyles {
  content?: string
  position?: string
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  width?: number | string
  height?: number | string
  backgroundColor?: string
  color?: string
  fontSize?: number | string
  margin?: string
  padding?: string
  // ... any CSS property
}

// Decorative star
Text("Featured Item")
  .modifier
  .before({
    content: '★',
    color: '#FFD60A',
    marginRight: 5
  })
  .build()

// Decorative line
Text("Underlined")
  .modifier
  .before({
    content: '',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#007AFF'
  })
  .build()
```

#### `after(styles: PseudoElementStyles)`

Adds ::after pseudo-element.

```typescript
// Tooltip arrow
Text("Tooltip")
  .modifier
  .after({
    content: '',
    position: 'absolute',
    top: '100%',
    left: '50%',
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderTop: '5px solid #333',
    transform: 'translateX(-50%)'
  })
  .build()
```

### Combined Pseudo-elements

#### `pseudoElements(options: PseudoElementOptions)`

```typescript
interface PseudoElementOptions {
  before?: PseudoElementStyles
  after?: PseudoElementStyles
}

// Both before and after
Text("Enhanced Text")
  .modifier
  .pseudoElements({
    before: {
      content: '"',
      fontSize: '1.2em',
      color: '#666'
    },
    after: {
      content: '"',
      fontSize: '1.2em',
      color: '#666'
    }
  })
  .build()
```

---

## Advanced Transforms

Matrix transforms and extended 3D capabilities.

### Matrix Transforms

#### `matrix(values: [number, number, number, number, number, number])`

2D matrix transformation.

```typescript
// 2D matrix transform
Text("Matrix Transform")
  .modifier
  .matrix([1, 0.5, -0.5, 1, 10, 20])
  .build()
```

#### `matrix3d(values: [16 numbers])`

3D matrix transformation.

```typescript
// 3D matrix transform
Text("3D Matrix")
  .modifier
  .matrix3d([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    10, 20, 5, 1
  ])
  .build()
```

### Advanced 3D Functions

#### `rotate3d(x: number, y: number, z: number, angle: string)`

3D rotation around a custom axis.

```typescript
Text("Custom 3D Rotation")
  .modifier
  .rotate3d(1, 1, 0, '45deg')
  .build()
```

#### `scale3d(x: number, y: number, z: number)`

3D scaling along all axes.

```typescript
Text("3D Scale")
  .modifier
  .scale3d(1.2, 0.8, 1.5)
  .build()
```

#### `translate3d(x?: number | string, y?: number | string, z?: number | string)`

3D translation with hardware acceleration.

```typescript
Text("3D Move")
  .modifier
  .translate3d(10, 20, 5)
  .build()
```

### Individual Axis Functions

```typescript
// Individual scale functions
Text("Scale X").modifier.scaleX(1.5).build()
Text("Scale Y").modifier.scaleY(0.8).build()
Text("Scale Z").modifier.scaleZ(2.0).build()

// Individual translate functions
Text("Move X").modifier.translateX(50).build()
Text("Move Y").modifier.translateY('2rem').build()
Text("Move Z").modifier.translateZ(10).build()
```

### 3D Properties

#### `perspectiveOrigin(value: string)`

Sets the perspective origin for 3D transforms.

```typescript
Text("Custom Perspective")
  .modifier
  .perspectiveOrigin('top left')
  .build()
```

#### `transformStyle(value: 'flat' | 'preserve-3d')`

Controls 3D transform style inheritance.

```typescript
VStack([])
  .modifier
  .transformStyle('preserve-3d')
  .build()
```

#### `backfaceVisibility(value: 'visible' | 'hidden')`

Controls visibility of element's back face.

```typescript
Text("3D Card")
  .modifier
  .backfaceVisibility('hidden')
  .build()
```

### Complex Advanced Transforms

#### `advancedTransform(config: Advanced3DTransformConfig | MatrixTransformConfig)`

```typescript
interface Advanced3DTransformConfig {
  perspective?: number
  scaleX?: number
  scaleY?: number
  scaleZ?: number
  rotateX?: string
  rotateY?: string
  rotateZ?: string
  translateX?: number | string
  translateY?: number | string
  translateZ?: number | string
  // ... all basic transform properties
}

interface MatrixTransformConfig {
  matrix?: [number, number, number, number, number, number]
  matrix3d?: [16 numbers]
}

// Complex 3D configuration
Text("Advanced 3D")
  .modifier
  .advancedTransform({
    perspective: 1000,
    scaleX: 1.2,
    rotateY: '45deg',
    translateZ: 20
  })
  .build()

// Matrix configuration
Text("Matrix Transform")
  .modifier
  .advancedTransform({
    matrix: [1, 0.5, -0.5, 1, 10, 20]
  })
  .build()
```

---

## CSS Custom Properties

Dynamic theming and CSS variables system.

### Basic Custom Properties

#### `customProperty(name: string, value: string | number, scope?: 'local' | 'global' | 'root')`

Creates a single CSS custom property.

```typescript
// Local scope (default)
Text("Themed Text")
  .modifier
  .customProperty('text-color', '#007AFF')
  .build()

// With prefix handling
Text("Auto Prefix")
  .modifier
  .customProperty('--primary-color', '#FF3B30') // Prefix preserved
  .build()

// Numeric values
Text("Numeric Property")
  .modifier
  .customProperty('z-index', 999)
  .build()
```

#### `cssVariables(variables: Record<string, string | number>)`

Creates multiple CSS custom properties.

```typescript
// Multiple variables
VStack([])
  .modifier
  .cssVariables({
    'primary-color': '#007AFF',
    'secondary-color': '#FF3B30',
    'spacing': '8px',
    'border-radius': '12px'
  })
  .build()
```

#### `customProperties(config: CSSCustomPropertiesConfig)`

Advanced configuration with scope control.

```typescript
interface CSSCustomPropertiesConfig {
  properties: Record<string, string | number>
  scope?: 'local' | 'global' | 'root'
}

// With scope configuration
VStack([])
  .modifier
  .customProperties({
    properties: {
      'theme-primary': '#007AFF',
      'theme-secondary': '#5856D6',
      'font-size-large': '20px'
    },
    scope: 'local'
  })
  .build()
```

### Theme Integration

#### `themeColors(colors: Record<string, string>)`

Creates theme color custom properties.

```typescript
// Theme color system
VStack([])
  .modifier
  .themeColors({
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30'
  })
  .build()

// Creates:
// --theme-color-primary: #007AFF
// --theme-color-secondary: #5856D6
// --theme-color-success: #34C759
// --theme-color-warning: #FF9500
// --theme-color-danger: #FF3B30
```

#### `designTokens(tokens: Record<string, string | number>)`

Creates design token custom properties.

```typescript
// Design system tokens
VStack([])
  .modifier
  .designTokens({
    'spacing-xs': '4px',
    'spacing-sm': '8px',
    'spacing-md': '16px',
    'spacing-lg': '24px',
    'border-radius-sm': '4px',
    'border-radius-md': '8px',
    'shadow-level': 3
  })
  .build()

// Creates:
// --token-spacing-xs: 4px
// --token-spacing-sm: 8px
// --token-spacing-md: 16px
// etc.
```

### Using CSS Variables

```typescript
// Reference custom properties in other styles
VStack([
  Text("Primary Text")
    .modifier
    .color('var(--theme-color-primary)')
    .build(),
    
  Text("Secondary Text")
    .modifier
    .color('var(--theme-color-secondary)')
    .build()
])
.modifier
.themeColors({
  primary: '#007AFF',
  secondary: '#5856D6'
})
.build()
```

---

## Performance & Accessibility

### Performance Considerations

1. **Hardware Acceleration**: All transforms use `translate3d()` for GPU acceleration
2. **CSS Generation**: Efficient CSS string generation with minimal overhead
3. **Memory Management**: Automatic cleanup of pseudo-element styles
4. **Tree Shaking**: All functions support tree shaking for optimal bundle size

### Accessibility Features

1. **Motion Preferences**: Respects `prefers-reduced-motion` media query
2. **High Contrast**: Compatible with high contrast mode
3. **Screen Readers**: Pseudo-elements don't interfere with content reading
4. **Focus Management**: Hover effects don't disrupt focus indicators
5. **Color Contrast**: Theme colors support sufficient contrast ratios

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge | IE11 |
|---------|--------|---------|--------|------|------|
| Transforms | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3D Transforms | ✅ | ✅ | ✅ | ✅ | ✅ |
| Backdrop Filter | ✅ | ✅ | ✅ | ✅ | ❌* |
| CSS Filters | ✅ | ✅ | ✅ | ✅ | ❌* |
| Background Clip | ✅ | ✅ | ✅ | ✅ | ❌* |
| Custom Properties | ✅ | ✅ | ✅ | ✅ | ❌* |
| Pseudo-elements | ✅ | ✅ | ✅ | ✅ | ✅ |

*\*Automatic fallbacks provided*

---

## Examples and Patterns

### Card with Glass Effect

```typescript
VStack([
  Text("Glass Card")
    .modifier
    .fontSize('24px')
    .fontWeight('bold')
    .build(),
    
  Text("Beautiful glassmorphism effect")
    .modifier
    .color('rgba(255, 255, 255, 0.8)')
    .build()
])
.modifier
.padding('24px')
.backdropFilter({
  blur: 20,
  brightness: 1.2,
  saturate: 1.8
})
.backgroundColor('rgba(255, 255, 255, 0.1)')
.borderRadius('16px')
.border('1px solid rgba(255, 255, 255, 0.2)')
.build()
```

### Interactive Button

```typescript
Button("Interactive Button", handleClick)
  .modifier
  .padding('12px 24px')
  .backgroundColor('#007AFF')
  .color('white')
  .borderRadius('8px')
  .hoverWithTransition({
    backgroundColor: '#0056CC',
    transform: { scale: 1.05 },
    boxShadow: '0 8px 25px rgba(0, 122, 255, 0.3)'
  }, 200)
  .build()
```

### Gradient Text Hero

```typescript
Text("Amazing Gradient Text")
  .modifier
  .fontSize('48px')
  .fontWeight('bold')
  .gradientText('linear-gradient(45deg, #007AFF, #5856D6, #AF52DE)')
  .textAlign('center')
  .build()
```

### Complex 3D Card

```typescript
VStack([
  Image("product.jpg")
    .modifier
    .width('100%')
    .height('200px')
    .objectFit('cover')
    .build(),
    
  VStack([
    Text("Product Name")
      .modifier
      .fontSize('18px')
      .fontWeight('bold')
      .build(),
      
    Text("Product description goes here")
      .modifier
      .color('#666')
      .build()
  ])
  .modifier
  .padding('16px')
  .build()
])
.modifier
.backgroundColor('white')
.borderRadius('12px')
.boxShadow('0 4px 6px rgba(0, 0, 0, 0.1)')
.transform({
  perspective: 1000,
  rotateX: '5deg',
  rotateY: '5deg'
})
.hoverWithTransition({
  transform: {
    perspective: 1000,
    rotateX: '0deg',
    rotateY: '0deg',
    scale: 1.02
  },
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
}, 300)
.build()
```

---

## Migration Guide

### From Basic CSS

```typescript
// Before (CSS)
.element {
  transform: scale(1.1) rotate(45deg);
  backdrop-filter: blur(10px);
  background: linear-gradient(45deg, blue, red);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

// After (tachUI)
Text("Element")
  .modifier
  .transform({
    scale: 1.1,
    rotate: '45deg'
  })
  .backdropFilter({ blur: 10 })
  .gradientText('linear-gradient(45deg, blue, red)')
  .build()
```

### From Other Frameworks

The tachUI CSS Features API is designed to be intuitive for developers familiar with SwiftUI, React Native, or CSS-in-JS libraries, providing a declarative approach to complex visual effects.

---

This completes the comprehensive API documentation for Phase 2 CSS Features. All functions include full TypeScript support, browser compatibility, and accessibility considerations.