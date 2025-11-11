# TachUI Assets System

The Assets system provides a unified way to manage theme-adaptive resources including colors, images, and other design assets in TachUI. It's designed to be similar to SwiftUI's asset management system while leveraging TachUI's reactive architecture.

## Features

- **Theme-Adaptive Assets**: Automatically adapt to light/dark mode
- **Dot Notation Access**: Clean, intuitive API (`Assets.primaryColor`)
- **Explicit Theme Access**: Force specific theme variants (`Assets.primaryColor.light`)
- **Extensible**: Support for custom asset types beyond colors and images
- **TypeScript Support**: Full type safety with proper interfaces
- **Performance**: Efficient proxy-based access with caching

## Usage

### Basic Usage

```typescript
import { Assets, registerAsset, ColorAsset } from '@tachui/core/assets'

// Register custom assets - NEW simplified API (recommended)
registerAsset(ColorAsset.init({
  default: '#007AFF',
  light: '#007AFF',
  dark: '#0A84FF',
  name: 'primaryColor'
}))
registerAsset(ColorAsset.init({
  default: '#FFFFFF',
  light: '#FFFFFF',
  dark: '#1a1a1a',
  name: 'backgroundColor'
}))

// Use assets in components
import { Text } from '@tachui/core/components'

export function MyComponent() {
  return Text('Hello World')
    .foregroundColor(Assets.primaryColor)  // Auto-adapts to current theme
    .backgroundColor(Assets.backgroundColor)
    
}
```

### Explicit Theme Access

```typescript
// Always use light variant
Text('Always Light').foregroundColor(Assets.primaryColor.light)

// Always use dark variant
Text('Always Dark').foregroundColor(Assets.primaryColor.dark)
```

### Image Assets

```typescript
import { ImageAsset } from '@tachui/core/assets'

// Register image assets - NEW simplified API (recommended)
registerAsset(ImageAsset.init({
  default: '/logo-light.png',
  light: '/logo-light.png',
  dark: '/logo-dark.png',
  name: 'logo'
}))

// Use in components
import { Image } from '@tachui/core/components'

export function LogoComponent() {
  return Image(Assets.logo)  // Auto-adapts to current theme
    .frame(100, 50)
    
}
```

## Built-in System Assets

TachUI provides built-in system colors that match SwiftUI's color system:

```typescript
// System colors
Assets.systemBlue    // #007AFF (light) / #0A84FF (dark)
Assets.systemGreen   // #34C759 (light) / #30D158 (dark)
Assets.systemRed     // #FF3B30 (light) / #FF453A (dark)
Assets.systemOrange  // #FF9500 (light) / #FF9F0A (dark)
Assets.systemPurple  // #5856D6 (light) / #5E5CE6 (dark)
Assets.systemPink    // #FF2D55 (light) / #FF375F (dark)
Assets.systemGray    // #8E8E93 (both)
Assets.systemBlack   // #000000 (both)
Assets.systemWhite   // #FFFFFF (both)
```

## Creating Custom Assets

### Color Assets

```typescript
import { ColorAsset } from '@tachui/core/assets'

// NEW simplified API (recommended)
registerAsset(ColorAsset.init({
  default: '#FF6B35',
  light: '#FF6B35',
  dark: '#FF8E6B',
  name: 'brandPrimary'
}))

// OR create and register separately (legacy approach)
const brandPrimary = ColorAsset.init({
  default: '#FF6B35',
  light: '#FF6B35', 
  dark: '#FF8E6B',
  name: 'brandPrimary'
})
registerAsset(brandPrimary)

// Use it
Assets.brandPrimary  // Auto-adapts
Assets.brandPrimary.light  // Always light
Assets.brandPrimary.dark   // Always dark
```

### Image Assets

```typescript
import { ImageAsset } from '@tachui/core/assets'

// NEW simplified API (recommended)
registerAsset(ImageAsset.init({
  default: '/hero-light.jpg',
  light: '/hero-light.jpg',
  dark: '/hero-dark.jpg',
  name: 'heroImage',
  options: {
    alt: 'Hero banner image',
    placeholder: '/placeholder.jpg'
  }
}))

// OR create and register separately (legacy approach)
const heroImage = ImageAsset.init({
  default: '/hero-light.jpg',
  light: '/hero-light.jpg',
  dark: '/hero-dark.jpg',
  name: 'heroImage',
  options: {
    alt: 'Hero banner image',
    placeholder: '/placeholder.jpg'
  }
})
registerAsset(heroImage)

// Use it
Assets.heroImage  // Auto-adapts
Assets.heroImage.lightSrc  // Always light source
Assets.heroImage.darkSrc   // Always dark source
```

