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

// Register custom assets
registerAsset('primaryColor', ColorAsset.init('#007AFF', '#0A84FF', 'primaryColor'))
registerAsset('backgroundColor', ColorAsset.init('#FFFFFF', '#1a1a1a', 'backgroundColor'))

// Use assets in components
import { Text } from '@tachui/core/components'

export function MyComponent() {
  return Text('Hello World')
    .modifier
    .foregroundColor(Assets.primaryColor)  // Auto-adapts to current theme
    .backgroundColor(Assets.backgroundColor)
    .build()
}
```

### Explicit Theme Access

```typescript
// Always use light variant
Text('Always Light').modifier.foregroundColor(Assets.primaryColor.light)

// Always use dark variant
Text('Always Dark').modifier.foregroundColor(Assets.primaryColor.dark)
```

### Image Assets

```typescript
import { ImageAsset } from '@tachui/core/assets'

// Register image assets
registerAsset('logo', ImageAsset.init('/logo-light.png', '/logo-dark.png', 'logo'))

// Use in components
import { Image } from '@tachui/core/components'

export function LogoComponent() {
  return Image(Assets.logo)  // Auto-adapts to current theme
    .modifier
    .frame(100, 50)
    .build()
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

// Create a custom color asset
const brandPrimary = ColorAsset.init('#FF6B35', '#FF8E6B', 'brandPrimary')

// Register it
registerAsset('brandPrimary', brandPrimary)

// Use it
Assets.brandPrimary  // Auto-adapts
Assets.brandPrimary.light  // Always light
Assets.brandPrimary.dark   // Always dark
```

### Image Assets

```typescript
import { ImageAsset } from '@tachui/core/assets'

// Create a custom image asset
const heroImage = ImageAsset.init('/hero-light.jpg', '/hero-dark.jpg', 'heroImage', {
  alt: 'Hero banner image',
  placeholder: '/placeholder.jpg'
})

// Register it
registerAsset('heroImage', heroImage)

// Use it
Assets.heroImage  // Auto-adapts
Assets.heroImage.lightSrc  // Always light source
Assets.heroImage.darkSrc   // Always dark source
```

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
// Create semantic color bundles
registerAsset('textPrimary', ColorAsset.init('#1a1a1a', '#ffffff', 'textPrimary'))
registerAsset('textSecondary', ColorAsset.init('#666666', '#cccccc', 'textSecondary'))

registerAsset('backgroundPrimary', ColorAsset.init('#FFFFFF', '#1a1a1a', 'backgroundPrimary'))
registerAsset('backgroundSecondary', ColorAsset.init('#f8f9fa', '#2a2a2a', 'backgroundSecondary'))
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

// Register custom asset
registerAsset('primaryGradient', new GradientAsset(
  'linear-gradient(to right, #007AFF, #5856D6)',
  'linear-gradient(to right, #0A84FF, #5E5CE6)',
  'primaryGradient'
))
```

## Benefits

1. **SwiftUI Familiarity**: Developers familiar with SwiftUI will feel at home
2. **Automatic Theme Adaptation**: Colors automatically switch between light/dark modes
3. **Semantic Naming**: Clear, purpose-driven asset names
4. **Global Access**: Centralized asset definitions that can be imported anywhere
5. **Type Safety**: Full TypeScript support with proper interfaces
6. **Performance**: Reactive updates only when theme changes
7. **Flexibility**: Developers can define custom palettes while using standard assets

## Implementation Details

The Assets system uses JavaScript Proxies to enable the clean dot notation API while providing automatic theme adaptation. Assets are resolved reactively based on the current theme, ensuring consistent appearance across your application.
