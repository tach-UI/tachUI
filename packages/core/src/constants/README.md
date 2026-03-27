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
  

// Fill both dimensions  
Image("banner.jpg")
  .modifier
  .frame({ width: infinity, height: 200 })
  
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
  

// Fill maximum height (maxHeight: infinity)
ScrollView(content)
  .modifier
  .apply(fillMaxHeight())
  

// Fill both max dimensions
Container()
  .modifier
  .apply(fillMaxSize())
  

// Expand to fill space (width: infinity, height: infinity)
MainContent()
  .modifier
  .apply(expand())
  
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
  

// Header: full width, fixed height  
Header()
  .modifier
  .apply(fixedHeightExpandWidth(60))
  

// Responsive card with constraints
Card()
  .modifier
  .apply(responsive(320, 800, 200, 600))
  

// Flexible content that adapts
Content()
  .modifier
  .apply(flexible())
  
```

### SUI Compatibility (SUI = SwiftUI-inspired)

```typescript
import { SUI, LayoutPatterns } from '@tachui/core'

// Direct SUI-style usage
Text("Hello")
  .modifier
  .frame({ maxWidth: SUI.infinity })
  

// Layout patterns
Button("Action")
  .modifier
  .apply(LayoutPatterns.fullWidthButton())
  

Sidebar()
  .modifier
  .apply(LayoutPatterns.sidebar(300))
  
```

## Migration from Workarounds

### Before (Manual Workarounds)

```typescript
// Old way - manual percentage and flexbox
Text("Content")
  .modifier
  .width('100%')
  .flexGrow(1)
  

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
  

Text("Centered")
  .modifier
  .frame({ maxWidth: infinity })
  .textAlign('center')
  
```

## Common Patterns

### Full-Width Buttons

```typescript
VStack([
  Button("Primary Action")
    .modifier
    .frame({ maxWidth: infinity })
    .backgroundColor('#007AFF')
    ,
    
  Button("Secondary Action")
    .modifier
    .frame({ maxWidth: infinity })
    .backgroundColor('#F2F2F2')
    
])
```

### Equal-Width Elements

```typescript
HStack([
  Button("Cancel")
    .modifier
    .frame({ maxWidth: infinity })
    ,
    
  Button("OK")
    .modifier
    .frame({ maxWidth: infinity })
    
])
```

### Responsive Content Areas

```typescript
VStack([
  Header()
    .modifier
    .apply(fixedHeightExpandWidth(60))
    ,
    
  HStack([
    Sidebar()
      .modifier
      .apply(fixedWidthExpandHeight(250))
      ,
      
    MainContent()
      .modifier
      .apply(expand())
      
  ]),
  
  Footer()
    .modifier
    .apply(fixedHeightExpandWidth(40))
    
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
  
```

### Animation Support

```typescript
Text("Animated")
  .modifier
  .frame({ maxWidth: infinity })
  .transition({ property: 'all', duration: 300 })
  
```

## Debugging

Enable debug mode to see SUI equivalencies:

```typescript
import { logSuiEquivalent } from '@tachui/core'

logSuiEquivalent('frame(maxWidth: .infinity)')
// Logs: SUI Pattern: frame(maxWidth: .infinity) → TachUI: fillMaxWidth()
```