# Responsive Design

TachUI provides a comprehensive CSS-native responsive design system that makes it easy to create applications that work seamlessly across all device sizes. Built with a mobile-first approach and TypeScript-safe APIs, the responsive system follows web standards while providing the developer experience you expect from TachUI.

## Overview

The responsive design system consists of several key components:

- **Responsive Modifiers**: Apply different styles at different breakpoints
- **Breakpoint System**: Mobile-first breakpoints following Tailwind conventions
- **Media Query Support**: Advanced media queries for orientation, color scheme, and accessibility
- **Layout Patterns**: Pre-built responsive patterns for common use cases
- **Performance Optimization**: Efficient CSS generation with caching and deduplication
- **Development Tools**: Visual debugging and inspection tools

## Quick Start

### Basic Responsive Modifier

The most common way to create responsive designs is using the `.responsive()` modifier:

```typescript
import { Text } from '@tachui/core'

// Responsive text sizing
Text("Welcome to TachUI")
  .modifier
  .responsive({
    base: { fontSize: 24, padding: 16 },    // Mobile (default)
    md: { fontSize: 32, padding: 24 },      // Tablet and up
    lg: { fontSize: 40, padding: 32 }       // Desktop and up
  })
  .build()
```

### Breakpoint Shorthand

For simpler responsive changes, use breakpoint shorthand modifiers:

```typescript
Text("Responsive Title")
  .modifier
  .fontSize(24)        // Base size (mobile)
  .md.fontSize(32)     // Medium screens and up
  .lg.fontSize(40)     // Large screens and up
  .textAlign('center') // Applied to all breakpoints
  .build()
```

### Custom Media Queries

For specific responsive behavior, use custom media queries:

```typescript
Text("Landscape Text")
  .modifier
  .fontSize(16)
  .mediaQuery('(orientation: landscape)', { fontSize: 18 })
  .mediaQuery('(prefers-color-scheme: dark)', { color: '#ffffff' })
  .build()
```

## Breakpoint System

TachUI uses a mobile-first breakpoint system with the following default breakpoints:

| Breakpoint | Min Width | Typical Device |
|------------|-----------|---------------|
| `base` | 0px | Mobile phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Mobile-First Approach

Styles cascade upward from smaller to larger breakpoints:

```typescript
Text("Mobile-First Text")
  .modifier
  .responsive({
    base: { fontSize: 16, color: '#333' },  // Applied on all screens
    md: { fontSize: 20 },                   // Overrides fontSize on md+
    lg: { fontSize: 24, fontWeight: 'bold' } // Adds fontWeight on lg+
  })
  .build()
```

## Responsive Layout Examples

### Responsive Grid

Create responsive grid layouts that adapt to screen size:

```typescript
import { VStack, HStack, Grid } from '@tachui/core'

// Grid that stacks on mobile, 2 columns on tablet, 3 on desktop
const ResponsiveGrid = () => {
  return VStack([
    ...items.map(item => 
      Text(item.title)
        .modifier
        .responsive({
          base: { width: '100%' },           // Full width on mobile
          md: { width: 'calc(50% - 1rem)' }, // 2 columns on tablet
          lg: { width: 'calc(33.333% - 1rem)' } // 3 columns on desktop
        })
        .build()
    )
  ])
  .modifier
  .responsive({
    base: { flexDirection: 'column', gap: '1rem' },
    md: { flexDirection: 'row', flexWrap: 'wrap' }
  })
  .build()
}
```

### Responsive Navigation

Create navigation that adapts to different screen sizes:

```typescript
import { HStack, VStack, Button } from '@tachui/core'

const ResponsiveNav = () => {
  return HStack([
    Text("Logo").fontSize(24).fontWeight('bold').build(),
    
    // Desktop navigation - horizontal
    HStack([
      Button("Home").build(),
      Button("About").build(),
      Button("Contact").build()
    ])
    .modifier
    .responsive({
      base: { display: 'none' },  // Hidden on mobile
      lg: { display: 'flex' }     // Visible on desktop
    })
    .build(),
    
    // Mobile menu button
    Button("☰")
      .modifier
      .responsive({
        base: { display: 'block' }, // Visible on mobile
        lg: { display: 'none' }     // Hidden on desktop
      })
      .build()
  ])
  .modifier
  .justifyContent('space-between')
  .alignItems('center')
  .padding({ base: 16, md: 24 })
  .build()
}
```

