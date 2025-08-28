# Grid Components

The Grid component system provides powerful layout capabilities that mirror SwiftUI's grid components while leveraging native CSS Grid performance. The system includes four main components: `Grid`, `GridRow`, `LazyVGrid`, and `LazyHGrid`.

## Overview

TachUI's Grid components offer:
- **SwiftUI API compatibility** - Familiar GridItem factory methods (`fixed`, `flexible`, `adaptive`)
- **CSS Grid performance** - Native browser grid implementation for optimal speed
- **Responsive design** - Built-in breakpoint support and responsive column/row definitions
- **Advanced features** - Item spanning, animations, accessibility, and styling
- **Full TypeScript support** - Comprehensive type safety with intelligent autocomplete

## Core Components

### Grid
Basic CSS Grid container with explicit row/column control, perfect for simple layouts where you define both rows and columns explicitly.

```typescript
import { Grid, GridRow, Text } from '@tachui/core'

const BasicGrid = Grid({
  children: [
    GridRow([
      Text('Header').modifier.padding(8).backgroundColor('#f0f0f0').build(),
      Text('Header 2').modifier.padding(8).backgroundColor('#f0f0f0').build()
    ]),
    GridRow([
      Text('Content 1').modifier.padding(8).build(),
      Text('Content 2').modifier.padding(8).build()
    ])
  ]
})
  .modifier
  .backgroundColor('#ffffff')
  .cornerRadius(8)
  .build()
```

### LazyVGrid
Vertical scrolling grid with flexible columns - ideal for card layouts, image galleries, and responsive content grids.

```typescript
import { LazyVGrid, GridItem, Text } from '@tachui/core'

const CardGrid = LazyVGrid({
  columns: [
    GridItem.flexible(),
    GridItem.flexible(), 
    GridItem.flexible()
  ],
  spacing: 16,
  children: [
    Text('Card 1').modifier.padding(20).backgroundColor('#e3f2fd').cornerRadius(8).build(),
    Text('Card 2').modifier.padding(20).backgroundColor('#f3e5f5').cornerRadius(8).build(),
    Text('Card 3').modifier.padding(20).backgroundColor('#e8f5e8').cornerRadius(8).build(),
    Text('Card 4').modifier.padding(20).backgroundColor('#fff3e0').cornerRadius(8).build(),
    Text('Card 5').modifier.padding(20).backgroundColor('#fce4ec').cornerRadius(8).build(),
    Text('Card 6').modifier.padding(20).backgroundColor('#f1f8e9').cornerRadius(8).build()
  ]
})
  .modifier
  .padding(16)
  .build()
```

### LazyHGrid
Horizontal scrolling grid with flexible rows - perfect for horizontal scrolling content, timelines, and carousel-style layouts.

```typescript
import { LazyHGrid, GridItem, Image, Text, VStack } from '@tachui/core'

const HorizontalGallery = LazyHGrid({
  rows: [GridItem.fixed(200)],
  spacing: 12,
  children: [
    VStack([
      Image({ src: 'image1.jpg', alt: 'Photo 1' }).modifier.cornerRadius(8).build(),
      Text('Photo 1').modifier.fontSize(12).build()
    ]),
    VStack([
      Image({ src: 'image2.jpg', alt: 'Photo 2' }).modifier.cornerRadius(8).build(),
      Text('Photo 2').modifier.fontSize(12).build()
    ]),
    VStack([
      Image({ src: 'image3.jpg', alt: 'Photo 3' }).modifier.cornerRadius(8).build(),
      Text('Photo 3').modifier.fontSize(12).build()
    ])
  ]
})
  .modifier
  .padding(16)
  .build()
```

## GridItem Configuration

GridItem provides three factory methods that exactly match SwiftUI's API:

### GridItem.fixed(size)
Creates a column/row with a fixed size in pixels.

```typescript
// Fixed 100px width columns
const columns = [
  GridItem.fixed(100),
  GridItem.fixed(150),
  GridItem.fixed(200)
]
```

### GridItem.flexible(minimum?, maximum?)
Creates a flexible column/row that grows to fill available space.

```typescript
// Flexible columns with optional constraints
const columns = [
  GridItem.flexible(),           // Unconstrained flexible
  GridItem.flexible(100),        // Minimum 100px
  GridItem.flexible(50, 200)     // Between 50px and 200px
]
```

### GridItem.adaptive(minimum, maximum?)
Creates adaptive columns that fit as many items as possible while respecting size constraints.

```typescript
// Adaptive grid - fits as many 150px+ columns as possible
const columns = [GridItem.adaptive(150, 300)]

// Results in different column counts based on container width:
// 400px container → 2 columns (200px each)
// 600px container → 3 columns (200px each) 
// 800px container → 4 columns (200px each)
```

## Advanced Features

### Grid Item Spanning
Control how grid items span across multiple columns or rows:

