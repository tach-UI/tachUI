# SwiftUI Background Gradients

TachUI provides comprehensive gradient support that mirrors SwiftUI's gradient API while leveraging web-specific optimizations and the TachUI Asset system for theme reactivity.

## Overview

The gradient system includes:
- **LinearGradient** - CSS `linear-gradient()` with SwiftUI-style direction mapping
- **RadialGradient** - CSS `radial-gradient()` with configurable shapes and positioning  
- **AngularGradient** - CSS `conic-gradient()` for angular/conic gradients
- **Asset Integration** - Theme-reactive gradients that automatically switch with light/dark modes
- **Background Modifier** - Enhanced `.background()` modifier supporting gradients, Assets, and static colors

## Basic Linear Gradients

### Simple Gradient

```typescript
import { Button, LinearGradient } from '@tachui/core'

const gradientButton = Button('Click Me', () => {
  console.log('Button clicked!')
})
  .modifier
  .background(
    LinearGradient({
      colors: ['#FF6B6B', '#4ECDC4'],
      startPoint: 'top',
      endPoint: 'bottom'
    })
  )
  .foregroundColor('white')
  .cornerRadius(8)
  .padding(16)
  .build()
```

### Diagonal Gradients

```typescript
const diagonalGradient = LinearGradient({
  colors: ['#667eea', '#764ba2'],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
})

const heroCard = VStack({ children: [
  Text('Welcome to TachUI').fontSize(24).fontWeight('bold'),
  Text('SwiftUI-inspired web framework').opacity(0.8)
] })
  .modifier
  .background(diagonalGradient)
  .foregroundColor('white')
  .padding(32)
  .cornerRadius(16)
  .build()
```

### Custom Angle Gradients

```typescript
const customAngleGradient = LinearGradient({
  colors: ['#ff9a9e', '#fecfef', '#fecfef'],
  startPoint: 'top',
  endPoint: 'bottom',
  angle: 45 // Override direction with custom angle
})
```

## Color Stops

Control gradient color distribution with custom stops:

```typescript
const preciseGradient = LinearGradient({
  colors: ['#ff0000', '#00ff00', '#0000ff'],
  startPoint: 'top',
  endPoint: 'bottom',
  stops: [0, 30, 100] // Red at 0%, Green at 30%, Blue at 100%
})
```

## Asset Integration

### Theme-Reactive Gradients

Create gradients that automatically adapt to light/dark themes:

```typescript
import { createGradientAsset, LinearGradient } from '@tachui/core'

const themeGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#ffffff', '#f8f9fa'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  dark: LinearGradient({
    colors: ['#343a40', '#212529'],
    startPoint: 'top',
    endPoint: 'bottom'
  })
})

// Use in components
const adaptiveCard = VStack({ children: [...] })
  .modifier
  .background(themeGradient)
  .build()
```

### Mixed Asset and Static Colors

Combine Asset colors with static colors in the same gradient:

```typescript
import { Assets, LinearGradient } from '@tachui/core'

const mixedGradient = LinearGradient({
  colors: [
    Assets.primaryColor,    // Theme-reactive Asset
    '#FF6B6B',             // Static color
    Assets.secondaryColor   // Theme-reactive Asset
  ],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
})
```

## Direction Reference

### SwiftUI Direction Mapping

TachUI uses SwiftUI-compatible direction names:

| SwiftUI Direction | CSS Equivalent | Description |
|------------------|----------------|-------------|
| `top` → `bottom` | `to bottom` | Top to bottom |
| `bottom` → `top` | `to top` | Bottom to top |
| `leading` → `trailing` | `to right` | Left to right |
| `trailing` → `leading` | `to left` | Right to left |
| `topLeading` → `bottomTrailing` | `to bottom right` | Top-left to bottom-right |
| `topTrailing` → `bottomLeading` | `to bottom left` | Top-right to bottom-left |
| `bottomLeading` → `topTrailing` | `to top right` | Bottom-left to top-right |
| `bottomTrailing` → `topLeading` | `to top left` | Bottom-right to top-left |

## Advanced Examples

### Calculator Button with Gradient

```typescript
import { Button, LinearGradient, createGradientAsset } from '@tachui/core'

const operatorGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#ff9500', '#ff6b00'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  dark: LinearGradient({
    colors: ['#ff9500', '#cc7700'],
    startPoint: 'top',
    endPoint: 'bottom'
  })
})

const operatorButton = (symbol: string, action: () => void) => 
  Button(symbol, action)
    .modifier
    .background(operatorGradient)
    .foregroundColor('white')
    .fontSize(24)
    .fontWeight('semibold')
    .frame(60, 60)
    .cornerRadius(30)
    .build()
```