## Advanced Media Queries

### Orientation-Based Styles

```typescript
Text("Orientation-aware")
  .modifier
  .fontSize(16)
  .mediaQuery('(orientation: portrait)', { fontSize: 18 })
  .mediaQuery('(orientation: landscape)', { fontSize: 14 })
  .build()
```

### Dark Mode Support

```typescript
Text("Theme-aware text")
  .modifier
  .color('#333333')
  .mediaQuery('(prefers-color-scheme: dark)', { 
    color: '#ffffff',
    backgroundColor: '#1a1a1a'
  })
  .build()
```

### Accessibility Preferences

```typescript
Button("Accessible Button")
  .modifier
  .transition('all 0.2s ease')
  .mediaQuery('(prefers-reduced-motion: reduce)', { 
    transition: 'none' 
  })
  .mediaQuery('(prefers-contrast: high)', { 
    borderWidth: 2,
    borderColor: '#000000'
  })
  .build()
```

## Reactive Responsive Design

TachUI's responsive system is fully reactive, meaning it automatically updates when underlying reactive values change. This includes signals, computed values, and theme assets.

### Theme-Reactive Responsive Colors

Use `ColorAsset` to create responsive designs that automatically adapt to theme changes:

```typescript
import { Text, ColorAsset } from '@tachui/core'

// Define theme-aware colors
const brandColor = ColorAsset.init({
  light: '#007AFF',
  dark: '#0A84FF',
  name: 'brandColor'
})

const backgroundColor = ColorAsset.init({
  light: '#ffffff',
  dark: '#1c1c1e',
  name: 'cardBackground'
})

const textColor = ColorAsset.init({
  light: '#333333',
  dark: '#ffffff',
  name: 'textColor'
})

// Responsive component that reacts to theme changes
const ThemeAwareCard = () => {
  return Text("Theme-Reactive Text")
    .modifier
    .responsive({
      base: { 
        fontSize: 16,
        color: textColor,           // Automatically updates on theme change
        backgroundColor: backgroundColor,
        padding: 16
      },
      md: { 
        fontSize: 20,
        padding: 24
      },
      lg: { 
        fontSize: 24,
        padding: 32,
        borderLeft: `4px solid ${brandColor.resolve()}` // Theme-aware border
      }
    })
    .build()
}
```

### Signal-Based Responsive Values

Create responsive designs that react to application state:

```typescript
import { createSignal, createComputed, Text } from '@tachui/core'

const DynamicResponsiveComponent = () => {
  const [isExpanded, setIsExpanded] = createSignal(false)
  const [priority, setPriority] = createSignal<'low' | 'medium' | 'high'>('medium')
  
  // Computed values that react to signals
  const dynamicPadding = createComputed(() => 
    isExpanded() ? 32 : 16
  )
  
  const priorityColor = createComputed(() => {
    switch (priority()) {
      case 'high': return '#ff4444'
      case 'medium': return '#ffaa44'
      case 'low': return '#44ff44'
    }
  })
  
  const dynamicFontWeight = createComputed(() =>
    priority() === 'high' ? 'bold' : 'normal'
  )
  
  return Text("Dynamic Responsive Text")
    .modifier
    .responsive({
      base: { 
        fontSize: 16,
        padding: dynamicPadding,      // Reacts to expansion state
        color: priorityColor,         // Reacts to priority changes
        fontWeight: dynamicFontWeight // Reacts to priority changes
      },
      md: { 
        fontSize: 20,
        padding: createComputed(() => dynamicPadding() * 1.5) // Scaled reactive padding
      },
      lg: { 
        fontSize: 24
        // Inherits reactive values from smaller breakpoints
      }
    })
    .onClick(() => setIsExpanded(!isExpanded()))
    .build()
}
```

### Mixed Reactive and Static Values

Combine reactive and static values in responsive configurations:

```typescript
const MixedReactiveComponent = () => {
  const [userPreference, setUserPreference] = createSignal<'compact' | 'comfortable'>('comfortable')
  
  const adaptiveFontSize = createComputed(() =>
    userPreference() === 'compact' ? 14 : 16
  )
  
  return Text("Mixed Reactive Design")
    .modifier
    .responsive({
      base: { 
        fontSize: adaptiveFontSize,   // Reactive - changes with user preference
        color: '#333333',             // Static - never changes
        padding: 12                   // Static - never changes
      },
      md: { 
        fontSize: createComputed(() => adaptiveFontSize() + 2), // Reactive derived value
        padding: 16,                  // Static override
        backgroundColor: backgroundColor // Reactive theme color
      },
      lg: { 
        fontSize: 20,                 // Static override
        padding: 24                   // Static override
        // color and backgroundColor inherited from previous breakpoints
      }
    })
    .build()
}
```

