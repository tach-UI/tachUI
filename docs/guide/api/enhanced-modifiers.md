# Enhanced Modifiers API Reference

Enhanced versions of existing modifiers with backward compatibility and modern CSS feature support.

## Overview

The enhanced modifiers system provides powerful extensions to existing tachUI modifiers while maintaining 100% backward compatibility. These enhancements add object-based configuration, SwiftUI alignment terminology, and support for modern CSS features.

### Key Features

- **100% Backward Compatible**: All existing code continues working unchanged
- **Object-Based Configuration**: Advanced configuration options with intuitive APIs
- **SwiftUI Alignment**: Familiar terminology for iOS developers (`leading`/`trailing`)
- **Modern CSS Support**: Latest CSS specifications and features
- **TypeScript Support**: Full type safety with comprehensive interfaces

## Enhanced cornerRadius

Enhanced corner radius modifier with individual corner control and SwiftUI alignment support.

### Basic Usage (Backward Compatible)

```typescript
import { cornerRadius } from '@tachui/core'

// Existing API - works unchanged
Text("Rounded")
  .modifier
  .cornerRadius(10) // All corners
  .build()

Text("Rounded with units")
  .modifier
  .cornerRadius('1rem') // CSS units supported
  .build()
```

### Object Configuration

```typescript
// Individual corners
Text("Custom Corners")
  .modifier
  .cornerRadius({
    topLeft: 15,
    topRight: 5,
    bottomLeft: 5,
    bottomRight: 15
  })
  .build()

// CSS units support
Text("Mixed Units")
  .modifier
  .cornerRadius({
    topLeft: '10px',
    topRight: '50%',
    bottomLeft: '2rem',
    bottomRight: '5vh'
  })
  .build()
```

### Shorthand Properties

```typescript
// Top and bottom shorthand
Text("Horizontal Control")
  .modifier
  .cornerRadius({
    top: 10,    // topLeft and topRight
    bottom: 5   // bottomLeft and bottomRight
  })
  .build()

// Left and right shorthand
Text("Vertical Control")
  .modifier
  .cornerRadius({
    left: 10,   // topLeft and bottomLeft
    right: 5    // topRight and bottomRight
  })
  .build()
```

### SwiftUI Alignment Terminology

```typescript
// SwiftUI terminology (familiar for iOS developers)
Text("SwiftUI Style")
  .modifier
  .cornerRadius({
    topLeading: 10,     // topLeft
    topTrailing: 5,     // topRight
    bottomLeading: 5,   // bottomLeft
    bottomTrailing: 10  // bottomRight
  })
  .build()
```

### Priority Resolution

```typescript
// Specific values override general ones
Text("Priority Example")
  .modifier
  .cornerRadius({
    top: 10,
    topLeft: 15,  // Overrides top for topLeft
    left: 8,
    bottomLeft: 20 // Overrides left for bottomLeft
  })
  .build()
```

### Type Reference

```typescript
type CornerRadiusValue = number | string

interface CornerRadiusConfig {
  // Individual corners (CSS terminology)
  topLeft?: CornerRadiusValue
  topRight?: CornerRadiusValue
  bottomLeft?: CornerRadiusValue
  bottomRight?: CornerRadiusValue
  
  // SwiftUI terminology (aliases)
  topLeading?: CornerRadiusValue
  topTrailing?: CornerRadiusValue
  bottomLeading?: CornerRadiusValue
  bottomTrailing?: CornerRadiusValue
  
  // Shorthand properties
  top?: CornerRadiusValue     // topLeft and topRight
  bottom?: CornerRadiusValue  // bottomLeft and bottomRight
  left?: CornerRadiusValue    // topLeft and bottomLeft
  right?: CornerRadiusValue   // topRight and bottomRight
}
```

## Enhanced cursor

Complete CSS cursor support with validation and custom cursor capabilities.

### Basic Usage (Backward Compatible)

```typescript
import { cursor } from '@tachui/core'

// Existing cursors work unchanged
Button("Click Me", handleClick)
  .modifier
  .cursor('pointer')
  .build()
```

### New Cursor Values

```typescript
// New cursor values (7 additional)
Button("Drag Handle", handleDrag)
  .modifier
  .cursor('grab')     // For draggable elements
  .build()

Button("Dragging", handleDrag)
  .modifier
  .cursor('grabbing') // During drag operation
  .build()

Button("Zoom In", handleZoomIn)
  .modifier
  .cursor('zoom-in')
  .build()

Button("Zoom Out", handleZoomOut)
  .modifier
  .cursor('zoom-out')
  .build()

Button("Shortcut", handleShortcut)
  .modifier
  .cursor('alias')    // Shortcut/alias indication
  .build()

Button("Select Cell", handleCellSelect)
  .modifier
  .cursor('cell')     // Table cell selection
  .build()

Button("Copy Item", handleCopy)
  .modifier
  .cursor('copy')     // Copy operation
  .build()
```

