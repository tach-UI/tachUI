# Gradients API Reference

Complete API documentation for TachUI's gradient system with TypeScript definitions and usage examples.

## Core Functions

### LinearGradient

Creates a linear gradient definition compatible with SwiftUI patterns.

```typescript
function LinearGradient(options: LinearGradientOptions): GradientDefinition
```

**Parameters:**
- `options: LinearGradientOptions` - Configuration for the linear gradient

**Returns:**
- `GradientDefinition` - Gradient definition object for use with background modifier

**Examples:**

```typescript
import { LinearGradient, Assets } from '@tachui/core'

// Using hex colors
const basicGradient = LinearGradient({
  colors: ['#FF0000', '#00FF00'],
  startPoint: 'top',
  endPoint: 'bottom'
})

// Using ColorAssets (theme-aware)
const themeGradient = LinearGradient({
  colors: [Assets.systemBlue, Assets.systemPurple],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
})

// Mixed ColorAssets and hex colors
const mixedGradient = LinearGradient({
  colors: ['#FF0000', Assets.primaryPurple, Assets.secondaryPurple],
  startPoint: 'leading',
  endPoint: 'trailing'
})
```

### createGradientAsset

Creates a theme-reactive gradient asset that automatically switches between light and dark mode definitions.

```typescript
function createGradientAsset(definitions: GradientAssetDefinitions): GradientAsset
```

**Parameters:**
- `definitions: GradientAssetDefinitions` - Light/dark gradient definitions

**Returns:**
- `GradientAsset` - Theme-reactive gradient asset

**Example:**
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
```

## Type Definitions

### LinearGradientOptions

Configuration interface for linear gradients.

```typescript
interface LinearGradientOptions extends GradientColors {
  startPoint: GradientStartPoint
  endPoint: GradientStartPoint
  angle?: number
}
```

**Properties:**
- `colors: (string | Asset)[]` - Array of colors supporting:
  - **String colors**: `'#FF0000'`, `'rgb(255, 0, 0)'`, `'rgba(255, 0, 0, 0.5)'`
  - **ColorAssets**: `Assets.systemBlue`, `Assets.primaryPurple` (theme-aware)
  - **Mixed usage**: `['#FF0000', Assets.systemBlue, '#00FF00']`
- `stops?: number[]` - Optional color stop positions (0-100)
- `startPoint: GradientStartPoint` - SwiftUI-style start position  
- `endPoint: GradientStartPoint` - SwiftUI-style end position
- `angle?: number` - Optional angle override in degrees

### GradientStartPoint

SwiftUI-compatible direction values for gradient positioning.

```typescript
type GradientStartPoint = 
  | 'top' 
  | 'topLeading' 
  | 'leading' 
  | 'bottomLeading'
  | 'bottom' 
  | 'bottomTrailing' 
  | 'trailing' 
  | 'topTrailing' 
  | 'center'
```

**Direction Mapping:**
- `top` → `bottom` = CSS `to bottom`
- `leading` → `trailing` = CSS `to right`
- `topLeading` → `bottomTrailing` = CSS `to bottom right`
- Custom combinations automatically calculated

### GradientColors

Base interface for gradient color configuration.

```typescript
interface GradientColors {
  colors: (string | Asset)[]
  stops?: number[]
}
```

**Properties:**
- `colors` - Array of color values supporting:
  - **Hex colors**: `'#FF0000'`, `'#ff0000'`
  - **RGB/RGBA**: `'rgb(255, 0, 0)'`, `'rgba(255, 0, 0, 0.5)'`
  - **HSL/HSLA**: `'hsl(120, 100%, 50%)'`, `'hsla(120, 100%, 50%, 0.8)'`
  - **Named colors**: `'red'`, `'blue'`, `'transparent'`
  - **ColorAssets**: `Assets.systemBlue`, `Assets.primaryPurple` (automatically adapt to light/dark themes)
  - **Mixed combinations**: `['#FF0000', Assets.systemBlue, 'rgba(255, 255, 255, 0.8)']`
- `stops` - Optional array of percentage positions (0-100) for color stops

### GradientDefinition

Complete gradient definition object returned by gradient factory functions.

```typescript
interface GradientDefinition {
  type: GradientType
  options: 
    | LinearGradientOptions
    | RadialGradientOptions 
    | AngularGradientOptions
    | ConicGradientOptions
    | RepeatingLinearGradientOptions
    | RepeatingRadialGradientOptions
    | EllipticalGradientOptions
}
```

**Properties:**
- `type: GradientType` - Gradient type identifier
- `options` - Type-specific gradient configuration

### GradientType

Enumeration of supported gradient types.

```typescript
type GradientType = 
  | 'linear'
  | 'radial' 
  | 'angular'
  | 'conic'
  | 'repeating-linear'
  | 'repeating-radial'
  | 'elliptical'
