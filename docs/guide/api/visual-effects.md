# Visual Effects API

Comprehensive visual effects system including CSS filters, backdrop filters, shadows, and glassmorphism effects for modern UI design.

## Overview

The visual effects system provides:

- **CSS Filters** - blur, brightness, contrast, saturation, etc.
- **Backdrop Filters** - glassmorphism and background blur effects  
- **Shadow System** - box shadows, text shadows, and presets
- **Filter Presets** - vintage, black & white, vibrant effects
- **Performance Optimization** - Hardware-accelerated effects

## CSS Filters

### Basic Filter Modifiers

```typescript
import { Image, Text, VStack } from '@tachui/core'

// Blur effect
Image({ src: 'photo.jpg' })
  .modifier
  .blur(5) // 5px blur
  .build()

// Brightness adjustment
VStack()
  .modifier
  .brightness(1.2) // 20% brighter
  .build()

// Contrast enhancement
Text("High Contrast")
  .modifier
  .contrast(1.5)
  .build()

// Saturation control
Image({ src: 'landscape.jpg' })
  .modifier
  .saturation(0.8) // Slightly desaturated
  .build()
```

### Advanced Filters

```typescript
import { VStack } from '@tachui/core'

// Hue rotation
VStack()
  .modifier
  .hueRotation(90) // 90 degree hue shift
  .build()

// Grayscale conversion
Image({ src: 'color-photo.jpg' })
  .modifier
  .grayscale(1) // Full grayscale
  .build()

// Color inversion
Text("Inverted Colors")
  .modifier
  .colorInvert(1) // Full inversion
  .build()

// Drop shadow filter
VStack()
  .modifier
  .dropShadow({
    x: 4,
    y: 4, 
    blur: 8,
    color: 'rgba(0,0,0,0.3)'
  })
  .build()
```

### Filter Combinations

```typescript
import { Image } from '@tachui/core'

// Multiple filters
Image({ src: 'photo.jpg' })
  .modifier
  .blur(2)
  .brightness(1.1)
  .contrast(1.2)
  .saturation(1.3)
  .build()

// Custom filter string
VStack()
  .modifier
  .filter('blur(3px) sepia(0.5) hue-rotate(45deg)')
  .build()
```

## Filter Presets

Predefined filter combinations for common effects:

```typescript
import { Image } from '@tachui/core'

// Vintage photo effect
Image({ src: 'photo.jpg' })
  .modifier
  .vintagePhoto(0.8) // 80% intensity
  .build()

// Black and white
Image({ src: 'color-photo.jpg' })
  .modifier
  .blackAndWhite(1.0) // Full B&W
  .build()

// Vibrant colors
Image({ src: 'landscape.jpg' })
  .modifier
  .vibrant(1.3) // Enhanced vibrancy
  .build()

// Warm tone
Image({ src: 'portrait.jpg' })
  .modifier
  .warmTone(0.6)
  .build()

// Cool tone
Image({ src: 'cityscape.jpg' })
  .modifier
  .coolTone(0.7)
  .build()

// Faded look
Image({ src: 'retro.jpg' })
  .modifier
  .faded(0.8, 0.9) // brightness, contrast
  .build()
```

### Creative Filter Presets

```typescript
import { VStack, Image } from '@tachui/core'

// High key (bright, airy)
Image({ src: 'portrait.jpg' })
  .modifier
  .highKey(1.2, 0.9) // brightness, contrast
  .build()

// Low key (dark, dramatic)
Image({ src: 'moody.jpg' })
  .modifier
  .lowKey(0.8, 1.4) // brightness, contrast
  .build()

// Soft focus
Image({ src: 'dreamy.jpg' })
  .modifier
  .softFocus(2) // Blur amount
  .build()

// High contrast mode (accessibility)
VStack()
  .modifier
  .highContrastMode()
  .build()

// Subtle blur
VStack()
  .modifier
  .subtleBlur() // Light blur for depth
  .build()

// Dark mode invert
VStack()
  .modifier
  .darkModeInvert() // Auto-invert in dark mode
  .build()
```