### Custom Cursors

```typescript
// Custom cursor with URL
Image("draggable.png")
  .modifier
  .cursor('url(custom-cursor.png), auto') // Custom cursor with fallback
  .build()

// Multiple fallbacks
Button("Custom Action", handleAction)
  .modifier
  .cursor('url(cursor.svg), url(cursor.png), pointer')
  .build()
```

### Complete Cursor Support

```typescript
type CSSCursorValue = 
  // Standard cursors (8 values)
  | 'auto' | 'default' | 'pointer' | 'text' | 'wait' | 'help' | 'not-allowed' | 'none'
  
  // Enhanced cursors (7 new values)
  | 'grab' | 'grabbing' | 'zoom-in' | 'zoom-out' | 'alias' | 'cell' | 'copy'
  
  // Custom cursor support
  | string // CSS cursor syntax: 'url(...), fallback'
```

## Enhanced shadow

Multiple shadow support with Material Design presets and text shadows.

### Basic Usage (Backward Compatible)

```typescript
import { shadow } from '@tachui/core'

// Existing API works unchanged
Button("Drop Shadow", handleClick)
  .modifier
  .shadow({ x: 2, y: 4, blur: 8, color: 'rgba(0,0,0,0.2)' })
  .build()
```

### Multiple Shadows

```typescript
import { shadows } from '@tachui/core'

// Multiple shadow layers
Button("Layered Shadow", handleClick)
  .modifier
  .shadows([
    { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.1)' },   // Subtle inner
    { x: 0, y: 4, blur: 6, color: 'rgba(0,0,0,0.1)' },   // Medium
    { x: 0, y: 8, blur: 25, color: 'rgba(0,0,0,0.12)' }  // Large outer
  ])
  .build()
```

### Advanced Shadow Features

```typescript
// Inset shadows
Button("Inset Shadow", handleClick)
  .modifier
  .shadow({
    x: 0, y: 2, blur: 4, 
    color: 'rgba(0,0,0,0.1)',
    inset: true
  })
  .build()

// Spread parameter
Button("Shadow with Spread", handleClick)
  .modifier
  .shadow({
    x: 0, y: 4, blur: 12, spread: 2,
    color: 'rgba(0,122,255,0.3)'
  })
  .build()
```

### Text Shadows

```typescript
import { textShadow } from '@tachui/core'

// Single text shadow
Text("Shadowed Text")
  .modifier
  .textShadow({ x: 1, y: 1, blur: 2, color: 'rgba(0,0,0,0.3)' })
  .build()

// Multiple text shadows
Text("Multi-layered Text")
  .modifier
  .textShadow([
    { x: 1, y: 1, blur: 2, color: 'rgba(0,0,0,0.3)' },
    { x: 2, y: 2, blur: 4, color: 'rgba(0,122,255,0.2)' }
  ])
  .build()
```

### Material Design Presets

```typescript
import { shadowPreset } from '@tachui/core'

// Material Design elevation
Button("Elevation 1", handleClick)
  .modifier
  .shadowPreset('elevation-1')
  .build()

Button("Elevation 2", handleClick)
  .modifier
  .shadowPreset('elevation-2')
  .build()

// Custom depth presets
Button("Small Depth", handleClick)
  .modifier
  .shadowPreset('depth-small')
  .build()

Button("Medium Depth", handleClick)
  .modifier
  .shadowPreset('depth-medium')
  .build()

Button("Large Depth", handleClick)
  .modifier
  .shadowPreset('depth-large')
  .build()
```

### Custom Shadow Presets

```typescript
import { createShadowPreset } from '@tachui/core'

// Create custom preset
createShadowPreset('brand-shadow', [
  { x: 0, y: 2, blur: 4, color: 'rgba(0,122,255,0.2)' },
  { x: 0, y: 8, blur: 16, color: 'rgba(0,122,255,0.1)' }
])

// Use custom preset
Button("Brand Shadow", handleClick)
  .modifier
  .shadowPreset('brand-shadow')
  .build()
```

### Type Reference

```typescript
interface ShadowConfig {
  x: number                    // Horizontal offset
  y: number                    // Vertical offset
  blur: number                 // Blur radius
  spread?: number              // Spread radius (default: 0)
  color: string                // Shadow color
  inset?: boolean              // Inset shadow (default: false)
  type?: 'drop' | 'inner' | 'text'  // Shadow type (default: 'drop')
}
```

## Note: Border Modifiers

Border modifier functionality has been consolidated into the main border API in `@tachui/core`. All advanced border features (SwiftUI terminology, shorthand properties, border images, integrated corner radius) are now available directly through the main `border()` modifier and its related functions.

