# @tachui/responsive

Responsive design utilities for tachUI applications with breakpoint management and adaptive layouts.

## Overview

The `@tachui/responsive` package provides comprehensive responsive design capabilities for tachUI applications. Build interfaces that automatically adapt to different screen sizes, orientations, and device capabilities with SwiftUI-inspired responsive modifiers.

## Installation

```bash
npm install @tachui/responsive@0.8.0-alpha
# or
pnpm add @tachui/responsive@0.8.0-alpha
```

## Core Features

### Breakpoint System

Built-in breakpoint system with customizable breakpoints:

```typescript
import { useBreakpoint, breakpoints } from '@tachui/responsive'

// Default breakpoints
const currentBreakpoint = useBreakpoint()
// Returns: 'mobile' | 'tablet' | 'desktop' | 'wide'

// Breakpoint values
console.log(breakpoints)
// {
//   mobile: 0,
//   tablet: 768,
//   desktop: 1024,
//   wide: 1440
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
      .modifier.fontSize({
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
      .build(),
  ],
})
```

## Responsive Modifiers

### Size and Spacing

```typescript
Text('Adaptive Content')
  .modifier.padding({
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
  .build()
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
  .modifier.font({
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
  .build()
```

## Responsive Components

### ResponsiveContainer

A container that applies responsive behavior to its children:

```typescript
import { ResponsiveContainer } from '@tachui/responsive'

ResponsiveContainer({
  breakpoints: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
  },
  children: [Text('This content adapts to container size')],
})
```

### MediaQuery

Component for conditional rendering based on media queries:

```typescript
import { MediaQuery } from '@tachui/responsive'

VStack({
  children: [
    MediaQuery({
      query: 'min-width: 768px',
      children: Text('Only visible on tablet and up'),
    }),

    MediaQuery({
      query: 'max-width: 767px',
      children: Text('Only visible on mobile'),
    }),
  ],
})
```

### ViewportSize

Hook and component for viewport-based logic:

```typescript
import { useViewportSize, ViewportSize } from '@tachui/responsive'

// As a hook
const viewportSize = useViewportSize()
const isMobile = () => viewportSize().width < 768

// As a component
ViewportSize({
  render: size => Text(`Viewport: ${size.width}x${size.height}`),
})
```

## Device Detection

### Device Type Detection

```typescript
import { useDeviceType, DeviceType } from '@tachui/responsive'

const deviceType = useDeviceType()

VStack({
  children: [
    Show({
      when: () => deviceType() === 'mobile',
      children: MobileNavigation(),
    }),

    Show({
      when: () => deviceType() === 'desktop',
      children: DesktopNavigation(),
    }),
  ],
})
```

### Orientation Support

```typescript
import { useOrientation } from '@tachui/responsive'

const orientation = useOrientation()

HStack({
  direction: () => (orientation() === 'landscape' ? 'horizontal' : 'vertical'),
  children: [
    Text('Adapts to orientation'),
    Text('Portrait: vertical, Landscape: horizontal'),
  ],
})
```

## Advanced Responsive Patterns

### Container Queries

Use container-based responsive design:

```typescript
import { ContainerQuery } from '@tachui/responsive'

ContainerQuery({
  container: 'cardContainer',
  query: 'min-width: 300px',
  children: VStack({
    children: [
      Text('Card expands when container is wide enough')
        .modifier.fontSize(18)
        .build(),
    ],
  })
    .modifier.container('cardContainer')
    .build(),
})
```

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
  isMobile,
  isTablet,
  isDesktop,
  atLeast,
  atMost,
  between,
} from '@tachui/responsive'

// Simple checks
if (isMobile()) {
  // Mobile-specific logic
}

// Range checks
if (atLeast('tablet')) {
  // Tablet and above
}

if (between('tablet', 'desktop')) {
  // Only tablet and desktop, not mobile or wide
}
```

### Responsive Values Helper

```typescript
import { responsive } from '@tachui/responsive'

const spacing = responsive({
  mobile: 8,
  tablet: 12,
  desktop: 16,
})

// Use in components
VStack({ spacing })
```

### CSS-in-JS Integration

```typescript
import { createResponsiveStyles } from '@tachui/responsive'

const buttonStyles = createResponsiveStyles({
  mobile: {
    fontSize: 14,
    padding: '8px 16px',
  },
  desktop: {
    fontSize: 16,
    padding: '12px 24px',
  },
})

Button('Responsive Button').modifier.css(buttonStyles()).build()
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

Text('Optimized Text').modifier.fontSize(fontSize).build()
```

### Lazy Loading

```typescript
import { LazyBreakpoint } from '@tachui/responsive'

LazyBreakpoint({
  breakpoint: 'desktop',
  children: ExpensiveDesktopComponent,
  fallback: MobileComponent,
})
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

## Custom Breakpoints

Define custom breakpoints for your application:

```typescript
import { createBreakpoints } from '@tachui/responsive'

const customBreakpoints = createBreakpoints({
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
})

// Use custom breakpoints
Text('Custom responsive')
  .modifier.fontSize({
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  })
  .build()
```

## Server-Side Rendering (SSR)

SSR-safe responsive utilities:

```typescript
import { ServerResponsiveProvider } from '@tachui/responsive'

// On the server
ServerResponsiveProvider({
  userAgent: request.userAgent,
  viewport: { width: 1024, height: 768 },
  children: App(),
})
```

## Accessibility Considerations

- **Reduced Motion**: Respects user's motion preferences
- **High Contrast**: Adapts to high contrast mode
- **Screen Reader**: Provides appropriate breakpoint information

```typescript
Text('Accessible responsive content')
  .modifier.fontSize({
    mobile: 16,
    desktop: 18,
  })
  .accessibilityLabel(() => `Text size adapts to ${useBreakpoint()} screen`)
  .build()
```

## Browser Support

- Modern browsers with CSS3 media query support
- Graceful fallback for older browsers
- Progressive enhancement for advanced features

## Contributing

See the [contributing guide](../../CONTRIBUTING.md) for information on extending the responsive system.

## License

This package is part of the tachUI framework and is licensed under the MPL-2.0 License.
