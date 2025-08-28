# Breakpoint System

TachUI's breakpoint system provides a mobile-first approach to responsive design with TypeScript-safe configuration options. The system is designed to be familiar to developers coming from Tailwind CSS while offering the flexibility needed for custom design systems.

## Default Breakpoints

TachUI ships with sensible defaults based on common device sizes:

```typescript
const DEFAULT_BREAKPOINTS = {
  base: '0px',      // Mobile phones (default)
  sm: '640px',      // Large phones / small tablets
  md: '768px',      // Tablets
  lg: '1024px',     // Laptops / small desktops
  xl: '1280px',     // Desktops
  '2xl': '1536px'   // Large screens / ultra-wide
}
```

## Breakpoint Usage

### Basic Responsive Values

Use breakpoint keys in responsive objects:

```typescript
import { Text } from '@tachui/core'

Text("Responsive Text")
  .modifier
  .responsive({
    base: { fontSize: 16, padding: 12 },    // Mobile
    sm: { fontSize: 18, padding: 14 },      // Large phone
    md: { fontSize: 20, padding: 16 },      // Tablet
    lg: { fontSize: 24, padding: 20 },      // Laptop
    xl: { fontSize: 28, padding: 24 },      // Desktop
    '2xl': { fontSize: 32, padding: 28 }    // Large screen
  })
  .build()
```

### Shorthand Modifiers

Use breakpoint shorthand for simple responsive changes:

```typescript
Text("Quick Responsive")
  .modifier
  .fontSize(16)          // Base (mobile)
  .sm.fontSize(18)       // Small and up
  .md.fontSize(20)       // Medium and up
  .lg.fontSize(24)       // Large and up
  .xl.fontSize(28)       // Extra large and up
  ['2xl'].fontSize(32)   // 2XL and up (bracket notation for non-identifier keys)
  .build()
```

## Custom Breakpoint Configuration

### Global Configuration

Configure custom breakpoints for your entire application:

```typescript
import { configureBreakpoints } from '@tachui/core'

// Configure at app initialization
configureBreakpoints({
  mobile: '480px',      // Custom mobile breakpoint
  tablet: '768px',      // Custom tablet breakpoint
  laptop: '1200px',     // Custom laptop breakpoint
  desktop: '1440px',    // Custom desktop breakpoint
  ultrawide: '1920px'   // Custom ultrawide breakpoint
})
```

### Using Custom Breakpoints

Once configured, use your custom breakpoints throughout your application:

```typescript
Text("Custom Breakpoints")
  .modifier
  .responsive({
    base: { fontSize: 14 },
    mobile: { fontSize: 16 },     // Custom 480px+
    tablet: { fontSize: 18 },     // Custom 768px+
    laptop: { fontSize: 22 },     // Custom 1200px+
    desktop: { fontSize: 26 }     // Custom 1440px+
  })
  .build()
```

### TypeScript Support

Custom breakpoints are fully type-safe:

```typescript
// Define your breakpoint system
type CustomBreakpoints = {
  mobile: string
  tablet: string
  desktop: string
}

// Configure with type safety
configureBreakpoints<CustomBreakpoints>({
  mobile: '480px',
  tablet: '768px',
  desktop: '1200px'
})

// TypeScript will enforce correct breakpoint names
Text("Type-safe")
  .modifier
  .responsive({
    base: { fontSize: 16 },
    mobile: { fontSize: 18 },   // ✅ Valid
    tablet: { fontSize: 20 },   // ✅ Valid
    desktop: { fontSize: 24 },  // ✅ Valid
    // laptop: { fontSize: 22 } // ❌ TypeScript error - not in CustomBreakpoints
  })
  .build()
```

## Breakpoint Presets

TachUI provides several preset breakpoint systems for popular design frameworks:

### Tailwind CSS Breakpoints

```typescript
import { BreakpointPresets } from '@tachui/core'

// Use Tailwind's breakpoint system
configureBreakpoints(BreakpointPresets.tailwind)
// Results in: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' }
```

### Bootstrap Breakpoints

```typescript
// Use Bootstrap's breakpoint system
configureBreakpoints(BreakpointPresets.bootstrap)
// Results in: { xs: '0px', sm: '576px', md: '768px', lg: '992px', xl: '1200px', xxl: '1400px' }
```

### Material Design Breakpoints

```typescript
// Use Material Design's breakpoint system
configureBreakpoints(BreakpointPresets.material)
// Results in: { xs: '0px', sm: '600px', md: '960px', lg: '1280px', xl: '1920px' }
```

### Foundation Breakpoints