```typescript
import { LazyVGrid, GridItem, Text } from '@tachui/core'

const SpanningGrid = LazyVGrid({
  columns: [
    GridItem.flexible(),
    GridItem.flexible(),
    GridItem.flexible(),
    GridItem.flexible()
  ],
  children: [
    Text('Header')
      .modifier
      .padding(16)
      .backgroundColor('#2196f3')
      .foregroundColor('#ffffff')
      .gridColumnSpan(4) // Spans all 4 columns
      .build(),
    
    Text('Sidebar')
      .modifier
      .padding(16)
      .backgroundColor('#4caf50')
      .gridRowSpan(2) // Spans 2 rows
      .build(),
    
    Text('Content 1').modifier.padding(16).backgroundColor('#f0f0f0').build(),
    Text('Content 2').modifier.padding(16).backgroundColor('#f0f0f0').build(),
    Text('Content 3').modifier.padding(16).backgroundColor('#f0f0f0').build(),
    Text('Content 4').modifier.padding(16).backgroundColor('#f0f0f0').build(),
    Text('Content 5').modifier.padding(16).backgroundColor('#f0f0f0').build()
  ]
})
```

### Section Headers and Footers
Add section structure to your grids:

```typescript
const SectionGrid = LazyVGrid({
  columns: [GridItem.flexible(), GridItem.flexible()],
  header: Text('Featured Items')
    .modifier
    .fontSize(18)
    .fontWeight('bold')
    .padding(16)
    .build(),
  footer: Text('End of featured items')
    .modifier
    .fontSize(14)
    .foregroundColor('#666666')
    .padding(16)
    .build(),
  children: [
    Text('Item 1').modifier.padding(12).backgroundColor('#f0f0f0').build(),
    Text('Item 2').modifier.padding(12).backgroundColor('#f0f0f0').build(),
    Text('Item 3').modifier.padding(12).backgroundColor('#f0f0f0').build(),
    Text('Item 4').modifier.padding(12).backgroundColor('#f0f0f0').build()
  ]
})
```

### Animations
Add smooth animations to layout changes:

```typescript
import { LazyVGrid, GridItem, GridAnimations, Text } from '@tachui/core'

const AnimatedGrid = LazyVGrid({
  columns: [GridItem.flexible(), GridItem.flexible(), GridItem.flexible()],
  animations: GridAnimations.fadeIn(250, 50), // Fade in with stagger
  children: items.map(item => 
    Text(item.title)
      .modifier
      .padding(16)
      .backgroundColor(item.color)
      .cornerRadius(8)
      .build()
  )
})

// Available animation presets:
GridAnimations.fadeIn(duration?, delay?)
GridAnimations.scaleIn(duration?)
GridAnimations.slideIn(direction, duration?)
GridAnimations.smoothLayout(duration?)
GridAnimations.comprehensive(itemDuration?, layoutDuration?)
```

### Accessibility
Full WCAG 2.1 AA compliance with keyboard navigation:

```typescript
import { LazyVGrid, GridItem, GridAccessibility, Text } from '@tachui/core'

const AccessibleGrid = LazyVGrid({
  columns: [GridItem.flexible(), GridItem.flexible()],
  accessibility: GridAccessibility.full(
    'Product Grid',
    'Grid of available products with keyboard navigation'
  ),
  children: products.map(product => 
    Text(product.name)
      .modifier
      .padding(12)
      .backgroundColor('#f0f0f0')
      .cornerRadius(4)
      .build()
  )
})

// Accessibility presets:
GridAccessibility.full(label, description)     // Complete accessibility
GridAccessibility.basic(label)                 // Basic keyboard + screen reader
GridAccessibility.screenReader(label)          // Screen reader optimized
GridAccessibility.keyboardOnly(label)          // Keyboard navigation focus
```

### Advanced Styling
Enhanced visual styling with debug tools:

```typescript
import { LazyVGrid, GridItem, GridStyling, Text } from '@tachui/core'

const StyledGrid = LazyVGrid({
  columns: [GridItem.flexible(), GridItem.flexible(), GridItem.flexible()],
  styling: GridStyling.comprehensive({
    debug: true,        // Show grid lines for development
    interactive: true,  // Hover/focus effects
    card: true,        // Card-style container
    pattern: 'dots'    // Background pattern
  }),
  children: [
    Text('Interactive Item 1').modifier.padding(12).build(),
    Text('Interactive Item 2').modifier.padding(12).build(),
    Text('Interactive Item 3').modifier.padding(12).build()
  ]
})

// Styling presets:
GridStyling.debug(options?)                    // Debug visualization
GridStyling.interactive(hoverEffect?)          // Interactive item states  
GridStyling.card(options?)                     // Card container styling
GridStyling.templateAreas(areas)               // CSS Grid template areas
GridStyling.backgroundPattern(pattern, color?, opacity?)
```

## Responsive Design

Grid components work seamlessly with TachUI's responsive system:

