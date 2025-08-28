# SwiftUI Compatibility Layer

The TachUI Symbols package includes a comprehensive SwiftUI compatibility layer that allows iOS and macOS developers to use familiar SF Symbol syntax while leveraging the robust Lucide icon library.

## Overview

This compatibility layer provides:

1. **`Image(systemName:)` API** - Familiar SwiftUI syntax for creating symbols
2. **SF Symbol to Lucide Mapping** - Automatic conversion of 100+ SF Symbol names
3. **Reactive Support** - Full compatibility with TachUI's reactive system
4. **Migration Utilities** - Tools to help convert existing code

## Basic Usage

### SwiftUI-Style Image Component

```typescript
import { Image } from '@tachui/symbols'

// Basic usage - exactly like SwiftUI
const heartIcon = Image({ systemName: "heart" })

// With styling - familiar modifier pattern
const styledIcon = Image({ systemName: "star.fill" })
  .modifier
  .foregroundColor('#ff0000')
  .frame(24, 24)
  .build()

// Reactive system name
const [iconName, setIconName] = createSignal("heart")
const reactiveIcon = Image({ systemName: iconName })
```

### Supported SF Symbol Properties

```typescript
const configuredIcon = Image({
  systemName: "heart.circle.fill",
  variant: "filled",           // Symbol variant override
  scale: "large",              // Symbol scale
  weight: "bold",              // Symbol weight
  accessibilityLabel: "Favorite", // Custom accessibility label
  isDecorative: false          // Accessibility setting
})
```

## SF Symbol Mapping

### Automatic Name Conversion

The system automatically maps SF Symbol names to Lucide equivalents:

```typescript
// SF Symbol -> Lucide mappings
Image({ systemName: "heart" })        // -> heart
Image({ systemName: "star.fill" })    // -> star (with filled variant)
Image({ systemName: "xmark" })        // -> x
Image({ systemName: "checkmark" })    // -> check
Image({ systemName: "gear" })         // -> settings
Image({ systemName: "house" })        // -> home
Image({ systemName: "person" })       // -> user
```

### Match Quality Indicators

Mappings include quality indicators:

- **exact**: Perfect 1:1 mapping
- **close**: Very similar appearance and meaning
- **approximate**: Best available alternative

```typescript
import { getSystemNameInfo } from '@tachui/symbols'

const info = getSystemNameInfo("gear")
console.log(info?.matchQuality) // "close"
console.log(info?.lucideIcon)   // "settings"
```

## Reactive Integration

### Dynamic Symbol Names

```typescript
const [isBookmarked, setIsBookmarked] = createSignal(false)

// Reactive SF Symbol name
const bookmarkIcon = Image({ 
  systemName: () => isBookmarked() ? "bookmark.fill" : "bookmark"
})

// With reactive styling
const favoriteButton = Image({ 
  systemName: () => isBookmarked() ? "heart.fill" : "heart"
})
  .modifier
  .foregroundColor(() => isBookmarked() ? '#ff0000' : '#666666')
  .scaleEffect(() => isBookmarked() ? 1.2 : 1.0)
  .build()
```

### State-Driven Appearance

```typescript
const [state, setState] = createSignal<'default' | 'active' | 'disabled'>('default')

// Computed symbol based on state
const systemName = createComputed(() => {
  switch (state()) {
    case 'active': return 'checkmark.circle.fill'
    case 'disabled': return 'circle'
    default: return 'circle'
  }
})

const statusIcon = Image({ systemName })
  .modifier
  .foregroundColor(() => {
    switch (state()) {
      case 'active': return '#00ff00'
      case 'disabled': return '#cccccc'
      default: return '#007aff'
    }
  })
  .build()
```

## Migration and Utility Functions

### Check Symbol Support

```typescript
import { isSystemNameSupported } from '@tachui/symbols'

// Check if SF Symbol is supported
if (isSystemNameSupported("heart.fill")) {
  const icon = Image({ systemName: "heart.fill" })
} else {
  // Use fallback
  const icon = Image({ systemName: "heart" })
}
```

### Get Mapping Information

```typescript
import { getSystemNameInfo } from '@tachui/symbols'

const mappingInfo = getSystemNameInfo("heart.fill")
if (mappingInfo) {
  console.log(`Maps to: ${mappingInfo.lucideIcon}`)
  console.log(`Quality: ${mappingInfo.matchQuality}`)
  console.log(`Notes: ${mappingInfo.notes || 'None'}`)
}
```

### Batch Conversion

```typescript
import { batchConvertSystemNames } from '@tachui/symbols'

const sfSymbols = [
  "heart.fill",
  "star.circle", 
  "gear.badge",
  "unknown.symbol"
]

const results = batchConvertSystemNames(sfSymbols)

results.forEach(result => {
  if (result.success) {
    console.log(`✅ ${result.sfSymbol} -> ${result.lucideIcon} (${result.matchQuality})`)
  } else {
    console.log(`❌ ${result.sfSymbol} - No mapping found`)
  }
})
```

### Reverse Lookup

```typescript
import { getSFSymbolsForLucide } from '@tachui/symbols'

// Find SF Symbols that map to a Lucide icon
const sfNames = getSFSymbolsForLucide("heart")
console.log(sfNames) // ["heart", "heart.fill"]

// Useful for migration from existing Lucide usage
const existingLucideIcons = ["home", "user", "settings"]
existingLucideIcons.forEach(lucideIcon => {
  const alternatives = getSFSymbolsForLucide(lucideIcon)
  if (alternatives.length > 0) {
    console.log(`${lucideIcon} can use: ${alternatives.join(', ')}`)
  }
})
```

