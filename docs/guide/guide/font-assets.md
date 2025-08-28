# Font Assets in TachUI

The FontAsset system provides comprehensive web font management with automatic loading, fallback support, and advanced features like variable fonts and Google Fonts integration.

## Overview

FontAsset is part of TachUI's Asset system, providing:
- Automatic font loading (lazy or eager)
- System font stacks with proper fallbacks
- Google Fonts integration
- Variable font support
- Performance optimizations (preconnect, font-display)
- TypeScript type safety

## Basic Usage

### Creating Font Assets

```typescript
import { FontAsset, registerAsset } from '@tachui/core'

// Create a custom font asset
const myFont = FontAsset.init(
  'Inter',                          // Font family name
  ['Helvetica', 'Arial', 'sans-serif'],  // Fallback fonts
  'myCustomFont',                   // Asset name
  {
    fontUrl: '/fonts/inter.woff2',  // Font file URL
    loading: 'lazy',                // Loading strategy
    fontDisplay: 'swap'             // CSS font-display value
  }
)

// Register the font asset
registerAsset('myCustomFont', myFont)

// Use in components
Text("Hello World")
  .modifier
  .font({ family: Assets.myCustomFont })
  .build()
```

### Using System Fonts

```typescript
import { createSystemFont, registerAsset } from '@tachui/core'

// Create system font stacks
const systemSans = createSystemFont('sansSerif', 'systemSans')
const systemMono = createSystemFont('monospace', 'systemMono')
const systemSerif = createSystemFont('serif', 'systemSerif')

// Register them
registerAsset('systemSans', systemSans)
registerAsset('systemMono', systemMono)
registerAsset('systemSerif', systemSerif)

// Use in components
Text("Sans-serif text")
  .modifier
  .font({ family: Assets.systemSans })
  .build()
```

## Google Fonts Integration

TachUI provides built-in Google Fonts support:

```typescript
import { createGoogleFont, registerAsset } from '@tachui/core'

// Load Inter with multiple weights
const inter = createGoogleFont(
  'Inter',              // Font family
  [300, 400, 600, 700], // Weights to load
  'inter'               // Asset name
)

// Load a single weight
const roboto = createGoogleFont('Roboto', [400], 'roboto')

// Load with custom options
const poppins = createGoogleFont(
  'Poppins',
  [400, 500, 600],
  'poppins',
  {
    loading: 'eager',      // Load immediately
    fontDisplay: 'block'   // Block rendering until loaded
  }
)

// Register and use
registerAsset('inter', inter)
registerAsset('roboto', roboto)
registerAsset('poppins', poppins)

// Use in components
TextStyles.Title("Beautiful Typography")
  .modifier
  .font({ 
    family: Assets.inter,
    weight: '600'
  })
  .build()
```

## Variable Fonts

Support for modern variable fonts with custom axes:

```typescript
import { createVariableFont, registerAsset } from '@tachui/core'

// Create a variable font with standard axes
const variableFont = createVariableFont(
  'Inter Variable',
  '/fonts/inter-variable.woff2',
  {
    weight: [100, 900],    // Weight range
    width: [75, 125],      // Width range  
    slant: [-10, 0]        // Slant range (for italics)
  }
)

// Variable font with custom axes
const customVariable = createVariableFont(
  'Recursive',
  '/fonts/recursive.woff2',
  {
    weight: [300, 1000],
    custom: {
      'MONO': [0, 1],      // Monospace axis
      'CASL': [0, 1],      // Casual axis
      'CRSV': [0, 1]       // Cursive axis
    }
  }
)

registerAsset('variableFont', variableFont)
registerAsset('recursive', customVariable)
```

## Font Loading Strategies

### Lazy Loading (Default)

Fonts load when first used:

```typescript
const lazyFont = FontAsset.init('MyFont', [], 'lazyFont', {
  fontUrl: '/fonts/myfont.woff2',
  loading: 'lazy'  // Default
})
```

### Eager Loading

Fonts load immediately on registration:

```typescript
const eagerFont = FontAsset.init('CriticalFont', [], 'eagerFont', {
  fontUrl: '/fonts/critical.woff2', 
  loading: 'eager'
})
```

### Manual Loading

Control when fonts load:

```typescript
const manualFont = FontAsset.init('OnDemandFont', [], 'onDemand', {
  fontUrl: '/fonts/ondemand.woff2',
  loading: 'lazy'
})

// Load manually when needed
await Assets.onDemand.load()
```

## Performance Optimization

### Font Display Options

Control text rendering while fonts load:

```typescript
// Swap: Show fallback immediately, swap when loaded
const swapFont = FontAsset.init('SwapFont', [], 'swap', {
  fontUrl: '/fonts/swap.woff2',
  fontDisplay: 'swap'  // Recommended for body text
})

// Block: Hide text until font loads (max 3s)
const blockFont = FontAsset.init('BlockFont', [], 'block', {
  fontUrl: '/fonts/block.woff2',
  fontDisplay: 'block'  // Use for short, important text
})

// Fallback: Brief block period, then fallback
const fallbackFont = FontAsset.init('FallbackFont', [], 'fallback', {
  fontUrl: '/fonts/fallback.woff2',
  fontDisplay: 'fallback'  // Good balance
})

// Optional: Use font if available immediately
const optionalFont = FontAsset.init('OptionalFont', [], 'optional', {
  fontUrl: '/fonts/optional.woff2',
  fontDisplay: 'optional'  // Best performance, may not load
})
```

### Preconnect

Optimize loading from external hosts:

```typescript
const googleFont = createGoogleFont('Roboto', [400], 'roboto', {
  preconnect: true  // Adds preconnect link for fonts.googleapis.com
})
```

## Font Fallbacks

Proper fallback chains ensure text is always readable:

```typescript
// Comprehensive fallback chain
const safeFont = FontAsset.init(
  'Custom Font',
  [
    'Helvetica Neue',    // macOS
    'Helvetica',         // Older macOS
    'Arial',             // Windows
    'Roboto',            // Android
    'sans-serif'         // Generic fallback
  ],
  'safeFont',
  { fontUrl: '/fonts/custom.woff2' }
)

// System font stacks
const systemStack = createSystemFont('sansSerif')
// Includes: system-ui, -apple-system, BlinkMacSystemFont, 
// Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
```

## Font Formats

Support for various font formats:

```typescript
// Modern WOFF2 (recommended)
const woff2Font = FontAsset.init('ModernFont', [], 'modern', {
  fontUrl: '/fonts/modern.woff2',
  fontFormat: 'woff2'
})

// WOFF for broader support
const woffFont = FontAsset.init('WoffFont', [], 'woff', {
  fontUrl: '/fonts/compatible.woff',
  fontFormat: 'woff'
})

// TrueType
const ttfFont = FontAsset.init('TrueTypeFont', [], 'ttf', {
  fontUrl: '/fonts/truetype.ttf',
  fontFormat: 'truetype'
})
```

## Complete Example

Here's a comprehensive font setup for a typical application:

```typescript
import { 
  FontAsset, 
  createSystemFont, 
  createGoogleFont,
  createVariableFont,
  registerAsset,
  Assets 
} from '@tachui/core'

// System fonts for fallbacks
const systemSans = createSystemFont('sansSerif', 'systemSans')
const systemMono = createSystemFont('monospace', 'systemMono')

// Brand font from Google Fonts
const brandFont = createGoogleFont(
  'Inter',
  [300, 400, 500, 600, 700],
  'brandFont'
)

// Display font for headings
const displayFont = createGoogleFont(
  'Playfair Display',
  [400, 700],
  'displayFont'
)

// Code font
const codeFont = createGoogleFont(
  'JetBrains Mono',
  [400, 500],
  'codeFont'
)

// Custom local font
const customFont = FontAsset.init(
  'MyCustomFont',
  [...systemSans.fallbacks],
  'customFont',
  {
    fontUrl: '/fonts/custom-font.woff2',
    loading: 'lazy',
    fontDisplay: 'swap'
  }
)

// Register all fonts
registerAsset('systemSans', systemSans)
registerAsset('systemMono', systemMono)
registerAsset('brandFont', brandFont)
registerAsset('displayFont', displayFont)
registerAsset('codeFont', codeFont)
registerAsset('customFont', customFont)

// Usage in components
export const AppTypography = {
  // Headings use display font
  PageTitle: (text: string) =>
    TextStyles.LargeTitle(text)
      .modifier
      .font({ 
        family: Assets.displayFont,
        weight: '700'
      })
      .build(),
  
  // Body text uses brand font
  BodyText: (text: string) =>
    TextStyles.Body(text)
      .modifier
      .font({
        family: Assets.brandFont,
        weight: '400'
      })
      .lineHeight(1.6)
      .build(),
  
  // Code uses monospace
  CodeBlock: (code: string) =>
    TextFormat.monospace(code)
      .modifier
      .font({
        family: Assets.codeFont,
        size: 14
      })
      .backgroundColor('#1e1e1e')
      .foregroundColor('#d4d4d4')
      .padding(16)
      .cornerRadius(8)
      .build()
}
```

## API Reference

### FontAsset Class

```typescript
class FontAsset extends Asset {
  // Properties
  readonly family: string
  readonly fallbacks: string[]
  readonly options: FontAssetOptions
  
  // Factory method
  static init(
    family: string,
    fallbacks?: string[],
    name?: string,
    options?: FontAssetOptions
  ): FontAsset
  
  // Methods
  load(): Promise<void>
  get value(): string  // Full font-family CSS value
  resolve(): string    // Alias for value
}
```

### FontAssetOptions

```typescript
interface FontAssetOptions {
  fontUrl?: string
  fontFormat?: 'woff2' | 'woff' | 'truetype' | 'opentype' | 'embedded-opentype'
  loading?: 'eager' | 'lazy'
  weightRange?: [number, number]  // For variable fonts
  widthRange?: [number, number]   // For variable fonts
  variableAxes?: Record<string, [number, number]>
  fontDisplay?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  preconnect?: boolean
}
```

### Factory Functions

```typescript
// System font stacks
createSystemFont(
  type: 'sansSerif' | 'serif' | 'monospace' | 'cursive' | 'fantasy',
  name?: string
): FontAsset

// Google Fonts
createGoogleFont(
  family: string,
  weights?: number[],
  name?: string,
  options?: Omit<FontAssetOptions, 'fontUrl'>
): FontAsset

// Variable fonts
createVariableFont(
  family: string,
  fontUrl: string,
  axes: {
    weight?: [number, number]
    width?: [number, number]
    slant?: [number, number]
    optical?: [number, number]
    custom?: Record<string, [number, number]>
  },
  fallbacks?: string[],
  name?: string
): FontAsset
```

## Best Practices

1. **Always Provide Fallbacks**: Ensure text is readable even if custom fonts fail to load
2. **Use System Fonts for Performance**: System fonts require no loading and render instantly
3. **Limit Font Weights**: Only load the weights you actually use
4. **Prefer WOFF2**: Modern, compressed format with excellent browser support
5. **Use font-display: swap**: Best balance of performance and user experience
6. **Preload Critical Fonts**: Use eager loading for above-the-fold text
7. **Group Related Fonts**: Register fonts that are used together

## Troubleshooting

### Font Not Loading
- Check the font URL is correct and accessible
- Verify CORS headers if loading from external domain
- Check browser console for loading errors
- Ensure font format is supported by target browsers

### Flash of Unstyled Text (FOUT)
- Use `fontDisplay: 'block'` for critical short text
- Consider using `fontDisplay: 'optional'` for better performance
- Preload critical fonts with `loading: 'eager'`

### Performance Issues
- Reduce number of font weights loaded
- Use system fonts where possible
- Enable preconnect for external font hosts
- Consider subsetting fonts to reduce file size

### TypeScript Errors
- Ensure fonts are registered before use
- Import Assets from '@tachui/core'
- Check font asset names match registration