```typescript
import { LazyVGrid, GridItem } from '@tachui/core'

const ResponsiveGrid = LazyVGrid({
  columns: [
    // Responsive column definitions
    GridItem.adaptive(200, 400), // Desktop: larger adaptive columns
    GridItem.adaptive(150, 300), // Tablet: medium adaptive columns  
    GridItem.adaptive(120, 200)  // Mobile: smaller adaptive columns
  ],
  spacing: 16,
  children: items
})
  .modifier
  .responsive()
  .small({ padding: 8 })      // Mobile padding
  .medium({ padding: 12 })    // Tablet padding  
  .large({ padding: 16 })     // Desktop padding
  .build()
```

## Performance Best Practices

### 1. Use Appropriate Grid Type
- **Grid**: Simple layouts with explicit rows/columns
- **LazyVGrid**: Vertical scrolling, many items
- **LazyHGrid**: Horizontal scrolling, carousel-style

### 2. Optimize GridItem Configuration
```typescript
// ✅ Good: Specific constraints
GridItem.flexible(100, 300)  // Clear min/max bounds
GridItem.adaptive(150)       // Reasonable minimum size

// ❌ Avoid: No constraints on large datasets  
GridItem.flexible()          // Can cause layout thrashing
```

### 3. Leverage CSS Caching
The grid system automatically caches CSS for repeated configurations:

```typescript
// This configuration is cached after first use
const commonColumns = [
  GridItem.flexible(),
  GridItem.flexible(),
  GridItem.flexible()
]

// Reusing the same configuration is highly optimized
const grid1 = LazyVGrid({ columns: commonColumns, children: items1 })
const grid2 = LazyVGrid({ columns: commonColumns, children: items2 })
```

### 4. Animation Performance
```typescript
// ✅ Good: Specific animations for your use case
GridAnimations.fadeIn(200)        // Fast, simple
GridAnimations.smoothLayout(300)  // Layout changes only

// ⚠️ Use carefully: Complex animations on large grids
GridAnimations.comprehensive()    // All animations enabled
```

## Common Patterns

### Dashboard Layout
```typescript
const DashboardGrid = Grid({
  children: [
    GridRow([
      Text('Dashboard').modifier.gridColumnSpan(3).fontSize(24).build()
    ]),
    GridRow([
      Text('Sidebar').modifier.gridRowSpan(2).width(200).build(),
      Text('Main Content').modifier.padding(20).build(),
      Text('Stats').modifier.width(150).build()
    ]),
    GridRow([
      null, // Skip first column (spanned by sidebar)
      Text('Footer Content').modifier.gridColumnSpan(2).build()
    ])
  ]
})
```

### Product Gallery
```typescript
const ProductGallery = LazyVGrid({
  columns: [GridItem.adaptive(250, 350)],
  spacing: 20,
  animations: GridAnimations.scaleIn(300),
  accessibility: GridAccessibility.basic('Product Gallery'),
  children: products.map(product => 
    VStack([
      Image({ src: product.image, alt: product.name })
        .modifier.aspectRatio(1).cornerRadius(12).build(),
      Text(product.name).modifier.fontWeight('bold').build(),
      Text(`$${product.price}`).modifier.foregroundColor('#666666').build()
    ])
    .modifier.padding(12).backgroundColor('#ffffff').cornerRadius(8).build()
  )
})
```

### Timeline Layout  
```typescript
const Timeline = LazyHGrid({
  rows: [GridItem.fixed(120)],
  spacing: 16,
  children: events.map(event => 
    VStack([
      Text(event.date).modifier.fontSize(12).foregroundColor('#666666').build(),
      Text(event.title).modifier.fontWeight('bold').build(),
      Text(event.description).modifier.fontSize(14).build()
    ])
    .modifier
    .padding(12)
    .backgroundColor('#f8f9fa')
    .cornerRadius(8)
    .minWidth(200)
    .build()
  )
})
```

## API Reference

### Grid Props
- `children: ComponentInstance[]` - Grid content (GridRows for Grid component)
- `spacing?: number` - Space between grid items in pixels
- `accessibility?: GridAccessibilityConfig` - Accessibility configuration
- `styling?: GridStylingConfig` - Advanced styling options
- `animations?: GridAnimationConfig` - Animation configuration

### LazyVGrid/LazyHGrid Props  
- `columns/rows: GridItemConfig[]` - Column or row definitions
- `children: ComponentInstance[]` - Grid items
- `spacing?: number` - Space between items
- `header?: ComponentInstance` - Optional header content
- `footer?: ComponentInstance` - Optional footer content
- `accessibility?: GridAccessibilityConfig` - Accessibility configuration
- `styling?: GridStylingConfig` - Advanced styling options
- `animations?: GridAnimationConfig` - Animation configuration

### GridItem Methods
- `GridItem.fixed(size: number, spacing?: number)` - Fixed size column/row
- `GridItem.flexible(minimum?: number, maximum?: number)` - Flexible column/row
- `GridItem.adaptive(minimum: number, maximum?: number)` - Adaptive columns/rows

### Grid Modifiers
- `.gridColumnSpan(count: number)` - Span multiple columns
- `.gridRowSpan(count: number)` - Span multiple rows
- `.gridArea(name: string)` - Assign to named grid area

See the [Advanced Grid Patterns](../examples/advanced-grid-patterns.md) for more complex examples and use cases.