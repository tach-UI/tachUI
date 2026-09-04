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

### Theming and the DOM

tachUI's theme state is bridged to the DOM through a single attribute on
`<html>`:

```
data-theme="light" | "dark"   // absent means "follow prefers-color-scheme"
```

The name is exported as `THEME_ATTRIBUTE` if you would rather not hard-code it.

The bridge runs in both directions, so a stylesheet-driven design system and
tachUI's `Asset`s stay in step without being driven by hand:

```typescript
import { setTheme, getCurrentTheme, getThemePreference } from '@tachui/core'

setTheme('dark')    // writes data-theme="dark" — your CSS custom properties flip
setTheme('system')  // removes the attribute — prefers-color-scheme takes over
```

```css
/* Keys off the same attribute tachUI writes */
:root { --brand: #2A9D8F; }
@media (prefers-color-scheme: dark) { :root { --brand: #5FD0C1; } }
:root[data-theme="dark"] { --brand: #5FD0C1; }
:root[data-theme="light"] { --brand: #2A9D8F; }
```

Writing the attribute yourself works too — tachUI observes it, and already
rendered components re-resolve their `ColorAsset`s in place:

```typescript
document.documentElement.setAttribute('data-theme', 'dark')
// every ColorAsset on the page now resolves to its dark variant
```

#### Native controls

tachUI also writes the CSS `color-scheme` property on `<html>`, so scrollbars,
form controls and the canvas behind the page follow the theme instead of staying
light under a dark UI. `'system'` maps to `light dark`, the value that tells the
browser to follow the OS itself.

This is an **inline** style, and inline styles outrank author stylesheets, so
tachUI only writes it once you have actually used the theme system — a
`setTheme()` call, or a `data-theme` attribute on the page. Importing
`@tachui/core` on its own writes nothing and leaves your CSS alone.

If your own CSS declares `color-scheme` and you do use `setTheme()`, turn
tachUI's off so it stops overriding you — that also clears anything already
written, handing the property back:

```typescript
import { configureTheme } from '@tachui/core'

configureTheme({ reflectColorScheme: false })
```

#### Precedence

`getCurrentTheme()` resolves in this order, highest first:

1. An explicit `data-theme` on `<html>` — a decision made about *this document*,
   by a pre-paint script, your server, or `setTheme()` itself
2. The preference passed to `setTheme()`, when it names an appearance
3. `prefers-color-scheme`, when the preference is `'system'`

`getCurrentTheme()` gives you the resolved appearance (`'light'` or `'dark'`);
`getThemePreference()` gives you the preference as stated, which is what a
settings UI needs in order to show `system` as selected rather than whatever it
resolved to.

Tier 3 is live: in `'system'` mode, changing the OS appearance re-resolves
already-rendered components in place, the same way writing the attribute does.
No reload, and no `setTheme()` call of your own.

#### Avoiding a flash of the wrong theme

No JavaScript API can fix this on its own — the attribute has to be on `<html>`
*before first paint*, which means an inline, render-blocking script in `<head>`,
above your stylesheets:

```html
<!doctype html>
<html>
  <head>
    <script>
      // Inline and synchronous on purpose: deferring this to your bundle paints
      // the default theme first and then corrects it, which is the flash.
      try {
        var saved = localStorage.getItem('theme')
        if (saved === 'light' || saved === 'dark') {
          document.documentElement.setAttribute('data-theme', saved)
        }
      } catch (e) {}
    </script>
    <link rel="stylesheet" href="/app.css" />
  </head>
```

A `'system'` choice stores nothing (or clears the key), leaving the attribute
absent so the media query applies.

Then, once at boot:

```typescript
import { setTheme } from '@tachui/core'

// Guarded like the pre-paint script above: reading localStorage throws in
// blocked-cookie contexts, and an unhandled throw here breaks startup.
let saved = null
try {
  saved = localStorage.getItem('theme')
} catch (e) {}

// Only when no explicit choice was saved. An explicit one is already on <html>
// from the script above, and calling setTheme('system') would erase it.
if (saved !== 'light' && saved !== 'dark') {
  setTheme('system')
}
```

For an explicit saved choice, tachUI reads the attribute when it loads, so it is
honoured from the first `getCurrentTheme()` with no `setTheme()` call at all.

