# TachUI Layout Constants

This module provides SwiftUI-style layout constants and utilities for responsive web layouts.

## Overview

TachUI now supports SwiftUI's `.infinity` constant for frame modifiers, enabling familiar responsive layout patterns for developers coming from SwiftUI.

## Core Constants

### `infinity`

A special constant representing unlimited space availability, equivalent to SwiftUI's `.infinity`.

```typescript
import { infinity } from '@tachui/core'

// Fill available width
Text("Full Width")
  .modifier
  .frame({ maxWidth: infinity })
  .build()

// Fill both dimensions  
Image("banner.jpg")
  .modifier
  .frame({ width: infinity, height: 200 })
  .build()
```

### Type Safety

All size-related modifiers now accept the `Dimension` type, which includes:
- `number` - Pixel values (e.g., `200`)
- `string` - CSS values (e.g., `'100%'`, `'50vh'`)
- `infinity` - Unlimited space

## Utility Functions

### Basic Frame Utilities

```typescript
import { 
  fillMaxWidth, 
  fillMaxHeight, 
  fillMaxSize, 
  expand 
} from '@tachui/core'

// Fill maximum width (maxWidth: infinity)
Button("Continue")
  .modifier
  .apply(fillMaxWidth())
  .build()

// Fill maximum height (maxHeight: infinity)
ScrollView(content)
  .modifier
  .apply(fillMaxHeight())
  .build()

// Fill both max dimensions
Container()
  .modifier
  .apply(fillMaxSize())
  .build()

// Expand to fill space (width: infinity, height: infinity)
MainContent()
  .modifier
  .apply(expand())
  .build()
```

### Layout Pattern Utilities

```typescript
import { 
  fixedWidthExpandHeight,
  fixedHeightExpandWidth,
  responsive,
  flexible
} from '@tachui/core'

// Sidebar: fixed width, full height
Sidebar()
  .modifier
  .apply(fixedWidthExpandHeight(250))
  .build()

// Header: full width, fixed height  
Header()
  .modifier
  .apply(fixedHeightExpandWidth(60))
  .build()

// Responsive card with constraints
Card()
  .modifier
  .apply(responsive(320, 800, 200, 600))
  .build()

// Flexible content that adapts
Content()
  .modifier
  .apply(flexible())
  .build()
```

### SUI Compatibility (SUI = SwiftUI-inspired)

```typescript
import { SUI, LayoutPatterns } from '@tachui/core'

// Direct SUI-style usage
Text("Hello")
  .modifier
  .frame({ maxWidth: SUI.infinity })
  .build()

// Layout patterns
Button("Action")
  .modifier
  .apply(LayoutPatterns.fullWidthButton())
  .build()

Sidebar()
  .modifier
  .apply(LayoutPatterns.sidebar(300))
  .build()
```

## Migration from Workarounds

### Before (Manual Workarounds)

```typescript
// Old way - manual percentage and flexbox
Text("Content")
  .modifier
  .width('100%')
  .flexGrow(1)
  .build()

HStack([
  Text("Left"),
  Spacer(), // To push content
  Text("Right")
])
```

### After (Infinity Support)

```typescript
// New way - SwiftUI-style infinity
Text("Content")
  .modifier
  .frame({ maxWidth: infinity })
  .build()

Text("Centered")
  .modifier
  .frame({ maxWidth: infinity })
  .textAlign('center')
  .build()
```

## Common Patterns

### Full-Width Buttons

```typescript
VStack([
  Button("Primary Action")
    .modifier
    .frame({ maxWidth: infinity })
    .backgroundColor('#007AFF')
    .build(),
    
  Button("Secondary Action")
    .modifier
    .frame({ maxWidth: infinity })
    .backgroundColor('#F2F2F2')
    .build()
])
```

### Equal-Width Elements

```typescript
HStack([
  Button("Cancel")
    .modifier
    .frame({ maxWidth: infinity })
    .build(),
    
  Button("OK")
    .modifier
    .frame({ maxWidth: infinity })
    .build()
])
```

### Responsive Content Areas

```typescript
VStack([
  Header()
    .modifier
    .apply(fixedHeightExpandWidth(60))
    .build(),
    
  HStack([
    Sidebar()
      .modifier
      .apply(fixedWidthExpandHeight(250))
      .build(),
      
    MainContent()
      .modifier
      .apply(expand())
      .build()
  ]),
  
  Footer()
    .modifier
    .apply(fixedHeightExpandWidth(40))
    .build()
])
```

### Modal Overlays

```typescript
ZStack([
  // Background content
  MainApp(),
  
  // Modal overlay
  Show({
    when: showModal,
    children: Modal()
      .modifier
      .apply(fullScreen())
      .backgroundColor('rgba(0,0,0,0.5)')
      .build()
  })
])
```

## CSS Output

The infinity constant generates efficient CSS:

```typescript
// Input
.frame({ maxWidth: infinity })

// Generated CSS
.element {
  max-width: 100%;
  flex-grow: 1;
}

// Input  
.frame({ width: infinity, height: infinity })

// Generated CSS
.element {
  width: 100%;
  height: 100%;
  flex-grow: 1;
}
```

## Performance

- **Bundle Size**: ~200 bytes for infinity support
- **Runtime Overhead**: Minimal symbol comparison
- **CSS Generation**: Optimized output with proper flex properties
- **Tree Shaking**: Unused utilities are eliminated

## Browser Support

Infinity support works across all modern browsers:
- Chrome 29+
- Firefox 28+ 
- Safari 9+
- Edge 12+

## Advanced Usage

### Conditional Infinity

```typescript
const isMobile = createSignal(false)

Text("Responsive")
  .modifier
  .frame({ 
    maxWidth: () => isMobile() ? infinity : 800
  })
  .build()
```

### Computed Dimensions

```typescript
const containerWidth = createSignal(400)

Content()
  .modifier
  .frame({
    width: infinity,
    maxWidth: () => containerWidth() * 0.8
  })
  .build()
```

### Animation Support

```typescript
Text("Animated")
  .modifier
  .frame({ maxWidth: infinity })
  .transition({ property: 'all', duration: 300 })
  .build()
```

## Debugging

Enable debug mode to see SUI equivalencies:

```typescript
import { logSuiEquivalent } from '@tachui/core'

logSuiEquivalent('frame(maxWidth: .infinity)')
// Logs: SUI Pattern: frame(maxWidth: .infinity) → TachUI: fillMaxWidth()
```