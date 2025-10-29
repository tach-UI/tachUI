# Responsive Modifiers API Reference

Complete API reference for TachUI's responsive modifier system, including all methods, types, and configuration options.

## Core Types

### ResponsiveValue\<T>

Generic type for responsive values that can be either a static value or an object with breakpoint-specific values.

```typescript
type ResponsiveValue<T> = T | Partial<Record<BreakpointKey, T>>

// Examples
type ResponsiveFontSize = ResponsiveValue<number>
// Can be: 16 or { base: 16, md: 20, lg: 24 }

type ResponsiveColor = ResponsiveValue<string>
// Can be: '#000' or { base: '#000', md: '#333' }
```

### BreakpointKey

Union type of all available breakpoint names.

```typescript
type BreakpointKey = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
```

### ResponsiveStyleConfig

Configuration object for responsive styles.

```typescript
interface ResponsiveStyleConfig {
  [key: string]: ResponsiveValue<any>
}

// Example
const styleConfig: ResponsiveStyleConfig = {
  fontSize: { base: 16, md: 20, lg: 24 },
  padding: { base: 8, md: 12, lg: 16 },
  color: '#333333'  // Static value
}
```

### BreakpointContext

Current breakpoint information and viewport dimensions.

```typescript
interface BreakpointContext {
  current: BreakpointKey    // Currently active breakpoint
  width: number             // Viewport width in pixels
  height: number            // Viewport height in pixels
}
```

## Responsive Modifier Methods

### .responsive()

Apply responsive styles using breakpoint-specific configuration.

```typescript
.responsive(config: ResponsiveStyleConfig): ResponsiveModifierChain

// Usage
Text("Responsive text")
  .modifier
  .responsive({
    fontSize: { base: 16, md: 20, lg: 24 },
    padding: { base: 8, md: 12, lg: 16 },
    color: { base: '#333', md: '#000' },
    textAlign: 'center'  // Applied to all breakpoints
  })
  .build()
```

**Parameters:**
- `config: ResponsiveStyleConfig` - Object with CSS properties and responsive values

**Returns:** `ResponsiveModifierChain` - Chainable modifier for further customization

**Example with all CSS properties:**
```typescript
Text("Full responsive example")
  .modifier
  .responsive({
    // Typography
    fontSize: { base: 14, md: 16, lg: 18, xl: 20 },
    fontWeight: { base: 'normal', lg: 'bold' },
    lineHeight: { base: 1.4, md: 1.5, lg: 1.6 },
    textAlign: { base: 'center', md: 'left' },
    
    // Layout
    width: { base: '100%', md: '50%', lg: '33.333%' },
    padding: { base: 12, md: 16, lg: 20 },
    margin: { base: 8, md: 12, lg: 16 },
    
    // Visual
    backgroundColor: { base: '#f5f5f5', md: '#ffffff' },
    borderRadius: { base: 4, md: 8 },
    boxShadow: { base: 'none', md: '0 2px 4px rgba(0,0,0,0.1)' },
    
    // Flexbox
    display: { base: 'block', md: 'flex' },
    flexDirection: { base: 'column', md: 'row' },
    alignItems: { base: 'stretch', md: 'center' },
    gap: { base: 8, md: 16 }
  })
  .build()
```

### .mediaQuery()

Apply styles for custom media queries.

```typescript
.mediaQuery(query: string, styles: CSSProperties): ResponsiveModifierChain

// Usage
Text("Media query example")
  .modifier
  .fontSize(16)
  .mediaQuery('(orientation: landscape)', { fontSize: 18 })
  .mediaQuery('(prefers-color-scheme: dark)', { color: '#ffffff' })
  .mediaQuery('(min-width: 900px)', { fontSize: 20 })
  .build()
```

**Parameters:**
- `query: string` - CSS media query string
- `styles: CSSProperties` - CSS styles to apply when query matches

**Returns:** `ResponsiveModifierChain` - Chainable modifier

