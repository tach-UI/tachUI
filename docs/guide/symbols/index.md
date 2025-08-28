# TachUI Symbols

SwiftUI-inspired symbol/icon system for TachUI framework providing declarative, reactive, and highly customizable vector icons for web applications.

## Overview

TachUI Symbols brings SwiftUI's powerful Symbol system to web development, offering:

- **SwiftUI-compatible API** - Use familiar SwiftUI Symbol patterns
- **Tree-shaking support** - Only bundle icons you actually use  
- **Multiple icon sets** - Lucide primary, with extensible architecture
- **Reactive properties** - All props support signals for dynamic updates
- **Full accessibility** - WCAG compliant with proper ARIA support
- **Performance optimized** - Caching, lazy loading, and efficient rendering

## Quick Start

### Installation

```bash
npm install @tachui/symbols @tachui/core
# or
pnpm add @tachui/symbols @tachui/core
# or  
yarn add @tachui/symbols @tachui/core
```

### Basic Usage

```typescript
import { Symbol } from '@tachui/symbols'

// Simple icon
const heartIcon = Symbol('heart')

// With modifiers - full TachUI modifier support
const styledIcon = Symbol('star')
  .modifier
  .foregroundColor('#FFD700')
  .frame(32, 32)
  .padding(8)
  .build()
```

## Core Features

### Symbol Variants

```typescript
// Default variant
Symbol('heart')

// Filled variant
Symbol('heart', { variant: 'filled' })

// With SwiftUI-style modifier shortcuts
Symbol('heart')
  .modifier
  .filled()  // Equivalent to .variant('filled')
  .build()
```

### Symbol Scales

```typescript
// Different sizes
Symbol('star', { scale: 'small' })   // 16px
Symbol('star', { scale: 'medium' })  // 24px (default)
Symbol('star', { scale: 'large' })   // 32px

// With modifiers
Symbol('star')
  .modifier
  .scaleLarge()
  .build()
```

### Symbol Effects & Animations

```typescript
// Bounce animation
Symbol('heart', { effect: 'bounce' })

// Pulse with custom speed
Symbol('heart', { 
  effect: 'pulse', 
  effectSpeed: 2 
})

// Heartbeat effect with intensity control
Symbol('heart', { 
  effect: 'heartbeat', 
  effectValue: 0.8,
  effectRepeat: 3
})

// Glow effect for highlights
Symbol('star', { effect: 'glow' })

// With modifiers
Symbol('heart')
  .modifier
  .bounce()
  .build()
```

### Reactive Properties

```typescript
import { createSignal } from '@tachui/core'

const [isFavorited, setIsFavorited] = createSignal(false)
const [color, setColor] = createSignal('#999')

const reactiveHeart = Symbol('heart', {
  variant: () => isFavorited() ? 'filled' : 'none',
  primaryColor: color
})

// Update reactive properties
setIsFavorited(true)
setColor('#ff0000')
```

## Advanced Usage

### Rendering Modes

```typescript
// Monochrome (default)
Symbol('heart', { 
  renderingMode: 'monochrome',
  primaryColor: '#ff0000' 
})

// Palette mode with multiple colors
Symbol('heart', {
  renderingMode: 'palette',
  primaryColor: '#ff0000',
  secondaryColor: '#00ff00',
  tertiaryColor: '#0000ff'
})

// With modifiers
Symbol('heart')
  .modifier
  .palette('#ff0000', '#00ff00', '#0000ff')
  .build()
```

### Accessibility

```typescript
// Custom accessibility label
Symbol('heart', {
  accessibilityLabel: 'Add to favorites'
})

// Detailed description
Symbol('heart', {
  accessibilityLabel: 'Favorite',
  accessibilityDescription: 'Add this item to your favorites list'
})

// Decorative symbols (hidden from screen readers)
Symbol('heart', {
  isDecorative: true
})
```

### Performance Optimization

```typescript
// Eager loading for critical icons
Symbol('heart', { eager: true })

// Fallback for missing icons
Symbol('custom-icon', { 
  fallback: 'heart' 
})

// Preload multiple icons
import { IconLoader } from '@tachui/symbols'

await IconLoader.preloadIcons(['heart', 'star', 'user'])
```

## Icon Sets

### Lucide Icons (Default)

TachUI Symbols uses Lucide as the primary icon set:

```typescript
// Uses Lucide by default
Symbol('heart')

// Explicit icon set
Symbol('heart', { iconSet: 'lucide' })
```

**Available Icons**: 1000+ high-quality icons including:
- UI: `plus`, `minus`, `x`, `check`, `search`, `menu`
- Navigation: `arrow-right`, `arrow-left`, `home`, `settings`  
- Social: `heart`, `star`, `user`, `share`
- Media: `play`, `pause`, `volume`, `camera`

### Tree-Shaking

Only icons you use are bundled:

```typescript
// Only heart icon is bundled
Symbol('heart')

// Bundle size: ~2KB base + ~0.5KB per icon
```

## Integration with TachUI

### Modifier System

Symbols integrate fully with TachUI's modifier system:

```typescript
Symbol('heart')
  .modifier
  .padding(16)
  .foregroundColor('#ff0000')
  .backgroundColor('#f0f0f0')
  .cornerRadius(8)
  .shadow({ x: 0, y: 2, radius: 4 })
  .onTap(() => console.log('Tapped!'))
  .build()
```

### Layout Integration

```typescript
import { VStack, HStack, Text } from '@tachui/core'

const favoriteButton = VStack([
  Symbol('heart')
    .modifier
    .filled()
    .scaleLarge()
    .foregroundColor('#ff0000')
    .build(),
    
  Text('Favorite')
    .modifier
    .fontSize(12)
    .build()
])
.modifier
.padding(16)
.build()
```

## API Reference

### Symbol Function

```typescript
function Symbol(
  name: string | Signal<string>,
  props?: SymbolProps
): ModifiableComponent<SymbolProps>
```

### SymbolProps Interface

```typescript
interface SymbolProps {
  // Core
  name: string | Signal<string>
  iconSet?: string
  
  // Appearance  
  variant?: SymbolVariant | Signal<SymbolVariant>
  scale?: SymbolScale | Signal<SymbolScale>
  weight?: SymbolWeight | Signal<SymbolWeight>
  renderingMode?: SymbolRenderingMode | Signal<SymbolRenderingMode>
  
  // Colors
  primaryColor?: string | Signal<string>
  secondaryColor?: string | Signal<string>
  tertiaryColor?: string | Signal<string>
  
  // Animation
  effect?: SymbolEffect | Signal<SymbolEffect>
  effectValue?: number | Signal<number>
  effectSpeed?: number
  effectRepeat?: number | 'infinite'
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityDescription?: string
  isDecorative?: boolean
  
  // Performance
  eager?: boolean
  fallback?: string
}
```

### Types

```typescript
type SymbolVariant = 'none' | 'filled' | 'slash' | 'circle' | 'square'
type SymbolScale = 'small' | 'medium' | 'large'  
type SymbolWeight = 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
type SymbolRenderingMode = 'monochrome' | 'hierarchical' | 'palette' | 'multicolor'
type SymbolEffect = 'none' | 'bounce' | 'pulse' | 'wiggle' | 'rotate' | 'breathe' | 'shake' | 'heartbeat' | 'glow'
```

## Bundle Size

- **Core Symbol Component**: ~8KB gzipped
- **Lucide Icon Set**: ~2KB base + ~0.5KB per icon (tree-shaken)
- **Complete Feature Set**: ~15-20KB for full functionality

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Modern mobile browsers

## Examples

### Interactive Favorite Button

```typescript
import { createSignal } from '@tachui/core'
import { Symbol } from '@tachui/symbols'

const [isFavorited, setIsFavorited] = createSignal(false)

const favoriteButton = Symbol('heart', {
  variant: () => isFavorited() ? 'filled' : 'none',
  effect: 'bounce'
})
.modifier
.foregroundColor(() => isFavorited() ? '#ff0000' : '#999')
.onTap(() => setIsFavorited(!isFavorited()))
.build()
```

### Loading States

```typescript
import { createSignal } from '@tachui/core'

const [isLoading, setIsLoading] = createSignal(false)

const refreshButton = Symbol(() => isLoading() ? 'loader' : 'refresh-cw', {
  effect: () => isLoading() ? 'rotate' : 'none'
})
.modifier
.onTap(async () => {
  setIsLoading(true)
  await performRefresh()
  setIsLoading(false)
})
.build()
```

### Navigation Icons

```typescript
const navigationBar = HStack([
  Symbol('home')
    .modifier
    .onTap(() => navigate('/'))
    .build(),
    
  Symbol('search')
    .modifier  
    .onTap(() => navigate('/search'))
    .build(),
    
  Symbol('user')
    .modifier
    .onTap(() => navigate('/profile'))
    .build()
])
.modifier
.justifyContent('space-around')
.padding(16)
.build()
```

## Best Practices

### Performance

- Use tree-shaking by importing only needed icons
- Preload critical icons for better UX
- Use `eager: true` for above-the-fold icons
- Provide fallbacks for custom icons

### Accessibility

- Always provide meaningful accessibility labels
- Use `isDecorative: true` for purely decorative icons
- Ensure sufficient color contrast (4.5:1 minimum)
- Test with screen readers

### Design

- Use consistent icon sizes within the same context
- Follow your design system's icon usage guidelines
- Consider animation performance on lower-end devices
- Provide visual feedback for interactive icons

## Migration from Other Icon Libraries

### From React Icons

```typescript
// Before (React Icons)
import { FaHeart } from 'react-icons/fa'
<FaHeart color="red" size={24} />

// After (TachUI Symbols)  
import { Symbol } from '@tachui/symbols'
Symbol('heart', { variant: 'filled' })
  .modifier
  .foregroundColor('red')
  .frame(24, 24)
  .build()
```

### From Lucide React

```typescript
// Before (Lucide React)
import { Heart } from 'lucide-react'
<Heart color="red" size={24} fill="red" />

// After (TachUI Symbols)
Symbol('heart', { variant: 'filled' })
  .modifier
  .foregroundColor('red')
  .frame(24, 24)
  .build()
```