```

### GradientAssetDefinitions

Theme-specific gradient definitions for creating adaptive gradient assets.

```typescript
interface GradientAssetDefinitions {
  light: GradientDefinition
  dark: GradientDefinition
  [key: string]: GradientDefinition
}
```

**Properties:**
- `light: GradientDefinition` - Gradient for light theme
- `dark: GradientDefinition` - Gradient for dark theme
- `[key: string]: GradientDefinition` - Support for custom themes

## ColorAsset Support

### Theme-Aware Gradients with ColorAssets

TachUI gradients fully support ColorAssets, enabling automatic theme switching and consistent design system integration.

**✅ Full ColorAsset Support:**
- All gradient functions accept `(string | Asset)[]` for colors
- ColorAssets automatically resolve to appropriate theme values
- Mix string colors and ColorAssets freely
- Type-safe with full TypeScript support

**Examples:**

```typescript
import { LinearGradient, Assets } from '@tachui/core'

// Pure ColorAsset gradients (theme-aware)
const systemGradient = LinearGradient({
  colors: [Assets.systemBlue, Assets.systemPurple],
  startPoint: 'top',
  endPoint: 'bottom'
})

// Brand color gradients using your design system
const brandGradient = LinearGradient({
  colors: [Assets.primaryPurple, Assets.secondaryPurple, Assets.accentBlue],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing',
  stops: [0, 50, 100]
})

// Mixed approach for maximum flexibility
const flexibleGradient = LinearGradient({
  colors: [
    '#FFFFFF',           // Static white
    Assets.primaryPurple, // Theme-aware brand color
    'rgba(0, 0, 0, 0.1)' // Static transparent overlay
  ],
  startPoint: 'top',
  endPoint: 'bottom'
})
```

**Real-world Component Usage:**

```typescript
import { VStack, Text, LinearGradient, Assets } from '@tachui/core'

// Card with theme-aware gradient background
const GradientCard = VStack({
  children: [
    Text('Theme-Aware Card')
      .modifier
      .foregroundColor(Assets.textPrimary)
      .build()
  ]
})
.modifier
.background(LinearGradient({
  colors: [Assets.cardBackgroundStart, Assets.cardBackgroundEnd],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
}))
.padding(20)
.cornerRadius(16)
.build()
```

**Theme Switching Benefits:**
- Gradients automatically adapt when user switches between light/dark themes
- No manual theme handling required
- Consistent with your overall design system
- Performance optimized with automatic caching

## CSS Generation

### generateLinearGradientCSS

Converts a linear gradient configuration to CSS `linear-gradient()` string.

```typescript
function generateLinearGradientCSS(options: LinearGradientOptions): string
```

**Parameters:**
- `options: LinearGradientOptions` - Linear gradient configuration

**Returns:**
- `string` - CSS linear-gradient() declaration

**Examples:**

```typescript
import { generateLinearGradientCSS, Assets } from '@tachui/core'

// With hex colors
const basicCSS = generateLinearGradientCSS({
  colors: ['#FF0000', '#00FF00'],
  startPoint: 'top',
  endPoint: 'bottom',
  stops: [0, 100]
})
// Returns: 'linear-gradient(to bottom, #FF0000 0%, #00FF00 100%)'