**Common media query examples:**
```typescript
// Orientation
.mediaQuery('(orientation: portrait)', { /* styles */ })
.mediaQuery('(orientation: landscape)', { /* styles */ })

// Color scheme
.mediaQuery('(prefers-color-scheme: dark)', { /* styles */ })
.mediaQuery('(prefers-color-scheme: light)', { /* styles */ })

// Accessibility
.mediaQuery('(prefers-reduced-motion: reduce)', { /* styles */ })
.mediaQuery('(prefers-contrast: high)', { /* styles */ })

// Device capabilities
.mediaQuery('(hover: hover)', { /* styles */ })
.mediaQuery('(hover: none)', { /* styles */ })

// Resolution
.mediaQuery('(min-resolution: 2dppx)', { /* styles */ })

// Aspect ratio
.mediaQuery('(aspect-ratio: 16/9)', { /* styles */ })

// Custom breakpoints
.mediaQuery('(min-width: 900px) and (max-width: 1199px)', { /* styles */ })
```

### Breakpoint Shorthand Modifiers

Apply styles at specific breakpoints and above using shorthand syntax.

```typescript
.sm     // Styles apply at 'sm' breakpoint and above
.md     // Styles apply at 'md' breakpoint and above
.lg     // Styles apply at 'lg' breakpoint and above
.xl     // Styles apply at 'xl' breakpoint and above
['2xl'] // Styles apply at '2xl' breakpoint and above (bracket notation)

// Usage
Text("Shorthand responsive")
  .modifier
  .fontSize(14)          // Base (all breakpoints)
  .color('#666')         // Base (all breakpoints)
  .sm.fontSize(16)       // sm and above
  .md.fontSize(18)       // md and above
  .md.color('#333')      // md and above
  .lg.fontSize(22)       // lg and above
  .lg.fontWeight('bold') // lg and above
  .xl.fontSize(26)       // xl and above
  ['2xl'].fontSize(30)   // 2xl and above
  .build()
```

**Chaining with other modifiers:**
```typescript
Text("Mixed responsive and static")
  .modifier
  .textAlign('center')     // Static - applies to all breakpoints
  .fontSize(14)            // Base fontSize
  .padding(8)              // Base padding
  .md.fontSize(18)         // Override fontSize at md+
  .md.padding(12)          // Override padding at md+
  .lg.fontSize(22)         // Override fontSize at lg+
  .lg.fontWeight('bold')   // Add fontWeight at lg+
  .backgroundColor('#f5f5f5') // Static - applies to all breakpoints
  .build()
```

## Responsive Property Modifiers

All standard TachUI modifiers support responsive values:

### Typography Responsive Modifiers

```typescript
// Font size
.fontSize(value: ResponsiveValue<number | string>)
.fontSize({ base: 16, md: 20, lg: 24 })

// Font weight
.fontWeight(value: ResponsiveValue<FontWeight>)
.fontWeight({ base: 'normal', lg: 'bold' })

// Line height
.lineHeight(value: ResponsiveValue<number | string>)
.lineHeight({ base: 1.4, md: 1.5, lg: 1.6 })

// Text alignment
.textAlign(value: ResponsiveValue<'left' | 'center' | 'right' | 'justify'>)
.textAlign({ base: 'center', md: 'left' })

// Color
.color(value: ResponsiveValue<string>)
.color({ base: '#666', md: '#333', lg: '#000' })
```

### Layout Responsive Modifiers

```typescript
// Dimensions
.width(value: ResponsiveValue<number | string>)
.width({ base: '100%', md: '50%', lg: '33.333%' })

.height(value: ResponsiveValue<number | string>)
.height({ base: 200, md: 300, lg: 400 })

// Spacing
.padding(value: ResponsiveValue<number | string>)
.padding({ base: 8, md: 12, lg: 16, xl: 20 })

.margin(value: ResponsiveValue<number | string>)
.margin({ base: 4, md: 8, lg: 12 })

// Individual spacing
.paddingTop(value: ResponsiveValue<number | string>)
.paddingRight(value: ResponsiveValue<number | string>)
.paddingBottom(value: ResponsiveValue<number | string>)
.paddingLeft(value: ResponsiveValue<number | string>)

.marginTop(value: ResponsiveValue<number | string>)
.marginRight(value: ResponsiveValue<number | string>)
.marginBottom(value: ResponsiveValue<number | string>)
.marginLeft(value: ResponsiveValue<number | string>)
```