### Card with Hover Gradient Transition

```typescript
import { VStack, LinearGradient, createGradientAsset } from '@tachui/core'

const cardGradient = LinearGradient({
  colors: ['#667eea', '#764ba2'],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
})

const hoverGradient = LinearGradient({
  colors: ['#764ba2', '#667eea'], // Reversed colors
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
})

const interactiveCard = VStack({ children: [
  Text('Interactive Card').fontSize(18).fontWeight('bold'),
  Text('Hover to see gradient transition').opacity(0.8)
] })
  .modifier
  .background(cardGradient)
  .foregroundColor('white')
  .padding(24)
  .cornerRadius(12)
  .onHover((isHovered: boolean) => {
    // Note: Advanced hover state transitions will be available in Version 1.3
    console.log('Card hovered:', isHovered)
  })
  .build()
```

## Performance Considerations

### Gradient Caching

TachUI automatically caches generated CSS strings for repeated gradient definitions:

```typescript
// These will share the same cached CSS
const gradient1 = LinearGradient({
  colors: ['#ff0000', '#00ff00'],
  startPoint: 'top',
  endPoint: 'bottom'
})

const gradient2 = LinearGradient({
  colors: ['#ff0000', '#00ff00'], 
  startPoint: 'top',
  endPoint: 'bottom'
})
```

### Hardware Acceleration

Linear gradients automatically trigger GPU acceleration where beneficial:

```typescript
// This gradient will use hardware acceleration
const performantGradient = LinearGradient({
  colors: ['#667eea', '#764ba2'],
  startPoint: 'top',
  endPoint: 'bottom'
})
```

## Browser Compatibility

TachUI gradients generate standard CSS that works across all modern browsers:

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile browsers**: Full support

## Best Practices

### 1. Use Assets for Theme Consistency

```typescript
// Good: Theme-reactive
const gradient = createGradientAsset({
  light: LinearGradient({ colors: [Assets.primary, Assets.secondary], ... }),
  dark: LinearGradient({ colors: [Assets.primaryDark, Assets.secondaryDark], ... })
})

// Avoid: Static colors that don't adapt to themes
const staticGradient = LinearGradient({
  colors: ['#fff', '#000'], // Won't adapt to dark mode
  startPoint: 'top',
  endPoint: 'bottom'
})
```

### 2. Optimize Color Stops

```typescript
// Good: Meaningful color stops
const optimizedGradient = LinearGradient({
  colors: ['#ff0000', '#ffff00', '#00ff00'],
  stops: [0, 50, 100],
  startPoint: 'top',
  endPoint: 'bottom'
})

// Avoid: Unnecessary precision
const overOptimized = LinearGradient({
  colors: ['#ff0000', '#ffff00', '#00ff00'],
  stops: [0, 49.7, 100.0], // Unnecessary precision
  startPoint: 'top',
  endPoint: 'bottom'
})
```

### 3. Prefer SwiftUI Directions

```typescript
// Good: SwiftUI-style directions
const swiftUIStyle = LinearGradient({
  colors: ['#ff0000', '#00ff00'],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
})

// Avoid: Only use custom angles when necessary
const customAngle = LinearGradient({
  colors: ['#ff0000', '#00ff00'],
  startPoint: 'top',
  endPoint: 'bottom',
  angle: 45 // Only when SwiftUI directions don't fit
})
```

## State-Based Gradients (Version 1.3)

TachUI supports interactive gradients that change based on component state (hover, active, focus, disabled) with smooth animations.

### Basic State Gradients

```typescript
import { Button, LinearGradient } from '@tachui/core'

const interactiveButton = Button('Hover Me', () => {
  console.log('Clicked!')
})
  .modifier
  .background({
    default: LinearGradient({
      colors: ['#007AFF', '#0051D2'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    hover: LinearGradient({
      colors: ['#1A8FFF', '#0062E3'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    active: LinearGradient({
      colors: ['#0066CC', '#004499'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    animation: {
      duration: 150,
      easing: 'ease-out'
    }
  })
  .padding(12)
  .cornerRadius(6)
  .build()
```

### Card Hover Effects

