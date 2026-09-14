# @tachui/symbols

> SwiftUI-inspired symbol and icon system for tachUI framework

[![npm version](https://img.shields.io/npm/v/@tachui/symbols.svg)](https://www.npmjs.com/package/@tachui/symbols)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

The tachUI symbols package provides a comprehensive icon system with 1000+ symbols from Lucide, SF Symbols compatibility, and SwiftUI-style rendering with full customization support.

## Features

- 🎯 **1000+ Icons** - Complete Lucide icon library with SF Symbols mapping
- 🎨 **SwiftUI-style API** - Familiar Symbol() component and modifiers
- 🔧 **Full Customization** - Size, color, weight, and style variants
- ⚡ **Performance-optimized** - Tree-shakable with selective imports
- 🎪 **Multiple Styles** - Filled, outlined, duotone, and custom variants
- 🔧 **TypeScript-first** - Complete type safety with autocomplete

## Installation

```bash
npm install @tachui/core @tachui/symbols
# or
pnpm add @tachui/core @tachui/symbols
```

### Using Modifiers

To use modifiers with Symbol components, you also need to install and import the modifiers package:

```bash
npm install @tachui/modifiers
# or
pnpm add @tachui/modifiers
```

Then import it in your application:

```typescript
import '@tachui/modifiers' // Registers all modifiers
import { Symbol } from '@tachui/symbols'

// Now you can use modifiers
Symbol('heart').padding(16).foregroundColor('#ff0000')
```

## Quick Start

### Basic Usage

```typescript
import '@tachui/modifiers' // Required for modifier support
import { HStack, Text, VStack } from '@tachui/primitives'
import { Symbol } from '@tachui/symbols'

const iconDemo = VStack({
  children: [
    HStack({
      children: [
        Symbol('heart.fill').foregroundColor('red').size(24),

        Text('Favorite').fontSize(16),
      ],
      spacing: 8,
      alignment: 'center',
    }),

    Symbol('star.circle')
      .size(48)
      .foregroundColor('#FFD700')
      .symbolRenderingMode('palette')
      ,
  ],
  spacing: 16,
})
```

### Icon Variants

```typescript
import { Symbol } from '@tachui/symbols'

// Different symbol styles
const iconStyles = VStack({
  children: [
    // Outlined (default)
    Symbol('heart').size(32),

    // Filled
    Symbol('heart.fill').size(32).foregroundColor('#ff4757'),

    // Circle variants
    Symbol('heart.circle').size(32),

    Symbol('heart.circle.fill')
      .size(32)
      .foregroundColor('#3742fa')
      ,
  ],
  spacing: 12,
})
```

## Symbol System

### SF Symbols Compatibility

tachUI symbols provides SF Symbols naming compatibility:

```typescript
// SF Symbols style names
Symbol('person.fill')
Symbol('house.fill')
Symbol('star.circle')
Symbol('heart.slash')
Symbol('arrow.up.circle.fill')
Symbol('magnifyingglass')
Symbol('gearshape.fill')
```

## Symbol Modifiers

### Size and Scaling

```typescript
Symbol('star.fill')
  .size(24) // Fixed size
  .symbolScale('small') // 'small' | 'medium' | 'large'
  .symbolWeight('regular') // 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  
```

### Color and Rendering

```typescript
Symbol('heart.fill')
  .foregroundColor('#ff4757')
  .symbolRenderingMode('monochrome') // 'monochrome' | 'multicolor' | 'hierarchical' | 'palette'
  

// Multi-color symbols
Symbol('flag.fill')
  .symbolRenderingMode('palette')
  .primaryColor('#ff4757')
  .secondaryColor('#3742fa')
  .tertiaryColor('#2ed573')
  
```

### Animation

```typescript
Symbol('heart')
  .size(32)
  .symbolEffect('bounce') // 'bounce' | 'pulse' | 'variable' | 'scale'
  .symbolEffectOptions({
    repeating: true,
    speed: 'normal',
  })
  
```

## Icon Categories

### System Icons

```typescript
// System and UI
Symbol('gear.fill') // Settings
Symbol('person.circle') // User profile
Symbol('bell.fill') // Notifications
Symbol('magnifyingglass') // Search
Symbol('plus.circle.fill') // Add/Create

// Navigation
Symbol('house.fill') // Home
Symbol('arrow.left') // Back
Symbol('arrow.right') // Forward
Symbol('chevron.up') // Collapse
Symbol('chevron.down') // Expand
```

### Communication

```typescript
// Messaging
Symbol('message.circle.fill')
Symbol('phone.fill')
Symbol('video.fill')
Symbol('mail.fill')
Symbol('paperplane.fill')

// Social
Symbol('heart.fill')
Symbol('star.fill')
Symbol('share.fill')
Symbol('bookmark.fill')
```

### Media & Files

```typescript
// Media controls
Symbol('play.fill')
Symbol('pause.fill')
Symbol('stop.fill')
Symbol('forward.fill')
Symbol('backward.fill')

// File types
Symbol('doc.fill')
Symbol('folder.fill')
Symbol('photo.fill')
Symbol('music.note')
Symbol('video.circle.fill')
```

## Advanced Features

### Accessibility

Built-in accessibility features:

```typescript
Symbol('heart.fill')
  .accessibilityLabel('Add to favorites')
  .accessibilityHint('Double tap to add this item to your favorites')
  .accessibilityRole('button')
  
```

## Not implemented yet

These were documented here before they existed, and the examples did not run.
They are listed so the gap is visible rather than discovered at the import:

- `LucideIcon(name)` — use `Symbol(name)`, which resolves Lucide names already.
- `createSymbolSet` / `registerSymbolSet` — the registry is `IconSetRegistry`,
  and custom sets are built with `createIconSetFromJSON` or
  `createIconSetFromSprite`.
- `createDynamicSymbol` — no equivalent.
- `SymbolCollection` — `generateSymbolCollection` exists and is not the same
  shape.
- `getAvailableSymbols` / `searchSymbols` — see `getAllSupportedSFSymbols`,
  `getSymbolsByCategory`, `searchSymbolsByCategory` and `getRecommendedSymbols`.
- `SymbolGrid` — no equivalent.

## Styling and Theming

Symbols inherit tachUI's modifier system:

```typescript
Symbol('star.fill')
  .size(24)
  .foregroundColor('#FFD700')
  .padding(8)
  .backgroundColor('#f8f9fa')
  .cornerRadius(6)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
  .onTap(() => console.log('Star tapped!'))
  
```

## Performance

- **Tree-shakable** - Only bundle icons you actually use
- **Optimized SVG** - Minified and compressed icon data
- **Lazy loading** - Icons loaded on-demand
- **Caching** - Automatic icon caching and reuse

## Examples

Check out complete examples:

- **[Icon Gallery](https://github.com/tach-UI/tachUI/tree/main/apps/examples/symbols/gallery)**
- **[Toolbar Icons](https://github.com/tach-UI/tachUI/tree/main/apps/examples/symbols/toolbar)**
- **[Animated Symbols](https://github.com/tach-UI/tachUI/tree/main/apps/examples/symbols/animations)**

## API Reference

- **[Symbol API](https://github.com/tach-UI/tachUI/blob/main/docs/api/symbols/src/functions/Symbol.md)**
- **[Symbol Modifiers](https://github.com/tach-UI/tachUI/blob/main/docs/api/symbols/src/classes/SymbolModifier.md)**
- **[Icon Sets API](https://github.com/tach-UI/tachUI/blob/main/docs/api/symbols/src/functions/createSymbolSet.md)**

## Requirements

- **@tachui/core** ^0.8.8-alpha or later
- **TypeScript** 5.0+ (recommended)

## Contributing

See the main [Contributing Guide](https://github.com/tach-UI/tachUI/blob/main/CONTRIBUTING.md) for information on contributing to tachUI symbols.

## License

Mozilla Public License 2.0 - see [LICENSE](https://github.com/tach-UI/tachUI/blob/main/LICENSE) for details.