### Flexbox Responsive Modifiers

```typescript
// Display
.display(value: ResponsiveValue<'block' | 'flex' | 'grid' | 'none'>)
.display({ base: 'block', md: 'flex' })

// Flex direction
.flexDirection(value: ResponsiveValue<'row' | 'column' | 'row-reverse' | 'column-reverse'>)
.flexDirection({ base: 'column', md: 'row' })

// Justify content
.justifyContent(value: ResponsiveValue<'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'>)
.justifyContent({ base: 'center', md: 'space-between' })

// Align items
.alignItems(value: ResponsiveValue<'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'>)
.alignItems({ base: 'stretch', md: 'center' })

// Gap
.gap(value: ResponsiveValue<number | string>)
.gap({ base: 8, md: 16, lg: 24 })
```

### Visual Responsive Modifiers

```typescript
// Background
.backgroundColor(value: ResponsiveValue<string>)
.backgroundColor({ base: '#f5f5f5', md: '#ffffff' })

// Border
.borderWidth(value: ResponsiveValue<number>)
.borderWidth({ base: 1, md: 2 })

.borderRadius(value: ResponsiveValue<number | string>)
.borderRadius({ base: 4, md: 8, lg: 12 })

.borderColor(value: ResponsiveValue<string>)
.borderColor({ base: '#ddd', md: '#ccc' })

// Shadow
.boxShadow(value: ResponsiveValue<string>)
.boxShadow({ 
  base: 'none', 
  md: '0 2px 4px rgba(0,0,0,0.1)', 
  lg: '0 4px 8px rgba(0,0,0,0.15)' 
})

// Opacity
.opacity(value: ResponsiveValue<number>)
.opacity({ base: 0.8, md: 1.0 })
```

## Responsive Utility Functions

### useBreakpoint()

Hook for programmatic breakpoint access.

```typescript
const useBreakpoint: () => {
  current: Signal<BreakpointKey>
  isAbove: (breakpoint: BreakpointKey) => Signal<boolean>
  isBelow: (breakpoint: BreakpointKey) => Signal<boolean>
  isBetween: (min: BreakpointKey, max: BreakpointKey) => Signal<boolean>
}

// Usage
const MyComponent = () => {
  const bp = useBreakpoint()
  
  const currentBreakpoint = bp.current()           // 'md'
  const isMobile = bp.isBelow('md')()             // false
  const isDesktop = bp.isAbove('lg')()            // true
  const isTabletRange = bp.isBetween('md', 'lg')() // false
  
  return Text(`Current: ${currentBreakpoint}`)
    .modifier
    .fontSize(isMobile ? 16 : 20)
    .build()
}
```

### useMediaQuery()

Hook for custom media query matching.

```typescript
const useMediaQuery: (query: string) => Signal<boolean>

// Usage
const MyComponent = () => {
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const isLandscape = useMediaQuery('(orientation: landscape)')
  const isHighDPI = useMediaQuery('(min-resolution: 2dppx)')
  
  return Text("Media query example")
    .modifier
    .color(isDarkMode() ? '#ffffff' : '#000000')
    .fontSize(isLandscape() ? 18 : 16)
    .build()
}
```

### useResponsiveValue()

Hook for reactive responsive value resolution.

```typescript
const useResponsiveValue: <T>(value: ResponsiveValue<T>) => Signal<T>

// Usage
const MyComponent = () => {
  const fontSize = useResponsiveValue({
    base: 16,
    md: 20,
    lg: 24
  })
  
  const padding = useResponsiveValue({
    base: 8,
    md: 12,
    lg: 16
  })
  
  return Text("Dynamic responsive values")
    .modifier
    .fontSize(fontSize())
    .padding(padding())
    .build()
}
```