```typescript
// Use Foundation's breakpoint system
configureBreakpoints(BreakpointPresets.foundation)
// Results in: { small: '0px', medium: '640px', large: '1024px', xlarge: '1200px', xxlarge: '1440px' }
```

## Advanced Breakpoint Features

### Programmatic Access

Access current breakpoint information programmatically:

```typescript
import { 
  getCurrentBreakpoint, 
  getBreakpointIndex,
  createBreakpointContext,
  getCurrentBreakpointConfig
} from '@tachui/core'

// Get current breakpoint
const currentBp = getCurrentBreakpoint()
console.log(currentBp()) // 'md'

// Get breakpoint index (useful for comparisons)
const bpIndex = getBreakpointIndex('lg')
console.log(bpIndex) // 3

// Get full breakpoint context
const context = createBreakpointContext()
console.log(context) // { current: 'md', width: 1024, height: 768 }

// Get current breakpoint configuration
const config = getCurrentBreakpointConfig()
console.log(config) // { base: '0px', sm: '640px', md: '768px', ... }
```

### Breakpoint Utilities

Use utility functions for breakpoint logic:

```typescript
import { useBreakpoint } from '@tachui/core'

const MyComponent = () => {
  const bp = useBreakpoint()
  
  // Check if current breakpoint is above/below specific breakpoint
  const isMobile = bp.isBelow('md')        // true if base or sm
  const isDesktop = bp.isAbove('lg')       // true if xl or 2xl
  const isTabletRange = bp.isBetween('md', 'lg') // true if md or lg
  
  return Text(`Mobile: ${isMobile}, Desktop: ${isDesktop}`)
    .modifier
    .fontSize(isMobile ? 16 : 20)
    .build()
}
```

## Responsive Behavior

### Mobile-First Approach

TachUI uses a mobile-first approach where styles cascade upward:

```typescript
Text("Mobile-First")
  .modifier
  .responsive({
    base: { 
      fontSize: 16,        // Applied to all breakpoints
      color: '#333',       // Applied to all breakpoints
      padding: 12          // Applied to all breakpoints
    },
    md: { 
      fontSize: 20,        // Overrides fontSize on md and up
      padding: 16          // Overrides padding on md and up
      // color: '#333' remains from base
    },
    lg: { 
      fontSize: 24,        // Overrides fontSize on lg and up
      fontWeight: 'bold'   // Adds fontWeight on lg and up
      // padding: 16 and color: '#333' remain from previous breakpoints
    }
  })
  .build()
```

### Breakpoint Resolution

When resolving responsive values, TachUI searches backwards from the current breakpoint:

```typescript
// If current breakpoint is 'lg' (1024px)
const responsiveValue = {
  base: { fontSize: 16 },
  md: { fontSize: 20 },
  // lg is not defined
  xl: { fontSize: 28 }
}

// Resolution process:
// 1. Check 'lg' - not found
// 2. Check 'md' - found! Use fontSize: 20
// Result: fontSize will be 20 at 'lg' breakpoint
```

### Fallback Behavior

If no breakpoint value is found in the expected range, TachUI falls back to the first available value:

```typescript
// If current breakpoint is 'sm' but only lg+ values are defined
const responsiveValue = {
  lg: { fontSize: 24 },
  xl: { fontSize: 28 }
}

// Resolution process:
// 1. Check 'sm' - not found
// 2. Check 'base' - not found
// 3. Fall back to first available: lg
// Result: fontSize will be 24 even at 'sm' breakpoint
```

## Configuration Examples

### Design System Integration

```typescript
// Define your design system breakpoints
const designSystem = {
  breakpoints: {
    mobile: '320px',      // Small phones
    tablet: '768px',      // Tablets
    laptop: '1024px',     // Laptops
    desktop: '1280px',    // Desktops
    wide: '1920px'        // Ultra-wide
  },
  
  // Responsive spacing scale
  spacing: {
    mobile: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
    tablet: { xs: 6, sm: 12, md: 18, lg: 24, xl: 30 },
    laptop: { xs: 8, sm: 16, md: 24, lg: 32, xl: 40 },
    desktop: { xs: 10, sm: 20, md: 30, lg: 40, xl: 50 },
    wide: { xs: 12, sm: 24, md: 36, lg: 48, xl: 60 }
  }
}

// Configure breakpoints
configureBreakpoints(designSystem.breakpoints)

// Use with responsive spacing
Text("Design System")
  .modifier
  .responsive({
    base: { padding: designSystem.spacing.mobile.md },
    tablet: { padding: designSystem.spacing.tablet.md },
    laptop: { padding: designSystem.spacing.laptop.md },
    desktop: { padding: designSystem.spacing.desktop.md }
  })
  .build()
```