## Backdrop Filters

Background blur and glassmorphism effects:

### Basic Backdrop Filter

```typescript
import { VStack } from '@tachui/core'

// Simple backdrop blur
VStack()
  .modifier
  .backdropFilter({ blur: 10 })
  .backgroundColor('rgba(255, 255, 255, 0.2)')
  .build()

// Backdrop with saturation
VStack()
  .modifier
  .backdropFilter({ 
    blur: 15,
    saturate: 1.8,
    brightness: 1.1
  })
  .build()
```

### Glassmorphism Effects

```typescript
import { VStack, Text } from '@tachui/core'

// Glassmorphism presets
VStack([
  Text("Glassmorphism Card")
])
.modifier
.glassmorphism('medium') // 'subtle' | 'light' | 'medium' | 'heavy'
.padding(20)
.cornerRadius(16)
.border({ width: 1, color: 'rgba(255,255,255,0.2)' })
.build()

// Custom glassmorphism
VStack()
  .modifier
  .glassmorphism('heavy', 'rgba(0,0,0,0.1)') // Effect + fallback color
  .build()

// Advanced glassmorphism
VStack()
  .modifier
  .backdropFilter({
    blur: 20,
    saturate: 1.4,
    brightness: 1.2
  }, 'rgba(255,255,255,0.15)') // Fallback for unsupported browsers
  .backgroundColor('rgba(255,255,255,0.1)')
  .border({ width: 1, color: 'rgba(255,255,255,0.2)' })
  .build()
```

## Shadow System

### Box Shadows

```typescript
import { VStack, Button } from '@tachui/core'

// Basic shadow
VStack()
  .modifier
  .shadow({ x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.1)' })
  .build()

// Multiple shadows
VStack()
  .modifier
  .shadows([
    { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.1)' },
    { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.05)' }
  ])
  .build()

// Shadow presets
Button("Small Shadow")
  .modifier
  .shadowPreset('small')
  .build()

Button("Medium Shadow")
  .modifier
  .shadowPreset('medium')
  .build()

Button("Large Shadow")
  .modifier
  .shadowPreset('large')
  .build()
```

### Text Shadows

```typescript
import { Text } from '@tachui/core'

// Basic text shadow
Text("Shadowed Text")
  .modifier
  .textShadow({ x: 2, y: 2, blur: 4, color: 'rgba(0,0,0,0.3)' })
  .build()

// Glowing text effect
Text("Glowing Text")
  .modifier
  .textShadow({ x: 0, y: 0, blur: 10, color: '#4F46E5' })
  .foregroundColor('#4F46E5')
  .build()

// Multiple text shadows
Text("Complex Shadow")
  .modifier
  .css({
    textShadow: `
      1px 1px 2px rgba(0,0,0,0.3),
      0 0 10px rgba(79,70,229,0.5),
      0 0 20px rgba(79,70,229,0.3)
    `
  })
  .build()
```

## Performance Considerations

### Hardware Acceleration

Visual effects automatically use hardware acceleration where possible:

```typescript
// ✅ Hardware accelerated effects
.blur(5)                    // GPU accelerated
.brightness(1.2)           // GPU accelerated  
.backdropFilter({ blur: 10 }) // GPU accelerated

// ✅ Force hardware acceleration
.css({ willChange: 'filter' }) // Hint to browser

// ❌ Avoid excessive effects
.blur(50)                  // Very expensive
.filter('blur(50px) contrast(200%)') // Too many filters
```

### Optimized Filter Chains