The `setTheme('system')` call is what the `'system'` case needs today: with no
attribute to read, tachUI falls back to its stated preference, which currently
defaults to `'light'`. Without the call your stylesheet would follow
`prefers-color-scheme` into dark while literal-valued `ColorAsset`s stayed
light — the half-themed state this bridge exists to prevent. It writes no
attribute, so the media query still drives the CSS side.

::: tip
Once [#309](https://github.com/tach-UI/tachUI/issues/309) lands, the preference
will default to `'system'` and this call becomes redundant. It stays harmless.
:::

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
- **RGB**: `rgb(255, 0, 0)`, `rgb(255 0 0)`, `rgb(255 0 0 / 50%)`
- **RGBA**: `rgba(255, 0, 0, 0.5)`
- **HSL**: `hsl(360, 100%, 50%)`, `hsl(200deg 50% 40%)`, `hsl(200deg 50% 40% / 0.5)`
- **HSLA**: `hsla(360, 100%, 50%, 0.8)`
- **CSS Color 4 spaces**: `oklch(70% 0.15 250)`, `oklab(0.7 0.1 -0.1)`, `lab(50% 40 30)`, `lch(50% 40 30)`, `hwb(200 30% 20%)`, `color(display-p3 1 0 0)`
- **Named colors**: `red`, `blue`, `transparent`, etc.
- **CSS custom properties**: `var(--primary-color)`
- **`color-mix()`**: `color-mix(in srgb, red 50%, transparent)`

The legacy comma forms are range-checked; the space-separated CSS Color 4 forms are validated against each function's grammar (three channels, optional `/ alpha`, angle units only in the hue slot) and otherwise left to the browser. The space-separated `rgb()` / `hsl()` forms (including `none`, percentage channels, angle units on the hue and `/ alpha`) transform exactly like their comma forms. Values the numeric transforms cannot convert to sRGB (`oklch()`, `color()`, `var()`, and so on) pass through `brighten`, `saturate`, `contrast` and `rotateHue` unchanged instead of throwing; `opacity()` composes with any of them via `color-mix()`.

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
color.opacity(0.4)   // string - rgba() / hsla() / hsl(... / a) / color-mix() output
color.saturate(0.25) // string - OKLCH chroma raised 25% of the way to the sRGB ceiling
color.brighten(0.25) // string - OKLab lightness raised 25% of the way to white
color.contrast(0.25) // string - OKLab coordinates scaled 1.25x about mid-gray
color.rotateHue(120) // string - OKLCH hue rotated, lightness and chroma preserved
color.toString() // string - current theme variant (implicit conversion)
```

The numeric transforms run in OKLab / OKLCH, so a nominal amount is the same perceptual step on every hue: `brighten(0.3)` raises lightness by the same amount whether the input is yellow or maroon, `rotateHue` keeps lightness constant around the whole wheel, and `saturate(-1)` yields the gray of the same lightness rather than a fixed `#808080`. A result that would leave the sRGB gamut has its chroma reduced at constant lightness and hue instead of having channels clipped, so hue never drifts on saturated inputs.

Color transform output format is normalized for predictability:
- opaque outputs return uppercase hex (for example, `#A7DDDE`)
- alpha-bearing outputs return `rgba(...)`
- `saturate(0)`, `brighten(0)`, `contrast(0)` and `rotateHue(360)` are exact identities
- `brighten(1)` and `brighten(-1)` reach white and black; `saturate(1)` reaches the most chromatic sRGB color at that lightness and hue
- `contrast(0)` is identity (unlike CSS `filter: contrast(1)`)
- `contrast(-1)` maps opaque colors to OKLab mid-gray, `#636363`

## Implementation Details

The Assets system uses JavaScript Proxies to enable the clean dot notation API while providing automatic theme adaptation. Assets are resolved reactively based on the current theme, ensuring consistent appearance across your application.

### Color Validation Process

When creating ColorAssets, the system validates both light and dark color values using comprehensive regex patterns and value range checking. Invalid colors throw descriptive errors immediately, preventing runtime issues.

### Asset Discovery Implementation

The discovery system provides both simple name listing and detailed asset information, making it easy to debug asset registration and understand what assets are available in your application.