See the [Border Modifiers API Reference](/api/modifiers.md#border-modifiers) for complete documentation.

## Enhanced scroll

Modern scroll behaviors with scroll snap and overscroll control.

### Basic Scroll Configuration

```typescript
import { scroll } from '@tachui/core'

// Comprehensive scroll configuration
ScrollView([...])
  .modifier
  .scroll({
    behavior: 'smooth',                    // scroll-behavior
    margin: { top: 10, bottom: 20 },      // scroll-margin
    padding: { left: 5, right: 10 },      // scroll-padding  
    snap: {                               // scroll-snap-*
      type: 'y mandatory',
      align: 'start'
    }
  })
  .build()
```

### Individual Scroll Modifiers

```typescript
import { scrollBehavior, overscrollBehavior } from '@tachui/core'

// Smooth scrolling
ScrollView([...])
  .modifier
  .scrollBehavior('smooth')
  .build()

// Prevent scroll chaining
ScrollView([...])
  .modifier
  .overscrollBehavior('contain')
  .build()
```

### Scroll Margin and Padding

```typescript
// Scroll margin (spacing around scroll targets)
ScrollView([...])
  .modifier
  .scroll({
    margin: { top: 10, bottom: 20 }
  })
  .build()

// Shorthand margin
ScrollView([...])
  .modifier
  .scroll({
    margin: 15 // All sides
  })
  .build()

// Scroll padding (inner spacing for containers)
ScrollView([...])
  .modifier
  .scroll({
    padding: { left: 5, right: 10 }
  })
  .build()
```

### Scroll Snap Behavior

```typescript
// Vertical scroll snap
ScrollView([...])
  .modifier
  .scroll({
    snap: {
      type: 'y mandatory',  // Snap required
      align: 'start'        // Snap to start of elements
    }
  })
  .build()

// Horizontal scroll snap with proximity
ScrollView([...])
  .modifier
  .scroll({
    snap: {
      type: 'x proximity',  // Snap when close
      align: 'center',      // Snap to center
      stop: 'always'        // Always stop at snap points
    }
  })
  .build()
```

### Overscroll Behavior

```typescript
import { overscrollBehaviorX, overscrollBehaviorY } from '@tachui/core'

// Prevent overscroll in both directions
ScrollView([...])
  .modifier
  .overscrollBehavior('contain')
  .build()

// Control individual axes
ScrollView([...])
  .modifier
  .overscrollBehaviorX('none')    // No horizontal overscroll
  .overscrollBehaviorY('auto')    // Default vertical overscroll
  .build()
```

### Type Reference

```typescript
interface ScrollConfig {
  // Scroll behavior
  behavior?: 'auto' | 'smooth'
  
  // Scroll margin (spacing around scroll targets)  
  margin?: number | string | {
    top?: number | string
    right?: number | string
    bottom?: number | string
    left?: number | string
  }
  
  // Scroll padding (inner spacing for scroll containers)
  padding?: number | string | {
    top?: number | string
    right?: number | string  
    bottom?: number | string
    left?: number | string
  }
  
  // Scroll snap behavior
  snap?: {
    type?: 'none' | 'x mandatory' | 'y mandatory' | 'x proximity' | 'y proximity' | 'both mandatory' | 'both proximity'
    align?: 'start' | 'end' | 'center'
    stop?: 'normal' | 'always'
  }
}

type OverscrollBehaviorValue = 'auto' | 'contain' | 'none'
```

## Browser Compatibility

### Modern Features Support

| Feature | Chrome | Firefox | Safari | Edge | Support Level |
|---------|--------|---------|--------|------|---------------|
| Corner Radius Individual | All | All | All | All | **100%** |
| Complete Cursor Values | 79+ | 72+ | 13+ | 79+ | **95%+** |
| Shadow Multiple/Spread | All | All | All | All | **100%** |
| Border Individual Control | All | All | All | All | **100%** |
| Border Image | 15+ | 15+ | 6+ | 12+ | **97%+** |
| Scroll Behavior | 61+ | 36+ | 14+ | 79+ | **95%+** |
| Scroll Margin/Padding | 69+ | 68+ | 14.1+ | 79+ | **94%+** |
| Scroll Snap | 69+ | 68+ | 11+ | 79+ | **95%+** |
| Overscroll Behavior | 63+ | 59+ | 16+ | 18+ | **92%+** |

### Graceful Degradation

All enhanced modifiers are designed to degrade gracefully:

- **Unsupported Properties**: Ignored by older browsers without breaking layout
- **Progressive Enhancement**: Core functionality works everywhere, enhancements activate where supported
- **Fallback Values**: Always provide fallback values in CSS custom properties

## Migration Guide

### From Basic to Enhanced Modifiers

Enhanced modifiers are fully backward compatible. Existing code requires **no changes**:

```typescript
// Existing code continues working
Text("Example")
  .modifier
  .cornerRadius(10)      // ✅ Still works
  .cursor('pointer')     // ✅ Still works  
  .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' }) // ✅ Still works
  .border(1, '#007AFF')  // ✅ Still works
  .build()

// Enhanced features are purely additive
Text("Enhanced")
  .modifier
  .cornerRadius({ topLeft: 10, bottomRight: 5 })  // ✨ New capability
  .cursor('grab')                                  // ✨ New cursor value
  .shadows([shadow1, shadow2])                     // ✨ Multiple shadows
  .border({ leading: { width: 2, color: '#007AFF' } }) // ✨ Individual borders
  .build()
```

### Performance Considerations

Enhanced modifiers have minimal performance impact:

- **Bundle Size**: +4.2KB total for all enhancements
- **Runtime Overhead**: <2ms for enhanced features
- **Memory Usage**: Negligible increase
- **CSS Generation**: Optimized for modern browser engines

### Development vs Production

Some enhanced features include development-only validation:

```typescript
// Development: Warns about unknown cursor values
cursor('invalid-cursor') // ⚠️ Console warning in development

// Production: No validation overhead
cursor('invalid-cursor') // Silent - optimized for performance
```

## Best Practices

### 1. Use Semantic Values

```typescript
// ✅ Good: Semantic values
cornerRadius({ top: 8, bottom: 0 }) // Card with top rounding

// ❌ Avoid: Arbitrary values without purpose
cornerRadius({ topLeft: 7, topRight: 13, bottomLeft: 2, bottomRight: 19 })
```

### 2. Leverage SwiftUI Terminology

```typescript
// ✅ Good: Use SwiftUI terms for iOS developer familiarity
border({ leading: borderSpec, trailing: borderSpec })

// ✅ Also good: Use CSS terms for web developer familiarity  
border({ left: borderSpec, right: borderSpec })
```

### 3. Combine with Design Systems

```typescript
// ✅ Good: Use with design tokens
cornerRadius({ 
  top: designTokens.radius.medium,
  bottom: designTokens.radius.small 
})

shadowPreset('elevation-2') // Material Design integration
```

### 4. Progressive Enhancement

```typescript
// ✅ Good: Graceful fallback
Text("Modern Text")
  .modifier
  .textShadow({ x: 1, y: 1, blur: 2, color: 'rgba(0,0,0,0.3)' })
  .build()
  
// Text remains readable even if text-shadow isn't supported
```

### 5. Performance Optimization

```typescript
// ✅ Good: Reuse shadow presets
shadowPreset('elevation-2')

// ❌ Avoid: Recreating identical shadows
shadows([
  { x: 0, y: 3, blur: 6, color: 'rgba(0,0,0,0.15)' },
  { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.12)' }
])
```

## Advanced Examples

### Card Component with Enhanced Modifiers

```typescript
const Card = () => {
  return VStack([
    Text("Card Title")
      .modifier
      .textShadow({ x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.1)' })
      .build(),
    
    Text("Card content with enhanced styling")
      .modifier
      .build()
  ])
  .modifier
  .cornerRadius({ top: 12, bottom: 8 })
  .border({
    top: { width: 1, color: '#e0e0e0' },
    horizontal: { width: 0.5, color: '#f0f0f0' },
    bottom: { width: 2, color: '#007AFF' }
  })
  .shadowPreset('elevation-2')
  .build()
}
```

### Interactive Button with State-Based Styling

```typescript
const InteractiveButton = (isPressed: boolean) => {
  return Button("Interactive", () => {})
    .modifier
    .cornerRadius({ topLeading: 8, topTrailing: 8, bottomLeading: 4, bottomTrailing: 4 })
    .cursor('pointer')
    .shadows(isPressed ? [
      { x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.2)', inset: true }
    ] : [
      { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' },
      { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.15)' }
    ])
    .build()
}
```

### Responsive Scroll Container

```typescript
const ResponsiveScrollContainer = (content: any[]) => {
  return ScrollView(content)
    .modifier
    .scroll({
      behavior: 'smooth',
      margin: { top: 20 },
      snap: {
        type: 'y mandatory',
        align: 'start'
      }
    })
    .overscrollBehavior('contain')
    .cornerRadius({ top: 16 })
    .border({
      top: { width: 1, color: '#e0e0e0' },
      horizontal: { width: 1, color: '#f0f0f0' }
    })
    .build()
}
```

The enhanced modifiers provide a powerful foundation for building sophisticated, accessible, and performant user interfaces while maintaining the simplicity and familiarity of the original tachUI modifier system.