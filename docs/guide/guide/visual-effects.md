# Visual Effects Guide

TachUI provides comprehensive visual effects modifiers for creating stunning, modern user interfaces. From standard filters to advanced backdrop effects and glassmorphism patterns, this guide covers everything you need to know.

## Overview

Visual effects in TachUI are implemented through modifiers that apply CSS filters, backdrop filters, and advanced visual transformations. These modifiers provide:

- **Type Safety**: Full TypeScript support with intelligent autocomplete
- **Browser Compatibility**: Automatic vendor prefixes and graceful fallbacks
- **Performance**: Optimized implementations with hardware acceleration hints
- **Reactive Support**: Full integration with TachUI's signal system
- **Asset Integration**: Support for ColorAssets and design tokens

## Standard Visual Effect Modifiers

### Blur Effects

```typescript
import { Text } from '@tachui/core'

// Basic blur
Text("Blurred content")
  .blur(5)

// Animated blur
const blurAmount = createSignal(0)
Text("Interactive blur")
  .blur(blurAmount)
  .onHover((isHovered) => {
    blurAmount.set(isHovered ? 10 : 0)
  })
```

### Color Adjustments

```typescript
// Brightness adjustment
Text("Bright text")
  .brightness(1.3) // 130% brightness

// Contrast enhancement
Text("High contrast")
  .contrast(1.5) // 150% contrast

// Saturation control
Text("Vibrant colors")
  .saturation(1.8) // 180% saturation

// Grayscale conversion
Text("Monochrome")
  .grayscale(0.8) // 80% grayscale

// Color inversion
Text("Inverted colors")
  .colorInvert(1) // Full inversion
```

### Hue Manipulation

```typescript
// Hue rotation
Text("Color-shifted text")
  .hueRotation(90) // Rotate hue by 90 degrees

// Dynamic hue rotation
const hueValue = createSignal(0)
Text("Rainbow text")
  .hueRotation(hueValue)

// Animate through color spectrum
setInterval(() => {
  hueValue.set((hueValue() + 10) % 360)
}, 100)
```

## Backdrop Filter Modifiers

Backdrop filters apply visual effects to the area behind an element, enabling sophisticated glassmorphism effects with proper browser fallbacks.

### Basic Backdrop Filtering

```typescript
import { VStack, Text } from '@tachui/core'

// Simple backdrop blur
VStack([
  Text("Content behind")
])
.backdropFilter({ blur: 10 })
.backgroundColor('rgba(255, 255, 255, 0.1)')
.padding(20)
.cornerRadius(12)
```

### Advanced Backdrop Configurations

```typescript
// Complex backdrop filter with multiple effects
VStack([
  Text("Glassmorphism Card")
])
.backdropFilter({
  blur: 16,
  brightness: 1.1,
  contrast: 1.05,
  saturate: 1.3
})
.backgroundColor('rgba(255, 255, 255, 0.15)')
.border(1, 'rgba(255, 255, 255, 0.2)')
.cornerRadius(16)
```

### Browser Compatibility & Fallbacks

```typescript
// Backdrop filter with ColorAsset fallback
import { Colors } from './assets'

VStack([
  Text("Cross-browser glassmorphism")
])
.backdropFilter(
  { blur: 12, saturate: 1.2 },
  Colors.glass.fallback // ColorAsset for browsers without backdrop-filter support
)

// Manual fallback color
VStack([
  Text("Manual fallback")
])
.backdropFilter(
  { blur: 15 },
  'rgba(255, 255, 255, 0.85)' // Solid fallback color
)
```

### CSS String Support

```typescript
// Direct CSS backdrop-filter values
VStack([
  Text("CSS backdrop filter")
])
.backdropFilter('blur(20px) saturate(1.5) brightness(1.1)')

// Complex CSS filters
VStack([
  Text("Advanced CSS filter")
])
.backdropFilter('blur(10px) hue-rotate(90deg) drop-shadow(0 4px 8px rgba(0,0,0,0.3))')
```

### Drop Shadow Support