// With ColorAssets (resolves automatically to theme values)
const themeCSS = generateLinearGradientCSS({
  colors: [Assets.systemBlue, Assets.systemPurple],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
})
// Returns: 'linear-gradient(to bottom right, #007AFF, #AF52DE)' (light theme)
// Returns: 'linear-gradient(to bottom right, #0A84FF, #BF5AF2)' (dark theme)

// Mixed ColorAssets and static colors
const mixedCSS = generateLinearGradientCSS({
  colors: ['#FFFFFF', Assets.primaryPurple, 'rgba(0, 0, 0, 0.1)'],
  startPoint: 'top',
  endPoint: 'bottom'
})
// ColorAssets resolve while static colors remain unchanged
```

### gradientToCSS

Universal gradient-to-CSS converter supporting all gradient types.

```typescript
function gradientToCSS(gradient: GradientDefinition): string
```

**Parameters:**
- `gradient: GradientDefinition` - Any gradient definition object

**Returns:**
- `string` - CSS gradient declaration

**Examples:**

```typescript
import { gradientToCSS, LinearGradient, Assets } from '@tachui/core'

// Static colors
const staticGradient = LinearGradient({
  colors: ['#667eea', '#764ba2'],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
})
const staticCSS = gradientToCSS(staticGradient)
// Returns: 'linear-gradient(to bottom right, #667eea, #764ba2)'

// ColorAssets (theme-aware)
const themeGradient = LinearGradient({
  colors: [Assets.systemBlue, Assets.systemPurple],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
})
const themeCSS = gradientToCSS(themeGradient)
// Returns: 'linear-gradient(to bottom right, #007AFF, #AF52DE)' (light theme)
// Returns: 'linear-gradient(to bottom right, #0A84FF, #BF5AF2)' (dark theme)
```

## Asset System Integration

### GradientAsset

Theme-reactive gradient asset class extending the base Asset system.

```typescript
class GradientAsset extends Asset<string> {
  constructor(name: string, definitions: GradientAssetDefinitions)
  resolve(): string
}
```

**Methods:**
- `resolve(): string` - Returns CSS gradient string for current theme
- Inherits from `Asset<string>` for compatibility with Asset system

**Example:**
```typescript
import { GradientAsset } from '@tachui/core'

const gradientAsset = new GradientAsset('hero-gradient', {
  light: LinearGradient({ /* light config */ }),
  dark: LinearGradient({ /* dark config */ })
})

// Automatically resolves to appropriate theme
const css = gradientAsset.resolve()
```

## Background Modifier Integration

### Enhanced Background Modifier

The background modifier has been enhanced to support gradients alongside existing functionality.

```typescript
interface BackgroundOptions {
  background: string | GradientDefinition | Asset
}

class BackgroundModifier extends BaseModifier<BackgroundOptions> {
  readonly type = 'background'
  readonly priority = 95 // Higher than backgroundColor (90)
}
```

**Supported Background Types:**
- `string` - CSS color values, hex codes, named colors
- `GradientDefinition` - Gradient objects from factory functions
- `Asset` - Asset objects including GradientAsset instances

**Usage Examples:**
```typescript
// String background
Button('Click', action)
  .modifier
  .background('#FF0000')
  .build()

// Gradient background  
Button('Click', action)
  .modifier
  .background(LinearGradient({ /* config */ }))
  .build()

// Asset background
Button('Click', action)
  .modifier
  .background(Assets.primaryGradient)
  .build()
```

## Modifier Builder Integration

### Background Method

The ModifierBuilder interface includes the enhanced background method.

```typescript
interface ModifierBuilder<T> {
  background(value: string | GradientDefinition | Asset | Signal<string>): ModifierBuilder<T>
  // ... other methods
}
```

**Parameters:**
- `value` - Background value supporting:
  - `string` - CSS background values
  - `GradientDefinition` - Gradient objects
  - `Asset` - Asset objects including gradient assets
  - `Signal<string>` - Reactive string values

**Examples:**

```typescript
import { VStack, LinearGradient, Assets } from '@tachui/core'