```typescript
import { VStack, Text, LinearGradient } from '@tachui/core'

const hoverCard = VStack({ children: [
  Text('Interactive Card').fontSize(18).fontWeight('600'),
  Text('Hover to see gradient transition').opacity(0.7)
] })
  .modifier
  .background({
    default: '#FFFFFF',
    hover: LinearGradient({
      colors: ['#F8F9FA', '#E9ECEF'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    }),
    animation: {
      duration: 200,
      easing: 'ease'
    }
  })
  .padding(16)
  .cornerRadius(8)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
  .build()
```

### Form Input Focus States

```typescript
import { TextField } from '@tachui/core'

const focusInput = TextField('Enter your name')
  .modifier
  .background({
    default: '#FFFFFF',
    focus: LinearGradient({
      colors: ['#F0F8FF', '#E6F3FF'],
      startPoint: 'top',
      endPoint: 'bottom'
    }),
    disabled: '#F5F5F5',
    animation: {
      duration: 100,
      easing: 'ease-in-out'
    }
  })
  .border({ width: 1, color: '#DDD', style: 'solid' })
  .cornerRadius(4)
  .padding(8)
  .build()
```

### Complete State Configuration

```typescript
// Full state gradient configuration
const completeStateGradient = {
  default: LinearGradient({
    colors: ['#667eea', '#764ba2'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  hover: LinearGradient({
    colors: ['#7986f4', '#8b5bae'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  active: LinearGradient({
    colors: ['#5567d3', '#653a8d'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  focus: LinearGradient({
    colors: ['#8FA2FF', '#9D6EBA'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),
  disabled: '#CCCCCC',
  animation: {
    duration: 250,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 0
  }
}
```

### State Gradient Assets

For reusable state gradients across components:

```typescript
import { StateGradient } from '@tachui/core'

// Create reusable state gradient asset
const primaryButtonGradient = StateGradient('primary-button', {
  default: LinearGradient({
    colors: ['#007AFF', '#0051D2'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  hover: LinearGradient({
    colors: ['#1A8FFF', '#0062E3'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  active: LinearGradient({
    colors: ['#0066CC', '#004499'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  disabled: '#CCCCCC',
  animation: {
    duration: 150,
    easing: 'ease-out'
  }
})

// Use across multiple components
const button1 = Button('Save').background(primaryButtonGradient).build()
const button2 = Button('Submit').background(primaryButtonGradient).build()
```

### Animation Configurations

```typescript
// Fast animations for immediate feedback
const quickTransition = {
  duration: 100,
  easing: 'ease-out'
}

// Smooth animations for elegant transitions  
const smoothTransition = {
  duration: 300,
  easing: 'ease-in-out'
}

// Custom cubic-bezier for sophisticated motion
const customEasing = {
  duration: 250,
  easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  delay: 0
}
```

### Performance Optimizations

State gradients are optimized for performance:

- **Pre-resolved Gradients**: All state gradients are converted to CSS at creation time
- **Transition Throttling**: Rapid state changes are throttled during animations
- **CSS Caching**: Generated CSS is cached to avoid repeated calculations
- **Hardware Acceleration**: Transitions use GPU acceleration where available

## Advanced Gradient Types (Version 1.2)

### RadialGradient

```typescript
import { RadialGradient } from '@tachui/core'

const radialButton = Button('Radial Effect')
  .modifier
  .background(
    RadialGradient({
      center: 'center',
      startRadius: 0,
      endRadius: 100,
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1']
    })
  )
  .build()
```

### AngularGradient

```typescript
import { AngularGradient } from '@tachui/core'

const conicGradient = AngularGradient({
  center: [50, 50],
  startAngle: 0,
  endAngle: 360,
  colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF6B6B']
})
```

### RepeatingGradients

```typescript
import { RepeatingLinearGradient, RepeatingRadialGradient } from '@tachui/core'

// Striped patterns
const stripes = RepeatingLinearGradient({
  direction: 'to right',
  colors: ['#FF6B6B', '#4ECDC4'],
  colorStops: ['0px', '20px', '20px', '40px']
})

// Radial patterns
const concentricCircles = RepeatingRadialGradient({
  center: 'center',
  shape: 'circle',
  colors: ['#667eea', '#764ba2'],
  colorStops: ['0px', '10px', '10px', '20px']
})
```

## Developer Experience Features (Version 1.4)

### Gradient Presets

TachUI includes comprehensive gradient presets for rapid development:

```typescript
import { 
  LinearGradientPresets, 
  InteractiveGradientPresets,
  GradientExamples 
} from '@tachui/core'

// Quick preset usage
const button = Button('Click Me')
  .modifier
  .background(InteractiveGradientPresets.primaryButton())
  .build()

// iOS-style gradients
const iosButton = Button('iOS Style')
  .modifier
  .background(LinearGradientPresets.iosBlue())
  .build()

// Component-specific presets
const buttonGradients = GradientExamples.createComponentGradients('ios')
const primaryBtn = Button('Primary')
  .modifier
  .background(buttonGradients.Button.primary)
  .build()
```

### Reactive Gradients

Create dynamic gradients that respond to signals:

```typescript
import { ReactiveGradients, signal } from '@tachui/core'

// Create reactive signals
const progressSignal = signal(0.3) // 30% progress
const colorSignal = signal('#007AFF')

// Reactive linear gradient
const progressGradient = ReactiveGradients.linear({
  colors: [colorSignal, 'transparent'],
  stops: [progressSignal, progressSignal],
  startPoint: 'leading',
  endPoint: 'trailing'
})

// Use in component
const progressBar = VStack([])
  .modifier
  .background(progressGradient)
  .height(20)
  .cornerRadius(10)
  .build()

// Update progress
progressSignal.value = 0.7 // Gradient updates automatically
```

### Gradient Utilities

Comprehensive utilities for gradient manipulation:

```typescript
import { GradientUtils } from '@tachui/core'

// Transform gradients
const baseGradient = LinearGradientPresets.ocean()
const reversedGradient = GradientUtils.reverse(baseGradient)
const transparentGradient = GradientUtils.withOpacity(baseGradient, 0.5)

// Color utilities
const lighterColor = GradientUtils.lighten('#007AFF', 0.2)
const darkerColor = GradientUtils.darken('#007AFF', 0.2)
const complement = GradientUtils.complement('#007AFF')

// Generate gradients
const rainbow = GradientUtils.rainbow(6)
const monochrome = GradientUtils.monochromatic('#007AFF', 5)

// State gradient utilities
const hoverEffect = GradientUtils.createHoverEffect(baseGradient, 0.1)
const buttonStates = GradientUtils.createButtonStates('#007AFF', 'primary')
```

### Validation and Debugging

Enhanced TypeScript support and runtime validation:

```typescript
import { 
  GradientValidation, 
  GradientDebugger,
  GradientInspector 
} from '@tachui/core'

// Validate gradient at runtime
const gradient = LinearGradient({
  colors: ['#ff0000', '#00ff00'],
  startPoint: 'top',
  endPoint: 'bottom'
})

const validation = GradientValidation.validateGradient(gradient)
if (!validation.valid) {
  console.error('Invalid gradient:', validation.errors)
}

// Debug gradient performance
const debugInfo = GradientDebugger.debugGradient(gradient)
console.log('Complexity:', debugInfo.performance.complexity)
console.log('Performance impact:', debugInfo.performance.impact)

// Development inspector (dev mode only)
GradientInspector.inspect(gradient, 'My Button Gradient')
```

### Performance Monitoring

Monitor gradient performance in development:

```typescript
import { 
  gradientPerformanceMonitor,
  GradientInspector 
} from '@tachui/core'

// Track gradient usage
gradientPerformanceMonitor.trackCreation('button-primary', gradient)

// Generate performance report (dev mode)
GradientInspector.generateReport()

// Export metrics for analysis
const metrics = gradientPerformanceMonitor.exportMetrics()
console.log(metrics)
```

### Theme Integration

Create theme-aware gradient systems:

```typescript
import { GradientExamples } from '@tachui/core'

// Create themed gradient collections
const iosGradients = GradientExamples.createComponentGradients('ios')
const materialGradients = GradientExamples.createComponentGradients('material')
const modernGradients = GradientExamples.createComponentGradients('modern')

// Use themed gradients
const themedButton = Button('Themed')
  .modifier
  .background(iosGradients.Button.primary)
  .padding(12)
  .cornerRadius(8)
  .build()
```

## API Reference

### LinearGradient Options

```typescript
interface LinearGradientOptions {
  colors: (string | Asset)[]     // Gradient colors (hex, rgb, Assets)
  stops?: number[]               // Optional color stop positions (0-100)
  startPoint: GradientStartPoint // SwiftUI-style start position
  endPoint: GradientStartPoint   // SwiftUI-style end position  
  angle?: number                 // Optional angle override (degrees)
}

type GradientStartPoint = 
  | 'top' | 'bottom' | 'leading' | 'trailing' | 'center'
  | 'topLeading' | 'topTrailing' 
  | 'bottomLeading' | 'bottomTrailing'
```