### withResponsive()

Higher-order component for responsive behavior.

```typescript
const withResponsive: <T>(
  component: T,
  responsiveProps: ResponsiveStyleConfig
) => T

// Usage
const ResponsiveText = withResponsive(Text("Hello"), {
  fontSize: { base: 16, md: 20, lg: 24 },
  color: { base: '#666', md: '#333' }
})
```

## Configuration Functions

### configureBreakpoints()

Configure custom breakpoints globally.

```typescript
const configureBreakpoints: (breakpoints: Record<string, string>) => void

// Usage
configureBreakpoints({
  mobile: '480px',
  tablet: '768px',
  laptop: '1024px',
  desktop: '1440px'
})
```

### getCurrentBreakpoint()

Get the current active breakpoint.

```typescript
const getCurrentBreakpoint: () => Signal<BreakpointKey>

// Usage
const currentBp = getCurrentBreakpoint()
console.log(currentBp()) // 'md'
```

### createBreakpointContext()

Create a breakpoint context with current viewport information.

```typescript
const createBreakpointContext: () => BreakpointContext

// Usage
const context = createBreakpointContext()
console.log(context) // { current: 'md', width: 1024, height: 768 }
```

### generateMediaQuery()

Generate media query string for a breakpoint.

```typescript
const generateMediaQuery: (breakpoint: BreakpointKey) => string

// Usage
const mdQuery = generateMediaQuery('md')
console.log(mdQuery) // '(min-width: 768px)'
```

## Advanced Utilities

### ResponsiveDevTools

Development tools for debugging responsive layouts.

```typescript
class ResponsiveDevTools {
  static enable(options?: {
    showOverlay?: boolean
    showBreakpoints?: boolean
    showPerformance?: boolean
    logLevel?: 'error' | 'warn' | 'info' | 'debug'
    highlightResponsiveElements?: boolean
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  }): void
  
  static disable(): void
  
  static get enabled(): boolean
  
  static logResponsiveState(): void
  
  static inspectResponsiveValue<T>(
    value: ResponsiveValue<T>, 
    label?: string
  ): void
  
  static exportConfiguration(): {
    breakpoints: Record<BreakpointKey, string>
    currentContext: BreakpointContext
    performance: any
    mediaQueries: Record<string, boolean>
  }
}

// Usage
ResponsiveDevTools.enable({
  showOverlay: true,
  showBreakpoints: true,
  highlightResponsiveElements: true
})
```

### useResponsiveInspector()

Hook for inspecting responsive values in development.

```typescript
const useResponsiveInspector: <T>(
  value: ResponsiveValue<T>,
  label?: string
) => Signal<{
  resolvedValue: T | undefined
  activeBreakpoint: BreakpointKey
  allValues: Partial<Record<BreakpointKey, T>>
  isResponsive: boolean
}>

// Usage
const MyComponent = () => {
  const responsiveValue = { base: 16, md: 20, lg: 24 }
  const inspector = useResponsiveInspector(responsiveValue, 'Font Size')
  
  const info = inspector()
  console.log(info.resolvedValue)    // 20 (if at 'md' breakpoint)
  console.log(info.activeBreakpoint) // 'md'
  console.log(info.isResponsive)     // true
  
  return Text("Inspected value").build()
}
```

## Error Handling

### Common Issues and Solutions

**TypeScript Error: Breakpoint not found**
```typescript
// ❌ Error: Type '"unknown"' is not assignable to type 'BreakpointKey'
.responsive({
  unknown: { fontSize: 20 } // 'unknown' is not a valid breakpoint
})

// ✅ Solution: Use valid breakpoint keys
.responsive({
  md: { fontSize: 20 } // 'md' is valid
})
```

**Runtime Error: No responsive value found**
```typescript
// ❌ Error: Empty responsive object
const emptyResponsive = {}
useResponsiveValue(emptyResponsive) // Throws error

// ✅ Solution: Always provide at least one breakpoint value
const validResponsive = { base: 16 }
useResponsiveValue(validResponsive) // Works correctly
```