### Team Configuration

```typescript
// tachui.config.ts - Team-wide configuration
export const teamBreakpoints = {
  // Mobile-first approach
  phone: '0px',         // 0-640px
  phablet: '640px',     // 640-768px
  tablet: '768px',      // 768-1024px
  laptop: '1024px',     // 1024-1440px
  desktop: '1440px',    // 1440px+
} as const

// Initialize in main.ts
import { teamBreakpoints } from './tachui.config'
configureBreakpoints(teamBreakpoints)

// Usage across the application
const ResponsiveCard = () => {
  return VStack([
    Text("Card Title").modifier.responsive({
      phone: { fontSize: 18, textAlign: 'center' },
      tablet: { fontSize: 22, textAlign: 'left' },
      desktop: { fontSize: 26, textAlign: 'left' }
    }).build(),
    
    Text("Card content...").modifier.responsive({
      phone: { fontSize: 14, lineHeight: 1.4 },
      tablet: { fontSize: 16, lineHeight: 1.5 },
      desktop: { fontSize: 18, lineHeight: 1.6 }
    }).build()
  ])
  .modifier
  .responsive({
    phone: { padding: 16, gap: 8 },
    tablet: { padding: 24, gap: 12 },
    desktop: { padding: 32, gap: 16 }
  })
  .build()
}
```

## Testing Breakpoints

### Development Tools

Enable visual debugging to see active breakpoints:

```typescript
import { ResponsiveDevTools } from '@tachui/core'

// Enable in development
if (process.env.NODE_ENV === 'development') {
  ResponsiveDevTools.enable({
    showBreakpoints: true,     // Show breakpoint info
    showOverlay: true,         // Show debug overlay
    position: 'top-right'      // Overlay position
  })
}
```

### Testing Utilities

Test components at specific breakpoints:

```typescript
import { testAtBreakpoint } from '@tachui/core/testing'

// Test component behavior at different breakpoints
describe('ResponsiveComponent', () => {
  test('renders correctly at mobile', () => {
    testAtBreakpoint('base', () => {
      const component = render(<ResponsiveComponent />)
      expect(component.getByText('Mobile Layout')).toBeInTheDocument()
    })
  })
  
  test('renders correctly at desktop', () => {
    testAtBreakpoint('lg', () => {
      const component = render(<ResponsiveComponent />)
      expect(component.getByText('Desktop Layout')).toBeInTheDocument()
    })
  })
})
```

## Best Practices

### 1. Consistent Breakpoint Strategy

Choose a breakpoint strategy and stick to it across your application:

```typescript
// ✅ Good: Consistent naming and values
const appBreakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1200px'
}

// ❌ Avoid: Inconsistent breakpoints across components
// Component A uses { small: '640px', large: '1024px' }
// Component B uses { phone: '480px', computer: '1280px' }
```

### 2. Meaningful Breakpoint Names

Use semantic names that reflect your design intent:

```typescript
// ✅ Good: Semantic breakpoint names
const breakpoints = {
  compact: '480px',     // Compact layouts
  comfortable: '768px', // Comfortable spacing
  spacious: '1200px'    // Spacious layouts
}

// ✅ Also good: Device-based names
const breakpoints = {
  phone: '480px',
  tablet: '768px',
  laptop: '1024px',
  desktop: '1440px'
}
```

### 3. Limit Breakpoint Complexity

Avoid too many breakpoints unless necessary:

```typescript
// ✅ Good: Essential breakpoints
const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1200px'
}

// ❌ Avoid: Too many breakpoints (unless you really need them)
const breakpoints = {
  xs: '320px',
  sm: '480px',
  md: '640px',
  lg: '768px',
  xl: '1024px',
  '2xl': '1280px',
  '3xl': '1440px',
  '4xl': '1920px'
}
```

### 4. Document Your Breakpoint Strategy

Make your breakpoint strategy clear to your team:

```typescript
/**
 * Application Breakpoint Strategy
 * 
 * mobile: 0-767px     - Single column, touch-optimized
 * tablet: 768-1023px  - Multi-column, hybrid input
 * desktop: 1024px+    - Full features, mouse-optimized
 */
export const APP_BREAKPOINTS = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px'
} as const
```

## Related Guides

- [Responsive Design](./responsive-design.md) - Complete responsive design guide
- [Responsive Layout Patterns](../examples/responsive-layouts.md) - Common responsive patterns
- [Performance Optimization](./responsive-performance.md) - Optimize responsive performance
- [Migration Guide](./responsive-migration.md) - Migrate from other responsive systems