### Reactive Media Queries

Combine reactive values with custom media queries:

```typescript
const ReactiveMediaQueryComponent = () => {
  const [intensity, setIntensity] = createSignal(0.5)
  
  const dynamicOpacity = createComputed(() => 
    0.3 + (intensity() * 0.7) // Opacity between 0.3 and 1.0
  )
  
  const dynamicBlur = createComputed(() =>
    `blur(${intensity() * 5}px)` // Blur between 0px and 5px
  )
  
  return Text("Reactive Media Query Text")
    .modifier
    .responsive({
      base: { 
        fontSize: 16,
        opacity: dynamicOpacity     // Reactive opacity
      },
      md: { 
        fontSize: 20
      }
    })
    .mediaQuery('(prefers-reduced-motion: reduce)', {
      filter: 'none',              // Static - disable effects for accessibility
      transition: 'none'
    })
    .mediaQuery('(min-width: 1200px)', {
      filter: dynamicBlur,         // Reactive - dynamic blur effect
      transition: 'filter 0.3s ease'
    })
    .build()
}
```

### Real-Time Responsive Updates

Create components that update in real-time based on data or user interaction:

```typescript
const RealTimeComponent = () => {
  const [liveData, setLiveData] = createSignal({ value: 0, status: 'normal' })
  
  // Simulate real-time data updates
  setInterval(() => {
    const value = Math.random() * 100
    const status = value > 80 ? 'critical' : value > 60 ? 'warning' : 'normal'
    setLiveData({ value, status })
  }, 1000)
  
  const statusColor = createComputed(() => {
    switch (liveData().status) {
      case 'critical': return '#ff0000'
      case 'warning': return '#ff8800'
      case 'normal': return '#00aa00'
    }
  })
  
  const dynamicScale = createComputed(() => 
    liveData().status === 'critical' ? 1.1 : 1.0
  )
  
  return Text(`Value: ${Math.round(liveData().value)}`)
    .modifier
    .responsive({
      base: { 
        fontSize: 16,
        color: statusColor,          // Updates in real-time
        transform: `scale(${dynamicScale()})`, // Pulses when critical
        padding: 12
      },
      md: { 
        fontSize: 20,
        padding: 16
      },
      lg: { 
        fontSize: 24,
        padding: 20
      }
    })
    .build()
}
```

### Performance Considerations for Reactive Responsive Design

When using reactive values in responsive configurations, TachUI automatically:

- **Caches CSS generation** to prevent unnecessary recalculation
- **Batches updates** when multiple reactive values change simultaneously  
- **Only regenerates affected rules** rather than entire stylesheets
- **Cleans up subscriptions** when components are unmounted

```typescript
// Optimized reactive responsive pattern
const OptimizedComponent = () => {
  // ✅ Good: Create reactive values outside render
  const stableColor = useMemo(() => 
    ColorAsset.init({ light: '#007AFF', dark: '#0A84FF' }), []
  )
  
  const [size, setSize] = createSignal('medium')
  
  // ✅ Good: Computed values are cached automatically
  const responsiveSize = createComputed(() => {
    switch (size()) {
      case 'small': return { base: 14, md: 16, lg: 18 }
      case 'medium': return { base: 16, md: 18, lg: 20 }
      case 'large': return { base: 18, md: 20, lg: 22 }
    }
  })
  
  return Text("Optimized Reactive Text")
    .modifier
    .responsive({
      fontSize: responsiveSize,      // Reactive responsive object
      color: stableColor            // Stable reactive asset
    })
    .build()
}
```

## Responsive Hooks

For programmatic responsive behavior, use TachUI's responsive hooks:

### useBreakpoint Hook

```typescript
import { useBreakpoint } from '@tachui/core'

const ResponsiveComponent = () => {
  const breakpoint = useBreakpoint()
  
  // Access current breakpoint
  const currentBp = breakpoint.current()
  
  // Check breakpoint ranges
  const isMobile = breakpoint.isBelow('md')
  const isDesktop = breakpoint.isAbove('lg')
  const isTabletRange = breakpoint.isBetween('md', 'lg')
  
  return Text(`Current breakpoint: ${currentBp}`)
    .modifier
    .fontSize(isMobile ? 16 : 20)
    .build()
}
```