```typescript
// Object-based drop shadow configuration  
VStack([
  Text("Shadow backdrop")
])
.backdropFilter({
  blur: 8,
  dropShadow: {
    x: 0,
    y: 4, 
    blur: 6,
    color: 'rgba(0, 0, 0, 0.2)'
  }
})

// CSS string drop shadow
VStack([
  Text("CSS shadow backdrop")
])
.backdropFilter({
  blur: 10,
  dropShadow: '0px 8px 16px rgba(0, 0, 0, 0.15)'
})
```

## Glassmorphism Design Patterns

TachUI provides convenient presets for achieving popular glassmorphism effects with optimal parameters and automatic fallbacks.

### Glassmorphism Intensity Presets

```typescript
// Subtle glassmorphism
VStack([
  Text("Subtle glass effect")
])
.glassmorphism('subtle') // blur: 3px, minimal saturation

// Light glassmorphism
VStack([
  Text("Light glass effect")  
])
.glassmorphism('light') // blur: 8px, light enhancement

// Medium glassmorphism (default)
VStack([
  Text("Medium glass effect")
])
.glassmorphism('medium') // blur: 16px, balanced enhancement

// Heavy glassmorphism
VStack([
  Text("Heavy glass effect")
])
.glassmorphism('heavy') // blur: 24px, strong enhancement
```

### Custom Glassmorphism

```typescript
import { customGlassmorphism } from '@tachui/core'

// Fine-tuned glassmorphism parameters
VStack([
  Text("Custom glass")
])
.modifier(customGlassmorphism(
  18,   // blur amount
  1.4,  // saturation multiplier  
  1.15, // brightness multiplier
  'rgba(255, 255, 255, 0.12)' // custom fallback
))
```

### Glassmorphism with ColorAssets

```typescript
// Using ColorAssets for consistent theming
import { GlassColors } from './design-system'

VStack([
  Text("Themed glassmorphism")
])
.glassmorphism('medium', GlassColors.primary.fallback)

// Dynamic glassmorphism based on theme
const isDarkMode = createSignal(false)
const glassFallback = () => 
  isDarkMode() ? GlassColors.dark.fallback : GlassColors.light.fallback

VStack([
  Text("Theme-aware glassmorphism")
])
.glassmorphism('light', glassFallback)
```

### Complete Glassmorphism Cards

```typescript
// Production-ready glassmorphism card
const GlassmorphismCard = (content: ComponentInstance) => {
  return VStack([
    content
  ])
  .glassmorphism('medium')
  .backgroundColor('rgba(255, 255, 255, 0.1)')
  .border(1, 'rgba(255, 255, 255, 0.2)', 'solid')
  .cornerRadius(16)
  .padding(24)
  .shadow({
    color: 'rgba(0, 0, 0, 0.1)',
    radius: 20,
    x: 0,
    y: 8
  })
}

// Usage
GlassmorphismCard(
  VStack([
    Text("Glassmorphism Card")
      .fontSize(18)
      .fontWeight('600'),
    Text("Beautiful transparent effects with browser fallbacks")
      .opacity(0.8)
      .marginTop(8)
  ])
)
```

## Reactive Visual Effects

Visual effects integrate seamlessly with TachUI's reactive system for dynamic, interactive experiences.

### Signal-Driven Effects

```typescript
// Interactive blur based on scroll position
const scrollBlur = createSignal(0)

window.addEventListener('scroll', () => {
  const scroll = window.scrollY
  scrollBlur.set(Math.min(scroll / 100, 20)) // Max 20px blur
})

VStack([
  Text("Scroll-reactive backdrop")
])
.backdropFilter({ blur: scrollBlur })
```

### Computed Visual Effects  

```typescript
// Computed glassmorphism intensity
const mouseDistance = createSignal(0)
const glassIntensity = createComputed(() => {
  const distance = mouseDistance()
  if (distance < 50) return 'heavy'
  if (distance < 100) return 'medium'
  if (distance < 200) return 'light'
  return 'subtle'
})

VStack([
  Text("Mouse-aware glassmorphism")
])
.glassmorphism(glassIntensity)
```

### Animation Integration

```typescript
// Smooth backdrop filter transitions
VStack([
  Text("Animated backdrop")
])
.backdropFilter({ blur: 0 })
.transition({ 
  property: 'backdrop-filter', 
  duration: 300, 
  easing: 'ease-out' 
})
.onHover((isHovered) => {
  // Note: Backdrop filter animations require CSS transition setup
  // This is a conceptual example - actual implementation may vary
})
```