### Font Assets

Font management is a crucial part of the Assets system. TachUI provides comprehensive font loading with FontAsset:

```typescript
import { FontAsset, createGoogleFont } from '@tachui/core/assets'

// NEW simplified API (recommended)
registerAsset(FontAsset.init(
  'MyFont', 
  ['Arial', 'sans-serif'], 
  'myFont', 
  { fontUrl: '/fonts/myfont.woff2' }
))

// Use Google Fonts - simplified
registerAsset(createGoogleFont('Inter', [400, 600, 700], 'inter'))

// OR create and register separately (legacy approach)  
const customFont = FontAsset.init(
  'MyFont', 
  ['Arial', 'sans-serif'], 
  'myFont', 
  { fontUrl: '/fonts/myfont.woff2' }
)
const inter = createGoogleFont('Inter', [400, 600, 700], 'inter')
registerAsset(customFont)
registerAsset(inter)

Text("Custom Typography")
  .font({ family: Assets.inter })
  
```

For comprehensive font documentation, see the [Font Assets Guide](./font-assets.md).

## Integration with Modifiers

The Assets system seamlessly integrates with TachUI's modifier system:

```typescript
import { appearanceModifiers } from '@tachui/core/modifiers/core'

// Use assets with modifiers
const colorModifier = appearanceModifiers.foregroundColor(Assets.primaryColor)
const backgroundModifier = appearanceModifiers.backgroundColor(Assets.backgroundColor)
```

## Advanced Usage

### Asset Bundles

For better organization, you can create logical groupings of assets:

```typescript
// Create semantic color bundles - NEW simplified API
registerAsset(ColorAsset.init({
  default: '#1a1a1a',
  light: '#1a1a1a',
  dark: '#ffffff',
  name: 'textPrimary'
}))
registerAsset(ColorAsset.init({
  default: '#666666',
  light: '#666666',
  dark: '#cccccc',
  name: 'textSecondary'
}))

registerAsset(ColorAsset.init({
  default: '#FFFFFF',
  light: '#FFFFFF',
  dark: '#1a1a1a',
  name: 'backgroundPrimary'
}))
registerAsset(ColorAsset.init({
  default: '#f8f9fa',
  light: '#f8f9fa',
  dark: '#2a2a2a',
  name: 'backgroundSecondary'
}))
```

### Custom Asset Types

You can extend the system with custom asset types:

```typescript
import { Asset } from '@tachui/core/assets'

class GradientAsset extends Asset {
  constructor(
    public readonly lightGradient: string,
    public readonly darkGradient: string,
    name: string
  ) {
    super(name)
  }
  
  resolve(): string {
    return getCurrentTheme() === 'dark' ? this.darkGradient : this.lightGradient
  }
}

// Register custom asset - NEW simplified API
registerAsset(new GradientAsset(
  'linear-gradient(to right, #007AFF, #5856D6)',
  'linear-gradient(to right, #0A84FF, #5E5CE6)',
  'primaryGradient'
))
```

## API Improvements (v2.1)

### Simplified Asset Registration

TachUI now supports a streamlined asset registration API that eliminates duplicate naming:

```typescript
// ✅ NEW: Simplified - no duplicate name required
registerAsset(ColorAsset.init({
  default: '#007AFF',
  light: '#007AFF',
  dark: '#0A84FF',
  name: 'systemBlue'  // Name specified once here
}))

// ✨ NEW: Override the asset's internal name
registerAsset(ColorAsset.init({
  default: '#007AFF',
  light: '#007AFF',
  dark: '#0A84FF',
  name: 'internalBlue'
}), 'customBlue')  // Public name differs from internal name

// 🔄 OLD: Still supported for backward compatibility  
registerAsset('systemBlue', ColorAsset.init({
  default: '#007AFF',
  light: '#007AFF',
  dark: '#0A84FF',
  name: 'systemBlue'  // Name duplicated
}))
```