```typescript
import { Image } from '@tachui/core'

// ✅ Good - Efficient filter combination
Image({ src: 'photo.jpg' })
  .modifier
  .filter('blur(3px) brightness(1.1) contrast(1.2)')
  .build()

// ✅ Better - Use presets for common combinations
Image({ src: 'photo.jpg' })
  .modifier
  .vintagePhoto(0.8) // Optimized preset
  .build()

// ❌ Avoid - Too many individual filters
Image({ src: 'photo.jpg' })
  .modifier
  .blur(3)
  .brightness(1.1)
  .contrast(1.2)
  .saturation(1.3)
  .hueRotation(15)
  .build()
```

## Responsive Visual Effects

Visual effects work with responsive modifiers:

```typescript
import { VStack } from '@tachui/core'

VStack()
  .modifier
  .responsive()
  .xs(() => blur(2))
  .md(() => blur(5))
  .lg(() => blur(8))
  .build()

// Conditional effects based on theme
const [theme] = useTheme()

VStack()
  .modifier
  .css({
    filter: theme === 'dark' 
      ? 'brightness(0.8) contrast(1.2)' 
      : 'brightness(1.0) contrast(1.0)'
  })
  .build()
```

## Animation with Visual Effects

Animate visual effects smoothly:

```typescript
import { VStack, createSignal } from '@tachui/core'

const [isBlurred, setBlurred] = createSignal(false)

VStack()
  .modifier
  .filter(() => `blur(${isBlurred() ? 10 : 0}px)`)
  .transition('filter', 300, 'ease-out')
  .onTap(() => setBlurred(!isBlurred()))
  .build()

// Hover blur effect
VStack()
  .modifier
  .blur(0)
  .transition('filter', 200)
  .hover({ filter: 'blur(3px)' })
  .build()
```

## Accessibility Considerations

### Reduced Motion Support

```typescript
import { VStack } from '@tachui/core'

// Respect user preferences
VStack()
  .modifier
  .css({
    filter: 'blur(5px)',
    transition: 'filter 0.3s ease',
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none'
    }
  })
  .build()
```

### High Contrast Support

```typescript
// Adjust effects for high contrast mode
VStack()
  .modifier
  .css({
    filter: 'blur(3px)',
    '@media (prefers-contrast: high)': {
      filter: 'none' // Remove blur in high contrast
    }
  })
  .build()
```

## Browser Support

- **CSS Filters**: 97%+ browser support (IE13+, all modern browsers)
- **Backdrop Filters**: 94%+ browser support (Chrome 76+, Safari 9+)
- **Filter Presets**: Full support with graceful fallbacks
- **Hardware Acceleration**: Automatic on supporting browsers

## Common Effect Recipes

### Card with Glassmorphism

```typescript
import { VStack, Text } from '@tachui/core'

const GlassCard = (children: any) =>
  VStack(children)
    .modifier
    .glassmorphism('medium')
    .padding(24)
    .cornerRadius(16)
    .border({ width: 1, color: 'rgba(255,255,255,0.2)' })
    .shadow({ x: 0, y: 8, blur: 32, color: 'rgba(0,0,0,0.12)' })
    .build()
```

### Image Overlay Effect

```typescript
import { VStack, Image, Text } from '@tachui/core'

const ImageOverlay = ({ src, title }: { src: string, title: string }) =>
  VStack([
    Image({ src })
      .modifier
      .blur(2)
      .brightness(0.7)
      .css({ position: 'absolute', inset: 0 })
      .build(),
    
    Text(title)
      .modifier
      .foregroundColor('white')
      .textShadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.8)' })
      .css({ position: 'relative', zIndex: 1 })
      .build()
  ])
  .modifier
  .css({ position: 'relative' })
  .build()
```

### Loading Blur Effect

```typescript
import { VStack, createSignal } from '@tachui/core'

const [isLoading, setLoading] = createSignal(true)

const BlurredContent = (children: any) =>
  VStack(children)
    .modifier
    .blur(() => isLoading() ? 5 : 0)
    .transition('filter', 300, 'ease-out')
    .build()
```