## Browser Compatibility

### Supported Browsers

| Browser | Backdrop Filter | Fallback Required |
|---------|----------------|-------------------|
| Chrome 76+ | ✅ Full Support | No |
| Safari 14+ | ✅ Full Support (-webkit-) | No |
| Firefox 103+ | ✅ Full Support | No |
| Edge 79+ | ✅ Full Support | No |
| iOS Safari 14+ | ✅ Full Support | No |
| Android Chrome 76+ | ✅ Full Support | No |

### Automatic Fallbacks

TachUI automatically provides fallbacks for unsupported browsers:

```typescript
// Automatic browser detection and fallback
VStack([
  Text("Cross-browser compatible")
])
.backdropFilter(
  { blur: 15, saturate: 1.3 },
  'rgba(255, 255, 255, 0.85)' // Used in unsupported browsers
)

// Development feedback
// Console info: "TachUI: backdrop-filter not supported, using fallback color: rgba(255, 255, 255, 0.85)"
```

### Manual Browser Support Detection

```typescript
// Check backdrop-filter support manually
const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(1px)') || 
                                CSS.supports('-webkit-backdrop-filter', 'blur(1px)')

if (supportsBackdropFilter) {
  // Use backdrop-filter modifiers
  element.backdropFilter({ blur: 10 })
} else {
  // Use alternative styling
  element.backgroundColor('rgba(255, 255, 255, 0.9)')
}
```

## Performance Optimization

### Hardware Acceleration

```typescript
// Promote elements with backdrop filters to compositing layers
VStack([
  Text("Hardware accelerated")
])
.backdropFilter({ blur: 10 })
.transform('translateZ(0)') // Force hardware acceleration
.css({ willChange: 'backdrop-filter' }) // Hint to browser
```

### Performance Best Practices

1. **Limit Backdrop Filter Elements**: Use sparingly on complex layouts
2. **Optimize Blur Radius**: Lower values perform better
3. **Combine with Transforms**: Use `translate3d` for layer promotion
4. **Test on Mobile**: Backdrop filters can be expensive on mobile devices

```typescript
// Performance-optimized glassmorphism
const OptimizedGlass = () => {
  return VStack([
    Text("Optimized glassmorphism")
  ])
  .glassmorphism('light') // Lighter effects perform better
  .transform('translate3d(0, 0, 0)') // Hardware acceleration
  .css({ willChange: 'backdrop-filter, transform' })
}
```

### Memory Management

```typescript
// Clean up expensive effects when not needed
const [showGlass, setShowGlass] = createSignal(true)

Show(() => showGlass(), () => 
  VStack([
    Text("Conditional glassmorphism")
  ])
  .glassmorphism('medium')
)

// Remove expensive effects when component unmounts
// TachUI handles this automatically through its lifecycle system
```

## Advanced Use Cases

### Modal Overlays

```typescript
const GlassmorphismModal = ({ children }: { children: ComponentInstance[] }) => {
  return VStack([
    VStack(children)
      .glassmorphism('medium')
      .backgroundColor('rgba(255, 255, 255, 0.1)')
      .cornerRadius(20)
      .padding(32)
      .maxWidth(400)
      .shadow({
        color: 'rgba(0, 0, 0, 0.2)',
        radius: 24,
        x: 0,
        y: 12
      })
  ])
  .position('fixed')
  .zIndex(1000)
  .width('100vw')
  .height('100vh')
  .justifyContent('center')
  .alignItems('center')
  .backgroundColor('rgba(0, 0, 0, 0.3)')
}
```

### Navigation Bars

```typescript
const GlassNavigation = ({ items }: { items: NavigationItem[] }) => {
  return HStack(
    items.map(item => 
      Text(item.title)
        .padding({ horizontal: 16, vertical: 8 })
        .cornerRadius(8)
        .onTap(() => item.action())
    )
  )
  .position('fixed')
  .top(0)
  .width('100%')
  .padding(16)
  .backdropFilter({ blur: 20, saturate: 1.8 })
  .backgroundColor('rgba(255, 255, 255, 0.8)')
  .border({ bottom: 1 }, 'rgba(255, 255, 255, 0.3)')
  .zIndex(100)
}
```