**Benefits:**
- **DRY Principle**: No more duplicate name specification
- **Less Error-Prone**: Name mismatch between asset and registration is impossible
- **Backward Compatible**: Existing code continues to work
- **Consistent**: Works for ColorAsset, FontAsset, ImageAsset, and custom Asset types

**Function Overloading:**
The `registerAsset` function now supports three signatures:
- `registerAsset(asset: Asset)` - NEW: Uses asset.name automatically
- `registerAsset(asset: Asset, overrideName?: string)` - NEW: Override the asset's internal name
- `registerAsset(name: string, asset: Asset)` - Legacy: Explicit name specification

**Override Name Example:**
```typescript
const brandColor = ColorAsset.init({
  default: '#FF6B35',
  light: '#FF6B35',
  dark: '#FF8E6B', 
  name: 'internalBrandName'  // Internal name
})

// Register with a different public name
registerAsset(brandColor, 'primaryBrand')

// Now accessible via the override name
Assets.primaryBrand  // ✅ Available
Assets.internalBrandName  // ❌ Not available
```

## Benefits

1. **SwiftUI Familiarity**: Developers familiar with SwiftUI will feel at home
2. **Automatic Theme Adaptation**: Colors automatically switch between light/dark modes
3. **Semantic Naming**: Clear, purpose-driven asset names
4. **Global Access**: Centralized asset definitions that can be imported anywhere
5. **Type Safety**: Full TypeScript support with proper interfaces
6. **Performance**: Reactive updates only when theme changes
7. **Flexibility**: Developers can define custom palettes while using standard assets

## Enhanced Features (v2.0)

### Color Format Validation

TachUI now automatically validates color formats when creating ColorAssets, ensuring reliability:

```typescript
import { ColorAsset } from '@tachui/core/assets'

// These will work fine
const validHex = ColorAsset.init('#FF0000', '#00FF00', 'validHex')
const validRgb = ColorAsset.init('rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'validRgb')
const validHsl = ColorAsset.init('hsl(0, 100%, 50%)', 'hsl(120, 100%, 50%)', 'validHsl')

// This will throw an error
try {
  const invalid = ColorAsset.init('invalid-color', '#000000', 'invalid')
} catch (error) {
  console.log(error.message) // "Invalid light color format for asset 'invalid': Unsupported color format..."
}
```

Supported color formats:
- **Hex**: `#FF0000`, `#F00`, `#FF000080` (with alpha)
- **RGB**: `rgb(255, 0, 0)`
- **RGBA**: `rgba(255, 0, 0, 0.5)`
- **HSL**: `hsl(360, 100%, 50%)`
- **HSLA**: `hsla(360, 100%, 50%, 0.8)`
- **Named colors**: `red`, `blue`, `transparent`, etc.
- **CSS custom properties**: `var(--primary-color)`

### Asset Discovery & Debugging

New debugging tools help you inspect registered assets:

```typescript
import { getAssetInfo, listAssetNames } from '@tachui/core/assets'

// Get all asset names
const assetNames = listAssetNames()
console.log(assetNames) // ['systemBlue', 'systemGreen', 'myCustomColor', ...]

// Get detailed asset information
const assetInfos = getAssetInfo()
console.log(assetInfos)
// [
//   { name: 'systemBlue', type: 'color', asset: ColorAsset {...} },
//   { name: 'myLogo', type: 'image', asset: ImageAsset {...} },
//   { name: 'customAsset', type: 'custom', asset: CustomAsset {...} }
// ]
```

### Enhanced TypeScript Support

Full type safety with proper interfaces:

```typescript
import { Assets, AssetsInterface, ColorAssetProxy } from '@tachui/core/assets'

// Assets now has proper TypeScript typing
const color: ColorAssetProxy = Assets.systemBlue

// Type-safe access to all variants
color.light      // string - always light variant
color.dark       // string - always dark variant  
color.resolve()  // string - current theme variant
color.toString() // string - current theme variant (implicit conversion)
```

## Implementation Details

The Assets system uses JavaScript Proxies to enable the clean dot notation API while providing automatic theme adaptation. Assets are resolved reactively based on the current theme, ensuring consistent appearance across your application.

### Color Validation Process

When creating ColorAssets, the system validates both light and dark color values using comprehensive regex patterns and value range checking. Invalid colors throw descriptive errors immediately, preventing runtime issues.

### Asset Discovery Implementation

The discovery system provides both simple name listing and detailed asset information, making it easy to debug asset registration and understand what assets are available in your application.