// Static color gradient
const staticCard = VStack({ children: [...] })
  .modifier
  .background(LinearGradient({
    colors: ['#FF6B6B', '#4ECDC4'],
    startPoint: 'top',
    endPoint: 'bottom'
  }))
  .padding(20)
  .cornerRadius(16)
  .build()

// ColorAsset gradient (theme-aware)
const themeCard = VStack({ children: [...] })
  .modifier
  .background(LinearGradient({
    colors: [Assets.cardBackgroundStart, Assets.cardBackgroundEnd],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }))
  .padding(20)
  .cornerRadius(16)
  .build()

// Mixed approach for design flexibility
const flexibleCard = VStack({ children: [...] })
  .modifier
  .background(LinearGradient({
    colors: [
      'rgba(255, 255, 255, 0.9)', // Static overlay
      Assets.primaryPurple,         // Theme-aware brand color
      Assets.secondaryPurple        // Theme-aware accent
    ],
    startPoint: 'top',
    endPoint: 'bottom',
    stops: [0, 60, 100]
  }))
  .padding(20)
  .cornerRadius(16)
  .build()
```

## Performance Considerations

### Caching

TachUI automatically caches generated CSS strings for gradient definitions:

```typescript
// These gradients share the same cache entry
const gradient1 = LinearGradient({
  colors: ['#FF0000', '#00FF00'],
  startPoint: 'top',
  endPoint: 'bottom'
})

const gradient2 = LinearGradient({
  colors: ['#FF0000', '#00FF00'],
  startPoint: 'top',
  endPoint: 'bottom'
})
// Both resolve to the same cached CSS string
```

### Asset Resolution

GradientAsset instances cache resolved CSS and update automatically on theme changes:

```typescript
const themeGradient = createGradientAsset({
  light: LinearGradient({ /* light config */ }),
  dark: LinearGradient({ /* dark config */ })
})

// First call generates and caches CSS
const lightCSS = themeGradient.resolve() // theme = light

// Theme change triggers automatic cache invalidation
// Next call generates and caches new CSS for dark theme
const darkCSS = themeGradient.resolve() // theme = dark
```

## Error Handling

### Validation

The gradient system includes built-in validation for common errors:

```typescript
// Invalid color format
const invalid = LinearGradient({
  colors: ['not-a-color', '#FF0000'], // Throws validation error
  startPoint: 'top',
  endPoint: 'bottom'
})

// Invalid direction
const invalidDirection = LinearGradient({
  colors: ['#FF0000', '#00FF00'],
  startPoint: 'invalid' as any, // TypeScript error
  endPoint: 'bottom'
})
```

### Graceful Degradation

When gradients cannot be applied, the system falls back gracefully:

```typescript
// If gradient fails, background falls back to transparent
// No visual breaking occurs
```

## Future API Extensions

### Version 1.2 Additions (RadialGradient, AngularGradient)

```typescript
// Coming in Version 1.2
interface RadialGradientOptions extends GradientColors {
  center: GradientCenter
  startRadius: number
  endRadius: number
  shape?: 'circle' | 'ellipse'
}

interface AngularGradientOptions extends GradientColors {
  center: GradientCenter
  startAngle: number
  endAngle: number
}

function RadialGradient(options: RadialGradientOptions): GradientDefinition
function AngularGradient(options: AngularGradientOptions): GradientDefinition
```

### Version 1.3 Additions (State and Animation)

```typescript
// Coming in Version 1.3
interface InteractionGradientOptions {
  default: GradientDefinition
  hover?: GradientDefinition
  pressed?: GradientDefinition
  focused?: GradientDefinition
  transition?: TransitionOptions
}

interface TransitionOptions {
  duration: number
  easing?: string
}
```

This API reference provides complete documentation for all current gradient functionality with TypeScript annotations and practical examples.