**Performance Warning: Too many responsive computations**
```typescript
// ❌ Avoid: Creating responsive computations in render loops
items.map(item => useResponsiveValue({ base: item.size }))

// ✅ Better: Pre-compute responsive values
const responsiveSize = useResponsiveValue({ base: 16, md: 20 })
items.map(item => Text(item.text).fontSize(responsiveSize()).build())
```

## Reactive Responsive Values

TachUI's responsive system fully supports reactive values, automatically updating styles when underlying reactive values change.

### Theme-Reactive Responsive Colors

```typescript
import { Text, ColorAsset, createSignal, createComputed } from '@tachui/core'

// Theme-aware responsive component
const ReactiveThemeComponent = () => {
  const primaryColor = ColorAsset.init({
    light: '#007AFF',
    dark: '#0A84FF',
    name: 'primaryColor'
  })
  
  const backgroundColor = ColorAsset.init({
    light: '#ffffff',
    dark: '#1c1c1e',
    name: 'backgroundColor'
  })
  
  return Text("Theme-Reactive Text")
    .modifier
    .responsive({
      base: { 
        fontSize: 16,
        color: primaryColor,        // Automatically reacts to theme changes
        backgroundColor: backgroundColor,
        padding: 16
      },
      md: { 
        fontSize: 20,
        padding: 24
      },
      lg: { 
        fontSize: 24,
        padding: 32
      }
    })
    .build()
}
```

### Signal-Based Reactive Responsive Values

```typescript
const DynamicResponsiveComponent = () => {
  const [isActive, setIsActive] = createSignal(false)
  const [size, setSize] = createSignal<'small' | 'medium' | 'large'>('medium')
  
  // Computed reactive values
  const activePadding = createComputed(() => 
    isActive() ? 24 : 16
  )
  
  const sizeBasedFontSize = createComputed(() => {
    const baseSizes = { small: 14, medium: 16, large: 18 }
    return {
      base: baseSizes[size()],
      md: baseSizes[size()] + 2,
      lg: baseSizes[size()] + 4
    }
  })
  
  const statusColor = createComputed(() =>
    isActive() ? '#00ff00' : '#666666'
  )
  
  return Text("Dynamic Responsive Text")
    .modifier
    .responsive({
      fontSize: sizeBasedFontSize,    // Reactive responsive object
      color: statusColor,             // Reactive color
      padding: activePadding,         // Reactive padding
      transform: createComputed(() => 
        `scale(${isActive() ? 1.05 : 1.0})`
      )
    })
    .onClick(() => setIsActive(!isActive()))
    .build()
}
```

### Mixed Reactive and Static Configurations

```typescript
const MixedReactiveComponent = () => {
  const [userPreference, setUserPreference] = createSignal<'dense' | 'comfortable'>('comfortable')
  
  const adaptiveSpacing = createComputed(() =>
    userPreference() === 'dense' ? 8 : 16
  )
  
  const themeColor = ColorAsset.init({
    light: '#333333',
    dark: '#ffffff',
    name: 'textColor'
  })
  
  return Text("Mixed Reactive Design")
    .modifier
    .responsive({
      base: { 
        fontSize: 16,               // Static
        padding: adaptiveSpacing,   // Reactive - user preference
        color: themeColor,          // Reactive - theme
        fontWeight: 'normal'        // Static
      },
      md: { 
        fontSize: 18,               // Static override
        padding: createComputed(() => adaptiveSpacing() * 1.5), // Reactive derived
        // color and fontWeight inherited (reactive + static)
      },
      lg: { 
        fontSize: 20,               // Static override
        fontWeight: 'bold'          // Static override
        // padding and color inherited from md breakpoint
      }
    })
    .build()
}
```

### Reactive Media Queries