### Sidebar Panels

```typescript
const GlassSidebar = ({ isOpen }: { isOpen: Signal<boolean> }) => {
  return Show(() => isOpen(), () =>
    VStack([
      Text("Sidebar Content")
        .fontSize(18)
        .fontWeight('600')
        .marginBottom(16),
      
      // Sidebar content...
    ])
    .glassmorphism('heavy')
    .backgroundColor('rgba(255, 255, 255, 0.15)')
    .width(300)
    .height('100vh')
    .padding(24)
    .position('fixed')
    .right(0)
    .top(0)
    .border({ left: 1 }, 'rgba(255, 255, 255, 0.2)')
    .transition({
      property: 'transform',
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    })
  )
}
```

## Common Patterns

### Card Hierarchies

```typescript
// Different glass intensities for visual hierarchy
const CardStack = () => {
  return VStack([
    // Primary card - strongest glass effect
    VStack([
      Text("Primary Content").fontSize(20).fontWeight('bold')
    ])
    .glassmorphism('heavy')
    .backgroundColor('rgba(255, 255, 255, 0.2)')
    .cornerRadius(16)
    .padding(24),
    
    // Secondary card - medium glass effect  
    VStack([
      Text("Secondary Content").fontSize(16)
    ])
    .glassmorphism('medium')
    .backgroundColor('rgba(255, 255, 255, 0.1)')
    .cornerRadius(12)
    .padding(20)
    .marginTop(16),
    
    // Tertiary card - subtle glass effect
    VStack([
      Text("Tertiary Content").fontSize(14)
    ])
    .glassmorphism('subtle')
    .backgroundColor('rgba(255, 255, 255, 0.05)')
    .cornerRadius(8)
    .padding(16)
    .marginTop(12)
  ])
}
```

### Responsive Glassmorphism

```typescript
const ResponsiveGlass = () => {
  return VStack([
    Text("Responsive glassmorphism")
  ])
  .responsive()
  .mobile(() => ({
    glassmorphism: 'light', // Lighter effects on mobile for performance
    borderRadius: 8
  }))
  .tablet(() => ({
    glassmorphism: 'medium',
    borderRadius: 12
  }))
  .desktop(() => ({
    glassmorphism: 'heavy', // Full effects on desktop
    borderRadius: 16
  }))
}
```

## Troubleshooting

### Common Issues

1. **Backdrop Filter Not Working**: Ensure browser support and check CSS.supports()
2. **Performance Issues**: Reduce blur radius and limit number of backdrop-filtered elements
3. **Fallback Not Showing**: Verify fallbackColor parameter is provided
4. **Mobile Performance**: Use lighter glassmorphism presets on mobile devices

### Debug Mode

```typescript
// Enable development warnings
process.env.NODE_ENV = 'development'

VStack([
  Text("Debug glassmorphism")
])
.glassmorphism('medium', 'rgba(255, 0, 0, 0.5)') // Obvious fallback color for testing

// Console output in unsupported browsers:
// "TachUI: backdrop-filter not supported, using fallback color: rgba(255, 0, 0, 0.5)"
```

## Migration from CSS Modifiers

If you're currently using `.css({ backdropFilter: '...' })`, migrate to the dedicated modifiers:

```typescript
// Old approach
VStack([Text("Glass effect")])
  .css({ backdropFilter: 'blur(10px) saturate(1.5)' })
  .css({ backgroundColor: 'rgba(255, 255, 255, 0.1)' })

// New approach with automatic fallbacks  
VStack([Text("Glass effect")])
  .backdropFilter(
    { blur: 10, saturate: 1.5 },
    'rgba(255, 255, 255, 0.85)' // Automatic fallback
  )
  .backgroundColor('rgba(255, 255, 255, 0.1)')

// Or use presets
VStack([Text("Glass effect")])
  .glassmorphism('medium')
  .backgroundColor('rgba(255, 255, 255, 0.1)')
```

The new backdrop filter modifiers provide better TypeScript support, automatic browser compatibility, and integration with TachUI's asset system.