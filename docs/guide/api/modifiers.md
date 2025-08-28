# Modifiers API Reference

Comprehensive API reference for TachUI's modifier system. TachUI provides 100+ modifiers that enable SwiftUI-style declarative styling with full TypeScript support and reactive capabilities.

## Table of Contents

- [Quick Start](#quick-start)
- [Layout Modifiers](#layout-modifiers)
- [SwiftUI-Style Modifiers](#swiftui-style-modifiers)
- [Appearance Modifiers](#appearance-modifiers)
- [Interaction Modifiers](#interaction-modifiers)
- [Animation Modifiers](#animation-modifiers)
- [Navigation Modifiers](#navigation-modifiers)
- [Content Modifiers](#content-modifiers)
- [Raw CSS Modifiers](#raw-css-modifiers)
- [Reactive Modifiers](#reactive-modifiers)
- [Modifier Priority](#modifier-priority)

## Quick Start

All TachUI components support the fluent modifier API:

```typescript
import { Text, createSignal } from '@tachui/core'

Text("Hello World")
  .modifier
  .foregroundColor('#007AFF')
  .fontSize(18)
  .fontWeight('bold')
  .padding(16)
  .backgroundColor('#F8F9FA')
  .cornerRadius(8)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
  .build()
```

## Layout Modifiers

### Frame & Sizing

#### `.frame(width?, height?)`
Sets component dimensions with support for constraints.

```typescript
// Basic frame
Text("Content").modifier.frame(200, 100).build()

// With constraints
VStack().modifier
  .frame({ width: 300, maxHeight: 500, minWidth: 200 })
  .build()

// Infinity support
HStack().modifier.frame({ width: Infinity, height: 50 }).build()
```

**Parameters:**
- `width`: `number | string | typeof Infinity` - Width value
- `height`: `number | string | typeof Infinity` - Height value
- `options`: `FrameOptions` - Detailed configuration

**FrameOptions:**
```typescript
interface FrameOptions {
  width?: number | string | typeof Infinity
  height?: number | string | typeof Infinity
  minWidth?: number | string
  maxWidth?: number | string | typeof Infinity
  minHeight?: number | string
  maxHeight?: number | string | typeof Infinity
  flex?: number | string
}
```

#### Size Shortcuts

```typescript
// Individual dimensions
.width(200)           // Set width
.height(100)          // Set height
.maxWidth('100%')     // Set maximum width
.minWidth(200)        // Set minimum width
.maxHeight(400)       // Set maximum height
.minHeight(100)       // Set minimum height
```

### Padding & Spacing

#### `.padding(value)`
Sets padding with multiple syntax options.

```typescript
// All sides equal
.padding(16)

// Horizontal and vertical
.padding(16, 24)  // vertical: 16, horizontal: 24

// All sides
.padding(8, 16, 12, 20)  // top, right, bottom, left

// Object syntax
.padding({ all: 16 })
.padding({ horizontal: 20, vertical: 12 })
.padding({ top: 8, bottom: 16, left: 12, right: 12 })
```

#### Padding Shortcuts

```typescript
.paddingTop(8)           // Top padding
.paddingBottom(12)       // Bottom padding
.paddingLeft(10)         // Left padding
.paddingRight(10)        // Right padding
.paddingLeading(10)      // Leading (LTR-aware)
.paddingTrailing(10)     // Trailing (LTR-aware)
.paddingHorizontal(16)   // Left + right
.paddingVertical(12)     // Top + bottom
```

#### `.margin(value)`
Sets margin with type-safe options.

```typescript
// All sides equal
.margin(16)

// Symmetric spacing
.margin({ vertical: 12, horizontal: 8 })

// Individual sides
.margin({ top: 8, bottom: 16, left: 12, right: 12 })
```

**MarginOptions:**
```typescript
type MarginOptions = 
  | { all: number }
  | { vertical: number; horizontal: number }
  | { top?: number; right?: number; bottom?: number; left?: number; vertical?: number; horizontal?: number }
```

### Layout Priority

#### `.layoutPriority(priority)`
Sets layout priority for ZStack sizing calculations.

```typescript
VStack().modifier.layoutPriority(1).build()  // Higher priority
Text("Content").modifier.layoutPriority(0).build()  // Lower priority
```

## SwiftUI-Style Modifiers

### Core Transform Modifiers

#### `.scaleEffect(x, y?, anchor?)` ✨ **NEW**
SwiftUI-compatible scaling with anchor point support.

```typescript
// Uniform scaling
.scaleEffect(1.5)  // Scale by 150%

// Non-uniform scaling  
.scaleEffect(1.2, 0.8)  // 120% width, 80% height

// With anchor point
.scaleEffect(1.1, undefined, 'topLeading')  // Scale from top-left corner
```

**Anchor Points:**
`'center' | 'top' | 'bottom' | 'leading' | 'trailing' | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'`

#### `.offset(x, y)`
SwiftUI-style position offset with reactive support.

```typescript
// Static offset
.offset(10, -5)

// Reactive offset with signals
const [isActive, setIsActive] = createSignal(false)
.offset(() => isActive() ? 20 : 0, () => isActive() ? -10 : 0)
```

#### `.clipped()`
Clips content overflow (sets `overflow: hidden`).

```typescript
Image("/large-image.jpg")
  .modifier
  .frame(100, 100)
  .clipped()  // Hide overflow content
  .build()
```

#### `.rotationEffect(angle, anchor?)`
Rotates element with 9 anchor point options.

```typescript
// Basic rotation (center anchor)
.rotationEffect(45)

// With specific anchor
.rotationEffect(30, 'topLeading')
.rotationEffect(-15, 'bottomTrailing')
```

**Anchor Points:**
`'center' | 'top' | 'bottom' | 'leading' | 'trailing' | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'`

### Layout & Visual Modifiers

#### `.aspectRatio(ratio?, contentMode?)`
Maintains aspect ratio with fit/fill modes.

```typescript
// 16:9 aspect ratio
.aspectRatio(16/9, 'fit')
.aspectRatio(1, 'fill')  // Square

// From existing content
.aspectRatio(undefined, 'fit')  // Preserve original ratio
```

**Content Modes:**
- `'fit'` - Scale to fit within bounds
- `'fill'` - Scale to fill bounds (may crop)

#### `.fixedSize(horizontal?, vertical?)`
Prevents element shrinking in layout.

```typescript
.fixedSize()              // Both axes
.fixedSize(true, false)   // Horizontal only
.fixedSize(false, true)   // Vertical only
```

#### `.clipShape(shape, parameters?)`
Clips to custom shapes using CSS clip-path.

```typescript
// Circle clipping
.clipShape('circle')
.clipShape('circle', { radius: '60%' })

// Ellipse clipping
.clipShape('ellipse', { radiusX: '50%', radiusY: '30%' })

// Rectangle with insets
.clipShape('rect', { inset: 10 })

// Polygon (triangle)
.clipShape('polygon', { points: '50% 0%, 0% 100%, 100% 100%' })
```

#### `.overlay(content, alignment?)`
Overlays content with alignment options.

```typescript
Image("/photo.jpg")
  .modifier
  .overlay(
    Text("Caption").modifier.foregroundColor('white').build(),
    'bottomTrailing'
  )
  .build()
```

**Alignment Options:**
`'center' | 'top' | 'bottom' | 'leading' | 'trailing' | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'`

## Appearance Modifiers

### Colors

#### `.foregroundColor(color)`
Sets text/foreground color with Asset support.

```typescript
.foregroundColor('#007AFF')        // Hex color
.foregroundColor('rgb(0,122,255)') // RGB
.foregroundColor(Assets.primary)   // Asset reference
```

#### `.backgroundColor(color)`
Sets background color with Asset support.

```typescript
.backgroundColor('#F8F9FA')
.backgroundColor(Assets.surface)
.backgroundColor(() => isDark() ? '#1A1A1A' : '#FFFFFF')  // Reactive
```

#### `.opacity(value)`
Sets element opacity (0-1).

```typescript
.opacity(0.8)
.opacity(() => isVisible() ? 1 : 0)  // Reactive
```

### Typography

#### `.font(options | size)`
Complete font configuration or size shorthand.

```typescript
// Size shorthand
.font(18)

// Complete configuration
.font({
  family: 'Inter, sans-serif',
  size: 18,
  weight: '600',
  style: 'italic'
})

// Asset fonts
.font({
  family: Assets.bodyFont,
  size: 16,
  weight: '400'
})
```

**FontOptions:**
```typescript
interface FontOptions {
  family?: string
  size?: number | string
  weight?: FontWeight
  style?: 'normal' | 'italic' | 'oblique'
  variant?: 'normal' | 'small-caps'
}

type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
```

#### Typography Shortcuts

```typescript
.fontSize(18)               // Font size
.fontWeight('600')          // Font weight
.textAlign('center')        // Text alignment
.textCase('uppercase')      // Text transformation
.letterSpacing('0.5px')     // Letter spacing
.lineHeight(1.5)            // Line height
```

### Borders & Visual Effects

## Border Modifiers

Comprehensive border styling with SwiftUI-inspired syntax, reactive Signal support, and advanced features.

#### `.border(options)` / `.border(width, color?, style?)`
Main border modifier with flexible API supporting simple shorthand or advanced object configuration.

**Simple Usage:**
```typescript
.border(1)                              // 1px solid border
.border(2, '#007AFF')                   // Colored border
.border('2px', '#007AFF', 'dashed')     // String width support
.border(1, '#E5E5E7', 'dashed')         // Dashed border
```

**Advanced Object Configuration:**
```typescript
// Individual sides
.border({
  top: { width: 2, color: '#007AFF', style: 'solid' },
  right: { width: 1, color: '#FF3B30', style: 'dashed' },
  bottom: { width: 3, color: '#34C759', style: 'dotted' },
  left: { width: 1, color: '#FF9500' }
})

// SwiftUI terminology (LTR-aware)
.border({
  leading: { width: 2, color: '#007AFF' },      // Maps to left
  trailing: { width: 1, color: '#FF3B30' },     // Maps to right
  top: { width: 1, color: '#34C759' }
})

// Shorthand properties
.border({
  horizontal: { width: 2, color: '#007AFF' },   // Left + right
  vertical: { width: 1, color: '#ddd' }         // Top + bottom
})
```

**Advanced Features:**
```typescript
// Border images
.border({
  width: 5,
  image: 'linear-gradient(45deg, #007AFF, #FF3B30)',
  style: 'solid'
})

// Integrated corner radius
.border({
  width: 2,
  color: '#007AFF',
  style: 'solid',
  radius: { topLeft: 8, topRight: 8 }  // Corner radius with border
})

// Reactive values with Signals
.border({
  width: () => isActive() ? 2 : 1,
  color: () => theme().borderColor,
  style: 'dashed'
})
```

#### Border Direction Functions
Convenient functions for applying borders to specific sides.

```typescript
.borderTop(2, '#007AFF', 'solid')       // Top border only
.borderRight('1px', '#ddd')             // Right border only
.borderBottom(1, '#e0e0e0', 'dotted')   // Bottom border only
.borderLeft(3, '#34C759')               // Left border only

// SwiftUI-style (LTR-aware)
.borderLeading(2, '#007AFF')            // Leading border (maps to left)
.borderTrailing(1, '#ddd', 'dashed')    // Trailing border (maps to right)

// Shorthand functions
.borderHorizontal(1, '#007AFF', 'solid') // Left + right borders
.borderVertical(2, '#e0e0e0')            // Top + bottom borders
```

#### Reactive Border Support
All border properties support reactive Signals and Asset integration.

```typescript
// Signal integration
const [borderWidth, setBorderWidth] = createSignal(1)
const [borderColor, setBorderColor] = createSignal('#007AFF')

.border({
  width: borderWidth,       // Reactive width
  color: borderColor,       // Reactive color
  style: () => isActive() ? 'solid' : 'dashed'
})

// Asset integration
import { Assets } from './assets'
.border(2, Assets.colors.primary, 'solid')  // Automatically resolves Asset
```

#### Border Type Reference

```typescript
interface BorderSide {
  width?: number | string | Signal<number>
  color?: string | Signal<string>
  style?: BorderStyle
}

interface BorderOptions {
  // Individual sides (CSS terminology)
  top?: BorderSide
  right?: BorderSide
  bottom?: BorderSide  
  left?: BorderSide
  all?: BorderSide
  
  // SwiftUI terminology (aliases)
  leading?: BorderSide      // Maps to left
  trailing?: BorderSide     // Maps to right
  
  // Shorthand properties
  horizontal?: BorderSide   // Left and right
  vertical?: BorderSide     // Top and bottom

  // Convenience properties (applied if no specific sides)
  width?: number | string | Signal<number>
  color?: string | Signal<string>
  style?: BorderStyle
  
  // Advanced features
  image?: string | Signal<string>                           // CSS border-image
  radius?: CornerRadiusConfig | Signal<CornerRadiusConfig>  // Integrated corner radius
}

type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset'
```

#### `.cornerRadius(radius)`
Sets border radius for rounded corners.

```typescript
.cornerRadius(8)     // All corners
.cornerRadius(12)    // More rounded
```

#### `.shadow(options)`
Adds drop shadow with comprehensive options.

```typescript
.shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
.shadow({ x: 0, y: 8, radius: 16, color: 'rgba(0,0,0,0.15)', inset: false })
```

**ShadowOptions:**
```typescript
interface ShadowOptions {
  x?: number          // Horizontal offset
  y?: number          // Vertical offset
  radius?: number     // Blur radius
  color?: string      // Shadow color
  inset?: boolean     // Inset shadow
}
```

### Visual Effects

#### `.backdropFilter(config, fallbackColor?)`
Applies backdrop filter effects with automatic browser compatibility.

```typescript
// Object configuration
.backdropFilter({ blur: 10, saturate: 1.3 })

// With fallback for unsupported browsers
.backdropFilter(
  { blur: 16, brightness: 1.1 }, 
  'rgba(255, 255, 255, 0.85)' // Fallback color
)

// CSS string format
.backdropFilter('blur(20px) saturate(1.5) brightness(1.2)')

// With ColorAsset fallback
import { Colors } from './assets'
.backdropFilter(
  { blur: 12 }, 
  Colors.glass.fallback
)

// Complex filters with drop shadow
.backdropFilter({
  blur: 15,
  brightness: 1.1,
  contrast: 1.05,
  dropShadow: {
    x: 0, y: 4, blur: 6, 
    color: 'rgba(0, 0, 0, 0.2)'
  }
})
```

**BackdropFilterConfig:**
```typescript
interface BackdropFilterConfig {
  blur?: number                    // Blur radius in pixels
  brightness?: number              // Brightness multiplier (1.0 = normal)
  contrast?: number                // Contrast multiplier (1.0 = normal)
  dropShadow?: {                   // Drop shadow configuration
    x: number                      // Horizontal offset
    y: number                      // Vertical offset  
    blur: number                   // Blur radius
    color: string                  // Shadow color
  } | string                       // Or CSS drop-shadow string
  grayscale?: number               // Grayscale amount (0-1)
  hueRotate?: number               // Hue rotation in degrees
  invert?: number                  // Invert amount (0-1)
  opacity?: number                 // Opacity multiplier
  saturate?: number                // Saturation multiplier (1.0 = normal)
  sepia?: number                   // Sepia amount (0-1)
}
```

#### `.glassmorphism(intensity?, customFallback?)`
Convenient glassmorphism presets with optimized parameters.

```typescript
// Preset intensities
.glassmorphism('subtle')   // blur: 3px, minimal enhancement
.glassmorphism('light')    // blur: 8px, light enhancement  
.glassmorphism('medium')   // blur: 16px, balanced enhancement (default)
.glassmorphism('heavy')    // blur: 24px, strong enhancement

// With custom fallback color
.glassmorphism('medium', 'rgba(0, 0, 0, 0.15)')

// With ColorAsset fallback
import { GlassColors } from './design-system'
.glassmorphism('light', GlassColors.primary.fallback)
```

**Glassmorphism Intensity Presets:**
```typescript
type GlassmorphismIntensity = 'subtle' | 'light' | 'medium' | 'heavy'

const PRESETS = {
  subtle: { blur: 3, saturate: 1.05, brightness: 1.05 },
  light: { blur: 8, saturate: 1.15, brightness: 1.1 },
  medium: { blur: 16, saturate: 1.3, brightness: 1.15 },
  heavy: { blur: 24, saturate: 1.5, brightness: 1.2 }
}
```

**Browser Support:**
- Chrome 76+, Safari 14+, Firefox 103+, Edge 79+
- Automatic fallback color for unsupported browsers
- Vendor prefixes applied automatically (`-webkit-backdrop-filter`)
- Development warnings when using fallbacks

#### Standard Visual Effect Modifiers

```typescript
// Individual filter effects
.blur(5)                    // Gaussian blur
.brightness(1.2)            // Brightness adjustment
.contrast(1.3)              // Contrast enhancement  
.saturate(1.8)              // Saturation control (CSS name)
.hueRotate('90deg')         // Hue rotation (CSS name)
.grayscale(0.8)             // Grayscale conversion (0-1)
.invert(1)                  // Color inversion (CSS name)
```

#### SwiftUI-Compatible Visual Effects ✨ **NEW**

```typescript
// SwiftUI naming for seamless migration
.saturation(1.8)            // SwiftUI-style saturation control
.hueRotation('90deg')       // SwiftUI-style hue rotation
.colorInvert()              // SwiftUI-style color inversion (full invert)

// Direct equivalency:
.saturation(0.5) === .saturate(0.5)      // Same behavior
.hueRotation('45deg') === .hueRotate('45deg')  // Same behavior  
.colorInvert() === .invert(1)            // Same behavior
```

## Interaction Modifiers

### Mouse & Touch Events

#### `.onTap(handler)`
Click/tap event handler.

```typescript
.onTap(() => console.log('Tapped!'))
.onTap((event) => {
  event.preventDefault()
  handleClick()
})
```

#### `.onHover(handler)`
Hover state handler (enter/leave combined).

```typescript
const [isHovered, setIsHovered] = createSignal(false)

.onHover((hovered) => {
  setIsHovered(hovered)  // true on enter, false on leave
})
```

#### Individual Mouse Events

```typescript
.onMouseEnter((event) => setHovered(true))
.onMouseLeave((event) => setHovered(false))
.onMouseDown((event) => setPressing(true))
.onMouseUp((event) => setPressing(false))
```

### Focus & Accessibility

#### `.onFocus(handler)`
Focus state handler.

```typescript
.onFocus((focused) => {
  if (focused) {
    // Element gained focus
  } else {
    // Element lost focus
  }
})
```

#### `.accessibilityLabel(label)`
Sets accessibility label for screen readers.

```typescript
.accessibilityLabel('Close dialog button')
```

### State Modifiers

#### `.disabled(isDisabled?)`
Sets disabled state.

```typescript
.disabled(true)                    // Always disabled
.disabled(() => !isValid())        // Reactive disabled state
```

## Animation Modifiers

### Transitions

#### `.transition(options)`
CSS transition configuration.

```typescript
// Single property
.transition({ property: 'opacity', duration: 300 })

// Multiple properties
.transition({ 
  property: 'all', 
  duration: 500, 
  easing: 'ease-out',
  delay: 100 
})
```

**TransitionOptions:**
```typescript
interface TransitionOptions {
  property?: string       // CSS property to animate
  duration?: number      // Duration in milliseconds
  easing?: string        // Timing function
  delay?: number         // Delay in milliseconds
}
```

### Animations

#### `.animation(options)`
CSS animation configuration.

```typescript
.animation({
  name: 'fadeIn',
  duration: 1000,
  iterationCount: 1,
  fillMode: 'forwards'
})
```

### Common Animation Patterns

```typescript
// Hover effect with smooth transition
const [isHovered, setIsHovered] = createSignal(false)

Button("Hover me")
  .modifier
  .backgroundColor(() => isHovered() ? '#0056b3' : '#007AFF')
  .transform(() => isHovered() ? 'scale(1.05)' : 'scale(1)')
  .transition({ property: 'all', duration: 200 })
  .onHover(setIsHovered)
  .build()
```

## Navigation Modifiers

Available with `@tachui/navigation` package:

### Navigation Bar

```typescript
.navigationTitle('Page Title')
.navigationBarTitleDisplayMode('large')
.navigationBarHidden(false)
.navigationBarItems({
  leading: BackButton(),
  trailing: MoreButton()
})
```

### Toolbar

```typescript
.toolbarBackground('#007AFF')
.toolbarForegroundColor('#FFFFFF')
```

## Content Modifiers

Content modifiers control how component content is processed and rendered, with built-in security features for safe HTML rendering.

### `.asHTML(options?)`
**Text Components Only** - Renders Text component content as HTML with built-in sanitization.

> ⚠️ **Security Notice**: This modifier can only be applied to Text components and includes basic XSS protection by default. For production applications handling untrusted HTML content, consider using a comprehensive sanitization library like DOMPurify.

#### Basic Usage

```typescript
import { Text } from '@tachui/core'

// Safe HTML rendering with default sanitization
Text('<p>Hello <strong>world</strong>!</p>')
  .modifier
  .asHTML()
  .build()

// Rich content example
Text(`
  <article>
    <h2>Article Title</h2>
    <p>This paragraph contains <em>emphasized</em> and <strong>bold</strong> text.</p>
    <ul>
      <li>List item 1</li>
      <li>List item 2</li>
    </ul>
    <blockquote>This is a quote</blockquote>
  </article>
`)
  .modifier
  .asHTML()
  .padding(20)
  .backgroundColor('#F8F9FA')
  .cornerRadius(8)
  .build()
```

#### Configuration Options

```typescript
interface AsHTMLOptions {
  // Skip basic sanitization (use with extreme caution)
  skipSanitizer?: boolean
  
  // Custom sanitization function 
  customSanitizer?: (html: string) => string
  
  // Override allowed HTML tags
  allowedTags?: string[]
  
  // Override allowed attributes per tag
  allowedAttributes?: Record<string, string[]>
  
  // Custom dangerous patterns to remove
  customPatterns?: RegExp[]
  
  // Disable DOM validation for performance
  validateDOM?: boolean
  
  // Development-only options
  __suppressWarnings?: boolean
}
```

#### Custom Sanitization

```typescript
// Using DOMPurify for comprehensive sanitization
import DOMPurify from 'dompurify'

Text(userGeneratedContent)
  .modifier
  .asHTML({
    customSanitizer: (html: string) => DOMPurify.sanitize(html)
  })
  .build()

// Custom allowed tags and attributes
Text(articleContent)
  .modifier
  .asHTML({
    allowedTags: ['p', 'strong', 'em', 'a', 'ul', 'li', 'blockquote'],
    allowedAttributes: {
      '*': ['class'],
      'a': ['href', 'target', 'rel']
    }
  })
  .build()

// Skip sanitization for trusted content (dangerous!)
Text(trustedServerTemplate)
  .modifier
  .asHTML({ 
    skipSanitizer: true,
    __suppressWarnings: true  // Suppress development warnings
  })
  .build()
```

#### Security Features

The `asHTML` modifier includes comprehensive security protection:

- **Text Component Restriction**: Only works on Text components to prevent misuse
- **Pattern-based Sanitization**: Removes 40+ common XSS attack vectors
- **DOM Validation**: Additional DOM-based cleaning of dangerous elements
- **URL Sanitization**: Validates and removes dangerous URLs in href/src attributes
- **Development Warnings**: Alerts developers to potentially dangerous content
- **Attribute Cleaning**: Removes event handlers and dangerous attributes

**Blocked Content Examples:**
```typescript
// All of these dangerous patterns are automatically removed:
Text('<script>alert("xss")</script>').modifier.asHTML().build()
// Result: "" (script tags removed)

Text('<img src="x" onerror="alert(1)">').modifier.asHTML().build()  
// Result: '<img src="x">' (event handlers removed)

Text('<a href="javascript:alert(1)">Link</a>').modifier.asHTML().build()
// Result: '<a>Link</a>' (dangerous URLs removed)
```

#### Error Handling

```typescript
// ❌ Throws runtime error - asHTML only works on Text components
Button("Click me")
  .modifier
  .asHTML() // Error: AsHTML modifier can only be applied to Text components
  .build()

// ✅ Correct usage
Text("<button>Safe HTML Button</button>")
  .modifier
  .asHTML()
  .build()
```

#### Performance Considerations

- **Non-reactive**: HTML processing occurs once during creation for optimal performance
- **Pattern-first**: Fast pattern-based sanitization before DOM validation
- **Configurable DOM validation**: Can be disabled for performance in trusted environments

```typescript
// Performance-optimized for trusted content
Text(trustedContent)
  .modifier
  .asHTML({
    validateDOM: false,  // Skip DOM validation
    customPatterns: []   // Skip additional pattern checks
  })
  .build()
```

#### Development Mode Features

In development mode, the modifier provides helpful warnings:

- **Content Analysis**: Warns about potentially dangerous patterns
- **Security Recommendations**: Suggests using comprehensive sanitization libraries
- **Configuration Guidance**: Alerts about disabled security features

```typescript
// Development console output:
// 🔒 AsHTML Security Warnings
// Potentially dangerous content detected in asHTML:
//   • Script tags detected
//   • Event handlers detected
// Consider using a comprehensive sanitization solution like DOMPurify
```

## Raw CSS Modifiers

### `.css(properties)`
Apply raw CSS properties for advanced styling.

```typescript
.css({
  backdropFilter: 'blur(10px)',
  clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)',
  containerType: 'inline-size',
  scrollBehavior: 'smooth'
})
```

### `.cssProperty(property, value)`
Set individual CSS property.

```typescript
.cssProperty('backdrop-filter', 'blur(5px)')
.cssProperty('scroll-snap-type', 'y mandatory')
```

### `.cssVariable(name, value)`
Set CSS custom properties.

```typescript
.cssVariable('primary-color', '#007AFF')
.css({ color: 'var(--primary-color)' })
```

## Reactive Modifiers

All modifiers support reactive values using TachUI signals:

```typescript
import { createSignal } from '@tachui/core'

const [count, setCount] = createSignal(0)
const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
const [isActive, setIsActive] = createSignal(false)

Text(`Count: ${count()}`)
  .modifier
  // Reactive colors
  .foregroundColor(() => theme() === 'dark' ? '#FFFFFF' : '#000000')
  .backgroundColor(() => isActive() ? '#007AFF' : '#F8F9FA')
  
  // Reactive dimensions
  .padding(() => isActive() ? 20 : 16)
  .fontSize(() => count() > 10 ? 20 : 16)
  
  // Reactive transforms
  .offset(() => count() * 2, 0)
  .opacity(() => count() > 0 ? 1 : 0.5)
  
  // Reactive styles
  .css({
    transform: () => `rotate(${count() * 10}deg)`,
    filter: () => isActive() ? 'blur(0px)' : 'blur(2px)'
  })
  .build()
```

## Modifier Priority

Modifiers are applied in priority order to ensure predictable styling:

| Priority | Category | Examples |
|----------|----------|----------|
| 600 | Lifecycle | `.onAppear()`, `.task()` |
| 500 | Interaction | `.onTap()`, `.onHover()`, `.disabled()` |
| 400 | Transform | `.offset()`, `.rotationEffect()` |
| 300 | Layout | `.frame()`, `.padding()`, `.aspectRatio()` |
| 200 | Appearance | `.clipped()`, `.clipShape()`, `.overlay()` |
| 100 | Style | `.foregroundColor()`, `.backgroundColor()`, `.font()` |
| 50 | Border | `.border()`, `.cornerRadius()`, `.shadow()` |
| 10 | Utility | `.cursor()`, `.zIndex()`, `.overflow()` |
| 5 | CSS | `.css()`, `.cssProperty()` |

## Best Practices

### Type Safety

```typescript
// ✅ Type-safe usage
Text('Content')
  .modifier
  .textAlign('center')        // Valid TextAlign value
  .fontSize(16)               // number type
  .fontWeight('600')          // Valid FontWeight
  .build()

// ❌ TypeScript prevents errors
Text('Content')
  .modifier
  .textAlign('invalid')       // Error: not a valid TextAlign
  .fontSize('16px')           // Error: must be number
  .build()
```

### Performance

```typescript
// ✅ Efficient reactive updates
const [theme, setTheme] = createSignal('light')
Text('Content')
  .modifier
  .foregroundColor(() => theme() === 'dark' ? '#FFF' : '#000')  // Only updates when theme changes
  .build()

// ❌ Avoid creating new objects in reactive contexts
Text('Content')
  .modifier
  .font(() => ({ size: 16, weight: '400' }))  // Creates new object on every render
  .build()
```

### Readable Modifier Chains

```typescript
// ✅ Group related modifiers
Text('Title')
  .modifier
  // Typography
  .fontSize(24)
  .fontWeight('bold')
  .textAlign('center')
  
  // Colors
  .foregroundColor('#1A1A1A')
  .backgroundColor('#F8F9FA')
  
  // Layout
  .padding(16)
  .cornerRadius(8)
  
  // Effects
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
  .build()
```

## Examples

### Interactive Card

```typescript
const [isHovered, setIsHovered] = createSignal(false)
const [isPressed, setIsPressed] = createSignal(false)

VStack({
  children: [
    Text('Interactive Card'),
    Text('Hover and click me')
  ]
})
.modifier
.backgroundColor(() => {
  if (isPressed()) return '#E5F3FF'
  if (isHovered()) return '#F0F8FF'
  return '#FFFFFF'
})
.padding(20)
.cornerRadius(12)
.border(1, '#E5E5E7')
.shadow(() => 
  isHovered() 
    ? { x: 0, y: 8, radius: 16, color: 'rgba(0,0,0,0.15)' }
    : { x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' }
)
.transition({ property: 'all', duration: 200 })
.onHover(setIsHovered)
.onMouseDown(() => setIsPressed(true))
.onMouseUp(() => setIsPressed(false))
.onTap(() => console.log('Card clicked!'))
.build()
```

### Responsive Layout

```typescript
const [screenSize, setScreenSize] = createSignal<'mobile' | 'tablet' | 'desktop'>('desktop')

VStack()
  .modifier
  .padding(() => {
    switch (screenSize()) {
      case 'mobile': return { horizontal: 16, vertical: 20 }
      case 'tablet': return { horizontal: 32, vertical: 28 }
      case 'desktop': return { horizontal: 48, vertical: 36 }
    }
  })
  .frame(() => ({
    maxWidth: screenSize() === 'mobile' ? '100%' : 800,
    width: screenSize() === 'mobile' ? '100%' : 'auto'
  }))
  .build()
```

### Complex Visual Effects

```typescript
Image('/hero-image.jpg')
  .modifier
  .resizable()
  .aspectRatio(16/9, 'fill')
  .clipped()
  .overlay(
    VStack({
      children: [
        Text('Hero Title').modifier.fontSize(32).fontWeight('bold').build(),
        Text('Subtitle').modifier.fontSize(18).build()
      ]
    }).modifier.foregroundColor('#FFFFFF').textAlign('center').build(),
    'center'
  )
  .css({
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7))'
  })
  .build()
```

## Advanced Modifier System

TachUI achieves **96% SwiftUI modifier parity** through the comprehensive advanced modifier system, with new SwiftUI-compatible functions added for seamless migration. For complete details including implementation examples, test coverage, and advanced gesture systems, see the [Advanced Modifiers Documentation](../advanced-modifiers.md) and [SwiftUI Compatibility Guide](../guide/swiftui-compatibility).

### Advanced Input/Gesture Modifiers

The latest addition includes sophisticated gesture recognition:

```typescript
// Long press with configurable timing and distance constraints
Button("Hold for Action", () => {})
  .modifier
  .onLongPressGesture({
    minimumDuration: 800,        // 800ms minimum hold
    maximumDistance: 15,         // 15px maximum movement
    perform: () => performAction(),
    onPressingChanged: (pressing) => setIsPressed(pressing)
  })
  .keyboardShortcut('s', ['cmd'], () => save())
  .focused(isFocused)
  .onContinuousHover('local', (coords) => {
    if (coords) setHoverPosition(coords)
  })
  .build()
```

For more examples and patterns, see the [Examples](/examples/) section.