### StateGradientOptions (Version 1.3)

```typescript
interface StateGradientOptions {
  default: GradientDefinition | string | Asset    // Required default state
  hover?: GradientDefinition | string | Asset     // Optional hover state
  active?: GradientDefinition | string | Asset    // Optional active/pressed state
  focus?: GradientDefinition | string | Asset     // Optional focus state
  disabled?: GradientDefinition | string | Asset  // Optional disabled state
  animation?: GradientAnimationOptions            // Optional animation config
}

interface GradientAnimationOptions {
  duration?: number    // Animation duration in milliseconds (default: 300)
  easing?: string     // CSS easing function (default: 'ease')
  delay?: number      // Animation delay in milliseconds (default: 0)
}
```

### Background Modifier

```typescript
// String background
.background('#FF0000')
.background('linear-gradient(...)')

// Gradient background  
.background(LinearGradient({ ... }))

// Asset background
.background(Assets.primaryGradient)
.background(createGradientAsset({ ... }))

// State-based background (Version 1.3)
.background({
  default: LinearGradient({ ... }),
  hover: LinearGradient({ ... }),
  active: '#0066CC',
  animation: { duration: 200, easing: 'ease-out' }
})

// StateGradientAsset
.background(StateGradient('name', { ... }))
```

### StateGradientAsset Methods

```typescript
class StateGradientAsset extends Asset<string> {
  setState(state: keyof StateGradientOptions): void
  getState(): keyof StateGradientOptions
  resolve(): string
  getStateGradient(state: keyof StateGradientOptions): string
  getAnimationCSS(): string
  getAvailableStates(): (keyof StateGradientOptions)[]
  hasState(state: keyof StateGradientOptions): boolean
  setAnimation(options: Partial<GradientAnimationOptions>): void
  clearCache(): void
  updateStateGradients(newGradients: StateGradientOptions): void
}

// Factory function
function StateGradient(name: string, gradients: StateGradientOptions): StateGradientAsset
```

### Version 1.4 APIs

#### Gradient Presets

```typescript
// Linear gradient presets
const LinearGradientPresets = {
  vertical: (colors: [string, string]) => LinearGradient,
  horizontal: (colors: [string, string]) => LinearGradient,
  diagonal: (colors: [string, string]) => LinearGradient,
  iosBlue: () => LinearGradient,
  materialBlue: () => LinearGradient,
  ocean: () => LinearGradient,
  sunset: () => LinearGradient,
  rainbow: () => LinearGradient,
  cardLight: () => LinearGradient,
  glass: () => LinearGradient
}

// Interactive gradient presets
const InteractiveGradientPresets = {
  primaryButton: () => StateGradientOptions,
  secondaryButton: () => StateGradientOptions,
  dangerButton: () => StateGradientOptions,
  successButton: () => StateGradientOptions,
  hoverCard: () => StateGradientOptions,
  focusInput: () => StateGradientOptions
}

// Comprehensive examples
const GradientExamples = {
  Button: ButtonGradients,
  Card: CardGradients,
  Navigation: NavigationGradients,
  Form: FormGradients,
  Dashboard: DashboardGradients,
  Animation: AnimationGradients,
  Background: BackgroundGradients,
  Themed: ThemedGradients,
  createComponentGradients: (theme: 'ios' | 'material' | 'modern') => ComponentGradients
}
```

#### Reactive Gradients

```typescript
// Reactive gradient options
interface ReactiveLinearGradientOptions {
  colors: (string | Asset | Signal<string>)[]
  stops?: (number | Signal<number>)[]
  startPoint: GradientStartPoint | Signal<GradientStartPoint>
  endPoint: GradientStartPoint | Signal<GradientStartPoint>
  angle?: number | Signal<number>
}

// Reactive gradient factory
const ReactiveGradients = {
  linear: (options: ReactiveLinearGradientOptions, updateCallback?: () => void) => ReactiveGradientAsset,
  radial: (options: ReactiveRadialGradientOptions, updateCallback?: () => void) => ReactiveGradientAsset,
  angular: (options: ReactiveAngularGradientOptions, updateCallback?: () => void) => ReactiveGradientAsset,
  state: (name: string, options: ReactiveStateGradientOptions, updateCallback?: () => void) => ReactiveStateGradientAsset
}

// Reactive utility functions
const ReactiveGradientUtils = {
  createAnimatedGradient: (colors: string[], duration?: number) => ReactiveGradientAsset,
  createProgressGradient: (progressSignal: Signal<number>, color?: string) => ReactiveGradientAsset,
  createDataGradient: (valueSignal: Signal<number>, minValue: number, maxValue: number, colorScale?: string[]) => ReactiveGradientAsset
}
```