### useMediaQuery Hook

```typescript
import { useMediaQuery } from '@tachui/core'

const DarkModeComponent = () => {
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const isLandscape = useMediaQuery('(orientation: landscape)')
  
  return Text("Responsive to preferences")
    .modifier
    .color(isDarkMode() ? '#ffffff' : '#000000')
    .fontSize(isLandscape() ? 18 : 16)
    .build()
}
```

### useResponsiveValue Hook

```typescript
import { useResponsiveValue } from '@tachui/core'

const ResponsiveValueComponent = () => {
  const fontSize = useResponsiveValue({
    base: 16,
    md: 20,
    lg: 24
  })
  
  const padding = useResponsiveValue({
    base: 8,
    md: 16,
    lg: 24
  })
  
  return Text("Dynamic responsive values")
    .modifier
    .fontSize(fontSize())
    .padding(padding())
    .build()
}
```

## Performance Considerations

TachUI's responsive system is optimized for performance:

### CSS Generation Optimization

- **Deduplication**: Identical responsive rules are automatically deduplicated
- **Caching**: Generated CSS is cached to avoid regeneration
- **Batching**: Multiple responsive changes are batched together

### Runtime Performance

- **Efficient Event Listeners**: Breakpoint changes use optimized resize listeners
- **Lazy Evaluation**: Responsive values are computed only when needed
- **Memory Management**: Automatic cleanup prevents memory leaks

### Bundle Size Impact

The responsive system adds minimal overhead:
- **Core responsive features**: ~8KB gzipped
- **Advanced features**: Additional ~4KB when used
- **Development tools**: 0KB in production builds

## Best Practices

### 1. Mobile-First Design

Always start with mobile styles and enhance for larger screens:

```typescript
// ✅ Good: Mobile-first approach
Text("Content")
  .modifier
  .responsive({
    base: { fontSize: 16, padding: 12 },    // Mobile base
    md: { fontSize: 18, padding: 16 },      // Enhance for tablet
    lg: { fontSize: 20, padding: 20 }       // Enhance for desktop
  })
  .build()

// ❌ Avoid: Desktop-first approach
Text("Content")
  .modifier
  .responsive({
    lg: { fontSize: 20, padding: 20 },      // Desktop first
    md: { fontSize: 18, padding: 16 },      // Scale down
    base: { fontSize: 16, padding: 12 }     // Scale down more
  })
  .build()
```

### 2. Consistent Breakpoint Usage

Use standard breakpoints consistently across your application:

```typescript
// ✅ Good: Consistent breakpoint usage
const theme = {
  spacing: {
    base: 8,
    md: 16,
    lg: 24
  },
  fontSize: {
    base: 16,
    md: 18,
    lg: 20
  }
}
```

### 3. Semantic Responsive Values

Use meaningful responsive values that reflect content hierarchy:

```typescript
// ✅ Good: Semantic responsive sizing
Text("Main Heading")
  .modifier
  .responsive({
    base: { fontSize: 24, lineHeight: 1.2 },  // Large enough to be readable
    md: { fontSize: 32, lineHeight: 1.1 },    // Larger but proportional
    lg: { fontSize: 40, lineHeight: 1.0 }     // Desktop-appropriate size
  })
  .build()
```

### 4. Test Across Devices

Always test responsive designs on actual devices:

```typescript
// Use development tools to test breakpoints
import { ResponsiveDevTools } from '@tachui/core'

// Enable visual debugging in development
if (process.env.NODE_ENV === 'development') {
  ResponsiveDevTools.enable({
    showOverlay: true,
    showBreakpoints: true,
    highlightResponsiveElements: true
  })
}
```

## Related Guides

- [Breakpoint Configuration](./breakpoints.md) - Configure custom breakpoints
- [Responsive Layout Patterns](../examples/responsive-layouts.md) - Pre-built responsive patterns
- [Performance Optimization](./responsive-performance.md) - Optimize responsive performance
- [Development Tools](./responsive-debugging.md) - Debug responsive layouts

## Migration from CSS

See our [Migration Guide](./responsive-migration.md) for help transitioning from:
- Raw CSS media queries
- Tailwind CSS responsive utilities
- Styled Components responsive patterns
- CSS-in-JS responsive solutions