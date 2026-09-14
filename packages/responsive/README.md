# @tachui/responsive

Responsive design utilities for tachUI applications with breakpoint management and adaptive layouts.

## Overview

The `@tachui/responsive` package provides comprehensive responsive design capabilities for tachUI applications. Build interfaces that automatically adapt to different screen sizes, orientations, and device capabilities with SwiftUI-inspired responsive modifiers.

## Installation

```bash
npm install @tachui/responsive
# or
pnpm add @tachui/responsive
```

## Core Features

### Breakpoint System

Built-in breakpoint system with customizable breakpoints:

```typescript
import { useBreakpoint, DEFAULT_BREAKPOINTS } from '@tachui/responsive'

// Default breakpoints
const breakpoint = useBreakpoint()

// The exported defaults are CSS lengths, keyed base | sm | md | lg | xl | 2xl
console.log(DEFAULT_BREAKPOINTS)
// {
//   base: '0px',
//   sm: '640px',
//   md: '768px',
//   lg: '1024px',
//   xl: '1280px',
//   '2xl': '1536px',
// }
```

### Responsive Values

Use responsive values throughout your application:

```typescript
import { VStack, Text } from '@tachui/primitives'

VStack({
  spacing: {
    mobile: 8,
    tablet: 12,
    desktop: 16,
    wide: 20,
  },
  children: [
    Text('Responsive Title')
      .fontSize({
        mobile: 24,
        tablet: 28,
        desktop: 32,
        wide: 36,
      })
      .padding({
        mobile: 16,
        tablet: 20,
        desktop: 24,
      })
      ,
  ],
})
```

## Responsive Modifiers

### Size and Spacing

```typescript
Text('Adaptive Content')
  .padding({
    mobile: 12,
    desktop: 20,
  })
  .margin({
    mobile: { vertical: 8 },
    desktop: { vertical: 16 },
  })
  .width({
    mobile: '100%',
    tablet: '80%',
    desktop: '60%',
  })
  
```

### Layout Adaptations

```typescript
// Responsive stack direction
VStack({
  direction: {
    mobile: 'vertical',
    tablet: 'horizontal',
  },
  children: [Text('Item 1'), Text('Item 2'), Text('Item 3')],
})
```

### Typography Scaling

```typescript
Text('Responsive Typography')
  .font({
    mobile: { size: 16, weight: 400 },
    tablet: { size: 18, weight: 500 },
    desktop: { size: 20, weight: 600 },
  })
  .lineHeight({
    mobile: 1.4,
    desktop: 1.6,
  })
  .textAlign({
    mobile: 'left',
    tablet: 'center',
  })
  
```

## Advanced Responsive Patterns

### Responsive Grid

```typescript
import { Grid } from '@tachui/grid'

Grid({
  columns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 4,
  },
  gap: {
    mobile: 12,
    desktop: 20,
  },
  children: items.map(item =>
    Card({ title: item.title, content: item.content })
  ),
})
```

### Adaptive Navigation

```typescript
const navigationStyle = {
  mobile: 'bottom-tabs',
  tablet: 'sidebar',
  desktop: 'top-nav',
}

Show({
  when: () => useBreakpoint() === 'mobile',
  children: BottomTabNavigation(),
  fallback: Show({
    when: () => useBreakpoint() === 'tablet',
    children: SidebarNavigation(),
    fallback: TopNavigation(),
  }),
})
```

## Responsive Utilities

### Breakpoint Helpers

```typescript
import {
  getCurrentBreakpoint,
  isBreakpointAbove,
  isBreakpointBelow,
  getBreakpointsAbove,
} from '@tachui/responsive'

// `getCurrentBreakpoint()` hands back a Signal, so call it to read the key
const currentBreakpoint = getCurrentBreakpoint()
const current = currentBreakpoint()

// Comparisons take two breakpoint keys — base | sm | md | lg | xl | 2xl
if (isBreakpointAbove(current, 'md')) {
  // wider than the md breakpoint
}

if (isBreakpointBelow(current, 'lg')) {
  // narrower than the lg breakpoint
}

// Every breakpoint wider than the given one
const wider = getBreakpointsAbove('md')
```

## Performance Optimization

### Efficient Re-renders

```typescript
// Reactive responsive values with minimal re-renders
const fontSize = createMemo(() => {
  const bp = useBreakpoint()
  switch (bp()) {
    case 'mobile':
      return 14
    case 'tablet':
      return 16
    case 'desktop':
      return 18
    default:
      return 20
  }
})

Text('Optimized Text').fontSize(fontSize)
```

## Integration Examples

### With Navigation

```typescript
import { NavigationView } from '@tachui/navigation'

NavigationView({
  navigationStyle: {
    mobile: 'stack',
    tablet: 'split',
    desktop: 'sidebar',
  },
  children: [HomePage(), ProfilePage(), SettingsPage()],
})
```

### With Forms

```typescript
import { Form, TextField } from '@tachui/forms'

Form({
  layout: {
    mobile: 'vertical',
    desktop: 'horizontal',
  },
  children: [
    TextField({
      label: 'Name',
      width: {
        mobile: '100%',
        desktop: '50%',
      },
    }),
    TextField({
      label: 'Email',
      width: {
        mobile: '100%',
        desktop: '50%',
      },
    }),
  ],
})
```

## Not implemented yet

Documented here before they existed; the examples did not run. Listed so the
gap is visible rather than found at the import, with the nearest real thing:

| Documented | Actually available |
| --- | --- |
| `breakpoints` | `DEFAULT_BREAKPOINTS`, `configureBreakpoints` |
| `ResponsiveContainer`, `ContainerQuery` | `Container`, `ResponsiveContainerPatterns` |
| `MediaQuery` | `useMediaQuery`, `MediaQueries`, `generateMediaQuery` |
| `useViewportSize`, `ViewportSize` | `getViewportDimensions` |
| `useDeviceType`, `DeviceType`, `useOrientation` | `useBreakpoint` is the closest; no device or orientation API |
| `responsive()`, `createResponsiveStyles` | `withResponsive`, `createResponsiveModifier`, `createResponsiveCSSVariables` |
| `createBreakpoints` | `configureBreakpoints` |
| `LazyBreakpoint`, `ServerResponsiveProvider` | no equivalent |

## Accessibility Considerations

- **Reduced Motion**: Respects user's motion preferences
- **High Contrast**: Adapts to high contrast mode
- **Screen Reader**: Provides appropriate breakpoint information

```typescript
Text('Accessible responsive content')
  .fontSize({
    mobile: 16,
    desktop: 18,
  })
  .accessibilityLabel(() => `Text size adapts to ${useBreakpoint()} screen`)
  
```

## Browser Support

- Modern browsers with CSS3 media query support
- Graceful fallback for older browsers
- Progressive enhancement for advanced features

## Contributing

See the [contributing guide](../../CONTRIBUTING.md) for information on extending the responsive system.

## License

This package is part of the tachUI framework and is licensed under the MPL-2.0 License.
