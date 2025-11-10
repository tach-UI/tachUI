# TachUI Symbol System - Phase 2 Features

Phase 2 of the TachUI Symbol System introduces advanced rendering modes, sophisticated animation effects, and comprehensive icon set management capabilities that bring SwiftUI-level functionality to web applications.

## Overview

Phase 2 enhances the Symbol component with:
- **Advanced Rendering Modes**: monochrome, hierarchical, palette, and multicolor rendering
- **Sophisticated Animations**: 8 different animation effects with variable values
- **Icon Set Management**: Extensible registry system with fallback support
- **Custom Icon Sets**: Complete API for third-party icon integrations

## Advanced Rendering Modes

### Monochrome Mode (Default)
Single-color rendering using the current color or specified primary color.

```typescript
import { Symbol } from '@tachui/symbols'

// Basic monochrome (uses currentColor)
const heartIcon = Symbol('heart', {
  renderingMode: 'monochrome'
})

// With custom color
const coloredHeart = Symbol('heart', {
  renderingMode: 'monochrome',
  primaryColor: '#e11d48'
})
```

### Hierarchical Mode
Uses opacity variations of the primary color for depth and hierarchy.

```typescript
const hierarchicalIcon = Symbol('folder', {
  renderingMode: 'hierarchical',
  primaryColor: '#3b82f6'
})
// Automatically generates:
// - Primary: #3b82f6 (100% opacity)
// - Secondary: #3b82f6 (68% opacity)  
// - Tertiary: #3b82f6 (32% opacity)
```

### Palette Mode
Uses multiple specified colors for rich, colorful icons.

```typescript
const paletteIcon = Symbol('rainbow', {
  renderingMode: 'palette',
  primaryColor: '#ef4444',    // Red
  secondaryColor: '#f59e0b',  // Amber
  tertiaryColor: '#10b981'    // Emerald
})

// Auto-generates complementary colors if not specified
const autoColorIcon = Symbol('star', {
  renderingMode: 'palette',
  primaryColor: '#8b5cf6'  // System generates secondary/tertiary
})
```

### Multicolor Mode
Preserves the icon's original designed colors.

```typescript
const multicolorIcon = Symbol('gradient-logo', {
  renderingMode: 'multicolor'
})
```

## Animation Effects

Phase 2 introduces 8 sophisticated animation effects with variable intensity control.

### Basic Animations

```typescript
// Bounce effect
const bouncingIcon = Symbol('notification', {
  effect: 'bounce'
})

// Pulse effect
const pulsingHeart = Symbol('heart', {
  effect: 'pulse'
})

// Rotation
const spinner = Symbol('refresh', {
  effect: 'rotate'
})
```

### Animation Effects Reference

| Effect | Description | Performance Impact | Variable Support |
|--------|-------------|-------------------|------------------|
| `bounce` | Vertical bounce animation | Low (2/5) | ✅ Height control |
| `pulse` | Scale and opacity pulsing | Low (1/5) | ✅ Scale/opacity |
| `wiggle` | Subtle rotation shake | Low (2/5) | ✅ Angle control |
| `rotate` | 360° continuous rotation | Low (1/5) | ❌ Fixed speed |
| `breathe` | Gentle scale/opacity cycle | Low (1/5) | ✅ Scale/opacity |
| `shake` | Horizontal shake motion | Medium (3/5) | ✅ Distance control |
| `heartbeat` | Double-beat scale pattern | Low (2/5) | ✅ Scale control |
| `glow` | Drop-shadow glow effect | High (4/5) | ✅ Intensity control |

### Variable Animation Values

Control animation intensity with the `effectValue` prop (0-1 scale):

```typescript
// Subtle bounce (20% intensity)
const subtleBounce = Symbol('arrow-up', {
  effect: 'bounce',
  effectValue: 0.2
})

// Intense glow (90% intensity)
const intenseGlow = Symbol('star', {
  effect: 'glow', 
  effectValue: 0.9
})

// Variable pulse based on signal
const [intensity, setIntensity] = createSignal(0.5)
const dynamicPulse = Symbol('heart', {
  effect: 'pulse',
  effectValue: intensity
})
```

### Animation Speed Control

Adjust animation speed with the `effectSpeed` multiplier:

```typescript
// Half speed (slower)
const slowSpin = Symbol('loading', {
  effect: 'rotate',
  effectSpeed: 0.5
})

// Double speed (faster)  
const fastPulse = Symbol('alert', {
  effect: 'pulse',
  effectSpeed: 2.0
})
```

### Animation Repetition