## Advanced Usage Patterns

### Component Library Integration

```typescript
// Create reusable icon components with SF Symbol names
const SystemIconButton = ({ 
  systemName, 
  onTap, 
  ...props 
}: {
  systemName: string
  onTap: () => void
  variant?: 'filled' | 'none'
  scale?: 'small' | 'medium' | 'large'
}) => {
  return Button("", onTap)
    .modifier
    .padding(12)
    .prepend(
      Image({ systemName, ...props })
        .modifier
        .frame(20, 20)
        .build()
    )
    .build()
}

// Usage
const saveButton = SystemIconButton({
  systemName: "square.and.arrow.down",
  onTap: () => saveDocument()
})
```

### Theme Integration

```typescript
// Define SF Symbol theme mappings
const iconTheme = {
  primary: {
    favorite: "heart.fill",
    unfavorite: "heart",
    save: "square.and.arrow.down",
    delete: "trash.fill"
  },
  navigation: {
    home: "house.fill",
    search: "magnifyingglass",
    profile: "person.circle.fill",
    settings: "gear"
  }
}

// Create themed icons
const ThemedIcon = ({ 
  category, 
  name 
}: { 
  category: keyof typeof iconTheme
  name: string 
}) => {
  const systemName = iconTheme[category][name]
  return Image({ systemName })
}

// Usage
const favoriteIcon = ThemedIcon({ category: 'primary', name: 'favorite' })
```

### Animation Integration

```typescript
// Animated SF Symbols with state changes
const AnimatedBookmark = () => {
  const [isBookmarked, setIsBookmarked] = createSignal(false)
  const [animationTrigger, setAnimationTrigger] = createSignal(0)
  
  return Image({ 
    systemName: () => isBookmarked() ? "bookmark.fill" : "bookmark",
    effect: "bounce",
    effectValue: animationTrigger
  })
    .modifier
    .foregroundColor(() => isBookmarked() ? '#ffd700' : '#666666')
    .onTap(() => {
      setIsBookmarked(!isBookmarked())
      setAnimationTrigger(animationTrigger() + 1)
    })
    .build()
}
```

## Migration Guide

### From Direct Lucide Usage

**Before:**
```typescript
import { Symbol } from '@tachui/symbols'

const icon = Symbol('heart')
  .modifier
  .foregroundColor('#ff0000')
  .build()
```

**After:**
```typescript
import { Image } from '@tachui/symbols'

const icon = Image({ systemName: 'heart' })
  .modifier
  .foregroundColor('#ff0000')
  .build()
```

### From iOS/macOS SwiftUI

**SwiftUI:**
```swift
Image(systemName: "heart.fill")
    .foregroundColor(.red)
    .font(.title)
```

**TachUI:**
```typescript
Image({ systemName: "heart.fill" })
  .modifier
  .foregroundColor('#ff0000')
  .frame(24, 24)
  .build()
```

## Error Handling

### Fallback Strategies

```typescript
// With fallback icon
const createSafeIcon = (systemName: string, fallback: string = 'questionmark.circle') => {
  if (isSystemNameSupported(systemName)) {
    return Image({ systemName })
  }
  
  console.warn(`SF Symbol "${systemName}" not supported, using fallback: ${fallback}`)
  return Image({ systemName: fallback })
}

// Usage
const icon = createSafeIcon('some.new.ios17.symbol', 'circle')
```

### Graceful Degradation

```typescript
// Progressive enhancement approach
const EnhancedIcon = ({ systemName, lucideFallback }: {
  systemName: string
  lucideFallback: string
}) => {
  if (isSystemNameSupported(systemName)) {
    return Image({ systemName })
  }
  
  // Fall back to direct Lucide usage
  return Symbol(lucideFallback)
}
```

## Performance Considerations

### Lazy Loading

```typescript
// Icons are automatically lazy-loaded
const icons = [
  "heart.fill",
  "star.circle",
  "bookmark.fill"
].map(systemName => Image({ systemName }))

// Only loaded icons are included in bundle
```

### Preloading Critical Icons

```typescript
import { preloadIcons } from '@tachui/symbols'

// Preload commonly used SF Symbols
await preloadIcons([
  "heart",
  "heart.fill", 
  "star",
  "star.fill",
  "house",
  "person.circle.fill"
])
```

## Browser Support

The SwiftUI compatibility layer works in all modern browsers and includes:

- **SSR Support**: Icons render correctly during server-side rendering
- **Tree Shaking**: Only used icons are included in bundles
- **Accessibility**: Full WCAG 2.1 AA compliance
- **Performance**: Optimized SVG rendering with caching

## TypeScript Support

Full TypeScript support with:

- **Type Safety**: SF Symbol names are validated
- **IntelliSense**: Autocomplete for supported symbol names
- **Generic Types**: Reactive signal type preservation
- **Error Checking**: Compile-time validation of props

```typescript
// Type-safe SF Symbol usage
const validIcon = Image({ systemName: "heart" }) // ✅ Valid
const invalidIcon = Image({ systemName: "invalid" }) // ❌ Type error (if strict mode enabled)

// Reactive type preservation
const [name, setName] = createSignal("heart")
const icon = Image({ systemName: name }) // Types preserved correctly
```