#### Validation and Utilities

```typescript
// Type guards
const GradientTypeGuards = {
  isGradientDefinition: (value: unknown) => value is GradientDefinition,
  isLinearGradient: (value: unknown) => value is LinearGradient,
  isRadialGradient: (value: unknown) => value is RadialGradient,
  isStateGradientOptions: (value: unknown) => value is StateGradientOptions,
  isStatefulBackgroundValue: (value: unknown) => value is StatefulBackgroundValue
}

// Validation functions
const GradientValidation = {
  validateColor: (color: string | Asset) => { valid: boolean; error?: string },
  validateColors: (colors: (string | Asset)[]) => { valid: boolean; errors: string[] },
  validateLinearGradient: (options: LinearGradientOptions) => { valid: boolean; errors: string[] },
  validateRadialGradient: (options: RadialGradientOptions) => { valid: boolean; errors: string[] },
  validateStateGradientOptions: (options: StateGradientOptions) => { valid: boolean; errors: string[] },
  validateGradient: (gradient: GradientDefinition) => { valid: boolean; errors: string[] }
}

// Utility functions
const GradientUtils = {
  // Color utilities
  lighten: (color: string, amount?: number) => string,
  darken: (color: string, amount?: number) => string,
  complement: (color: string) => string,
  withAlpha: (color: string, alpha: number) => string,
  blendColors: (color1: string, color2: string, ratio?: number) => string,
  
  // Gradient transformations
  reverse: <T extends GradientDefinition>(gradient: T) => T,
  withOpacity: (gradient: GradientDefinition, opacity: number) => GradientDefinition,
  mirror: (gradient: GradientDefinition) => GradientDefinition,
  toRadial: (gradient: GradientDefinition, radius?: number) => GradientDefinition,
  
  // Gradient analysis
  getColorCount: (gradient: GradientDefinition) => number,
  getComplexityScore: (gradient: GradientDefinition) => number,
  getPerformanceImpact: (gradient: GradientDefinition) => 'low' | 'medium' | 'high',
  hasTransparency: (gradient: GradientDefinition) => boolean,
  
  // Gradient generators
  rainbow: (steps?: number) => GradientDefinition,
  monochromatic: (baseColor: string, steps?: number) => GradientDefinition,
  complementary: (color1: string, color2?: string) => GradientDefinition,
  
  // State gradient utilities
  createHoverEffect: (baseGradient: GradientDefinition, intensity?: number) => StateGradientOptions,
  createButtonStates: (baseColor: string, type?: 'primary' | 'secondary' | 'danger') => StateGradientOptions,
  createCardHover: (backgroundColor?: string) => StateGradientOptions,
  
  // Utility functions
  toCSS: (background: StatefulBackgroundValue) => string,
  clone: <T extends GradientDefinition>(gradient: T) => T,
  equals: (a: GradientDefinition, b: GradientDefinition) => boolean
}
```

#### Performance and Debugging

```typescript
// Performance monitoring
class GradientPerformanceMonitor {
  static getInstance(): GradientPerformanceMonitor
  setEnabled(enabled: boolean): void
  trackCreation(gradientId: string, gradient: GradientDefinition): void
  trackResolution(gradientId: string, fromCache?: boolean): void
  getMetrics(gradientId: string): GradientPerformanceMetrics | undefined
  getSummary(): PerformanceSummary
  reset(): void
  exportMetrics(): string
}

// Debugging utilities
const GradientDebugger = {
  debugGradient: (gradient: GradientDefinition) => GradientDebugInfo,
  debugStateGradient: (stateGradient: StateGradientOptions) => StateGradientDebugInfo,
  profileOperation: <T>(name: string, operation: () => T) => T,
  analyzeCSS: (css: string) => CSSAnalysis
}

// Development inspector
const GradientInspector = {
  inspect: (gradient: GradientDefinition | StateGradientOptions, label?: string) => void,
  trackUsage: (componentName: string, gradientType: string) => void,
  generateReport: () => void
}
```