```typescript
const ReactiveMediaQueryComponent = () => {
  const [intensity, setIntensity] = createSignal(0.5)
  
  const dynamicOpacity = createComputed(() => 
    0.5 + (intensity() * 0.5) // Opacity between 0.5 and 1.0
  )
  
  const dynamicFilter = createComputed(() =>
    `brightness(${0.8 + (intensity() * 0.4)})` // Brightness between 0.8 and 1.2
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
    .mediaQuery('(min-width: 1200px)', {
      filter: dynamicFilter,        // Reactive filter
      transition: 'filter 0.3s ease'
    })
    .mediaQuery('(prefers-color-scheme: dark)', {
      backgroundColor: '#1a1a1a'    // Static dark mode background
    })
    .build()
}
```

### Performance Optimizations for Reactive Values

```typescript
// ✅ Optimized patterns for reactive responsive values
const OptimizedReactiveComponent = () => {
  // Create stable reactive values outside render
  const stableColor = useMemo(() => 
    ColorAsset.init({ light: '#007AFF', dark: '#0A84FF' }), []
  )
  
  const [state, setState] = createSignal({ size: 'medium', active: false })
  
  // Use computed values for complex derivations
  const responsiveConfig = createComputed(() => ({
    fontSize: {
      base: state().size === 'large' ? 18 : 16,
      md: state().size === 'large' ? 22 : 20,
      lg: state().size === 'large' ? 26 : 24
    },
    padding: {
      base: state().active ? 20 : 16,
      md: state().active ? 28 : 24
    },
    color: stableColor,              // Stable reactive asset
    transform: state().active ? 'scale(1.02)' : 'scale(1.0)'
  }))
  
  return Text("Optimized Reactive Text")
    .modifier
    .responsive(responsiveConfig)    // Single reactive responsive config
    .build()
}

// ❌ Avoid: Creating reactive values in render
const UnoptimizedComponent = () => {
  const [active, setActive] = createSignal(false)
  
  return Text("Unoptimized")
    .modifier
    .responsive({
      // Bad: Creates new computed on every render
      fontSize: createComputed(() => active() ? 20 : 16),
      // Bad: Creates new asset on every render  
      color: ColorAsset.init({ light: '#000', dark: '#fff' })
    })
    .build()
}
```

## Examples

### Complex Responsive Component

```typescript
const ResponsiveCard = ({ title, content, image }: CardProps) => {
  const bp = useBreakpoint()
  const isMobile = bp.isBelow('md')()
  
  return VStack([
    // Image with responsive sizing
    Image(image)
      .modifier
      .responsive({
        base: { width: '100%', height: 200 },
        md: { width: 300, height: 200 },
        lg: { width: 400, height: 250 }
      })
      .borderRadius({ base: 8, md: 12 })
      .build(),
    
    // Title with responsive typography
    Text(title)
      .modifier
      .responsive({
        base: { 
          fontSize: 18, 
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 8
        },
        md: { 
          fontSize: 22, 
          textAlign: 'left',
          marginBottom: 12
        },
        lg: { 
          fontSize: 26,
          marginBottom: 16
        }
      })
      .build(),
    
    // Content with responsive spacing
    Text(content)
      .modifier
      .responsive({
        base: { 
          fontSize: 14, 
          lineHeight: 1.4,
          textAlign: 'center'
        },
        md: { 
          fontSize: 16, 
          lineHeight: 1.5,
          textAlign: 'left'
        },
        lg: { 
          fontSize: 18,
          lineHeight: 1.6
        }
      })
      .build()
  ])
  .modifier
  .responsive({
    base: { 
      padding: 16,
      gap: 8,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    md: { 
      padding: 24,
      gap: 12,
      borderRadius: 12,
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
    },
    lg: { 
      padding: 32,
      gap: 16,
      boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
    }
  })
  .mediaQuery('(prefers-color-scheme: dark)', {
    backgroundColor: '#1a1a1a',
    color: '#ffffff'
  })
  .build()
}
```

This comprehensive API reference covers all aspects of TachUI's responsive modifier system. For more examples and patterns, see the [Responsive Layout Patterns](../examples/responsive-layouts.md) guide.