Control how many times animations repeat:

```typescript
// Repeat 3 times then stop
const flashIcon = Symbol('flash', {
  effect: 'pulse',
  effectRepeat: 3
})

// Infinite repetition (default)
const continuousIcon = Symbol('spinner', {
  effect: 'rotate',
  effectRepeat: 'infinite'
})
```

### Complex Animation Examples

```typescript
// Complete animation configuration
const complexIcon = Symbol('star', {
  effect: 'glow',
  effectValue: 0.8,      // High intensity
  effectSpeed: 1.5,      // 1.5x speed
  effectRepeat: 5,       // 5 repetitions
  renderingMode: 'palette',
  primaryColor: '#ffd700'
})

// Reactive animation with signals
const [isActive, setIsActive] = createSignal(false)
const [speed, setSpeed] = createSignal(1)

const reactiveIcon = Symbol('heart', {
  effect: isActive() ? 'heartbeat' : 'none',
  effectSpeed: speed,
  effectValue: 0.6,
  renderingMode: 'hierarchical',
  primaryColor: '#e11d48'
})
```

## Icon Set Management

### Using Different Icon Sets

```typescript
import { IconSetRegistry } from '@tachui/symbols'

// Use specific icon set
const lucideIcon = Symbol('heart', { iconSet: 'lucide' })
const customIcon = Symbol('logo', { iconSet: 'company-icons' })

// Check available icon sets
const availableSets = IconSetRegistry.list()
console.log('Available icon sets:', availableSets)
```

### Fallback Support

```typescript
// With fallback icon
const iconWithFallback = Symbol('custom-icon', {
  iconSet: 'my-custom-set',
  fallback: 'heart'  // Falls back to 'heart' if 'custom-icon' not found
})
```

## Custom Icon Set Creation

### Basic Custom Icon Set

```typescript
import { CustomIconSetBuilder } from '@tachui/symbols'

const myIconSet = new CustomIconSetBuilder({
  name: 'my-icons',
  version: '1.0.0'
})
.addIcon({
  name: 'custom-star',
  svg: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  viewBox: '0 0 24 24',
  metadata: {
    category: 'shapes',
    tags: ['star', 'favorite', 'rating']
  }
})
.addVariant('custom-star', 'filled', '<path d="..." fill="currentColor"/>')
.build()

// Register the custom icon set
IconSetRegistry.register(myIconSet)
```

### Create from JSON Data

```typescript
import { createIconSetFromJSON } from '@tachui/symbols'

const iconData = {
  'logo': {
    svg: '<path d="..."/>',
    viewBox: '0 0 100 100',
    variants: {
      'filled': '<path d="..." fill="currentColor"/>',
      'outlined': '<path d="..." fill="none" stroke="currentColor"/>'
    },
    metadata: {
      category: 'branding',
      tags: ['logo', 'brand']
    }
  }
}

const jsonIconSet = createIconSetFromJSON({
  name: 'company-logos',
  version: '2.0.0'
}, iconData)

IconSetRegistry.register(jsonIconSet)
```

### Create from SVG Sprite

```typescript
import { createIconSetFromSprite } from '@tachui/symbols'

const spriteIconSet = createIconSetFromSprite({
  name: 'sprite-icons',
  version: '1.0.0'
}, '/assets/icons.svg', {
  'home': { id: 'icon-home', viewBox: '0 0 24 24' },
  'user': { id: 'icon-user', viewBox: '0 0 24 24' },
  'settings': { id: 'icon-settings', viewBox: '0 0 24 24' }
})

IconSetRegistry.register(spriteIconSet)
```

### Icon Set Validation

```typescript
import { IconSetValidator } from '@tachui/symbols'

const iconConfig = {
  name: 'test-icon',
  svg: '<circle cx="12" cy="12" r="10"/>',
  viewBox: '0 0 24 24'
}

const validation = IconSetValidator.validateIcon(iconConfig)
if (!validation.valid) {
  console.error('Icon validation failed:', validation.errors)
}
```

## Accessibility Features

### Automatic Reduced Motion

The Symbol system automatically respects the user's `prefers-reduced-motion` setting:

```typescript
// This will automatically disable animations for users who prefer reduced motion
const respectfulIcon = Symbol('loading', {
  effect: 'rotate'
})

// Pulse animations convert to subtle static scaling for reduced motion
const accessiblePulse = Symbol('heart', {
  effect: 'pulse',
  effectValue: 0.6  // Becomes scale(1.06) for reduced motion users
})
```

### Screen Reader Support

```typescript
// Provide meaningful labels
const accessibleIcon = Symbol('notification', {
  accessibilityLabel: 'New message notification',
  accessibilityDescription: 'You have unread messages',
  effect: 'bounce'
})

// Mark decorative icons
const decorativeIcon = Symbol('sparkle', {
  isDecorative: true,  // Hidden from screen readers
  effect: 'glow'
})
```

## Performance Optimization

### Performance Impact Awareness

Each animation effect has a performance rating:

```typescript
// Low impact animations (recommended for multiple instances)
const lowImpactIcons = [
  Symbol('item1', { effect: 'pulse' }),    // Impact: 1/5
  Symbol('item2', { effect: 'rotate' }),   // Impact: 1/5
  Symbol('item3', { effect: 'breathe' })   // Impact: 1/5
]

// High impact animations (use sparingly)
const highImpactIcon = Symbol('highlight', { 
  effect: 'glow'  // Impact: 4/5 - use for focal elements only
})
```

### Bundle Optimization

The Symbol system includes tree-shaking support:

```typescript
// Only imports the icons you use
import { Symbol } from '@tachui/symbols'

// Lucide icons are loaded on-demand
const heartIcon = Symbol('heart')     // Only loads heart icon
const starIcon = Symbol('star')       // Only loads star icon
```

## Advanced Examples

### Dynamic Theme-Aware Icons

```typescript
import { createSignal, createEffect } from '@tachui/core'

const [theme, setTheme] = createSignal<'light' | 'dark'>('light')

const themeIcon = () => Symbol(theme() === 'light' ? 'sun' : 'moon', {
  effect: 'rotate',
  effectSpeed: 0.5,
  renderingMode: 'hierarchical',
  primaryColor: theme() === 'light' ? '#fbbf24' : '#60a5fa'
})
```

### Interactive State Icons

```typescript
const [isLoading, setIsLoading] = createSignal(false)
const [isSuccess, setIsSuccess] = createSignal(false)

const statusIcon = () => {
  if (isLoading()) {
    return Symbol('loader', {
      effect: 'rotate',
      renderingMode: 'monochrome'
    })
  }
  
  if (isSuccess()) {
    return Symbol('check-circle', {
      effect: 'bounce',
      effectValue: 0.8,
      renderingMode: 'palette',
      primaryColor: '#10b981'
    })
  }
  
  return Symbol('circle', {
    renderingMode: 'hierarchical'
  })
}
```

### Animation Sequences

```typescript
import { createSignal, createEffect } from '@tachui/core'

const [step, setStep] = createSignal(0)

// Cycle through different animation effects
createEffect(() => {
  const effects: SymbolEffect[] = ['pulse', 'bounce', 'glow', 'heartbeat']
  const interval = setInterval(() => {
    setStep(s => (s + 1) % effects.length)
  }, 2000)
  
  return () => clearInterval(interval)
})

const animatedSequence = () => Symbol('star', {
  effect: ['pulse', 'bounce', 'glow', 'heartbeat'][step()],
  effectValue: 0.7,
  renderingMode: 'palette',
  primaryColor: '#8b5cf6'
})
```

## Migration from Phase 1

Phase 2 is fully backward compatible with Phase 1 code:

```typescript
// Phase 1 code continues to work
const phase1Icon = Symbol('heart', {
  variant: 'filled',
  scale: 'large'
})

// Enhanced with Phase 2 features
const phase2Icon = Symbol('heart', {
  variant: 'filled',
  scale: 'large',
  renderingMode: 'hierarchical',  // New in Phase 2
  effect: 'heartbeat',            // New in Phase 2
  effectValue: 0.6               // New in Phase 2
})
```

## Browser Support

Phase 2 features are designed for modern browsers with graceful degradation:

- **CSS Custom Properties**: Required for variable animations
- **CSS Animations**: Required for effects (fallback to static for older browsers)
- **Color Functions**: Modern color mixing features with fallbacks
- **Reduced Motion**: Automatic detection and respect for user preferences

## Performance Guidelines

1. **Use low-impact animations** (`pulse`, `rotate`, `breathe`) for multiple instances
2. **Limit high-impact effects** (`glow`) to 1-2 per page
3. **Consider reduced motion** - always provide meaningful static states  
4. **Test on lower-end devices** - monitor animation performance
5. **Use appropriate effect values** - subtle effects (0.2-0.4) often work best

Phase 2 transforms the TachUI Symbol System into a comprehensive, performance-optimized icon solution that rivals native platform capabilities while maintaining web accessibility standards.