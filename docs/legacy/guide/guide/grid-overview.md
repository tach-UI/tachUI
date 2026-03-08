# Grid System Overview

TachUI's Grid system provides comprehensive layout capabilities that combine the familiarity of SwiftUI's Grid API with the performance of native CSS Grid. This overview guides you through the complete Grid documentation ecosystem.

## 📚 Documentation Index

### **🚀 Getting Started**
- **[Grid Components](../components/grid.md)** - Complete API reference and basic usage examples
- **[SwiftUI Comparison](../examples/swiftui-grid-comparison.md)** - Side-by-side SwiftUI to TachUI migration examples

### **🏗 Advanced Usage** 
- **[Advanced Grid Patterns](../examples/advanced-grid-patterns.md)** - Complex layouts, responsive patterns, and real-world examples
- **[Flexbox Migration Guide](../guide/flexbox-to-grid-migration.md)** - Step-by-step migration from flexbox layouts

### **⚡ Performance & Optimization**
- **[Performance Guide](../guide/grid-performance-guide.md)** - Optimization techniques and best practices

## Quick Start

Get started with Grid components in under 5 minutes:

### 1. Basic Card Grid

```typescript
import { LazyVGrid, GridItem, Text } from '@tachui/core'

const QuickGrid = LazyVGrid({
  columns: [GridItem.adaptive(250, 350)], // Responsive columns
  spacing: 16,
  children: [
    Text('Card 1').padding(20).backgroundColor('#e3f2fd').build(),
    Text('Card 2').padding(20).backgroundColor('#f3e5f5').build(),
    Text('Card 3').padding(20).backgroundColor('#e8f5e8').build(),
    Text('Card 4').padding(20).backgroundColor('#fff3e0').build()
  ]
})
```

### 2. Dashboard Layout

```typescript
import { Grid, GridRow, Text } from '@tachui/core'

const QuickDashboard = Grid({
  children: [
    GridRow([
      Text('Header').gridColumnSpan(3).fontSize(24).build()
    ]),
    GridRow([
      Text('Sidebar').width(200).build(),
      Text('Main Content').flex(1).build(),
      Text('Stats').width(150).build()
    ])
  ]
})
```

## Core Concepts

### Grid Components
- **`Grid`** - Basic 2D grid with explicit row/column control
- **`LazyVGrid`** - Vertical scrolling grid with column definitions
- **`LazyHGrid`** - Horizontal scrolling grid with row definitions

### GridItem Factory Methods
- **`GridItem.fixed(size)`** - Fixed size columns/rows
- **`GridItem.flexible(min?, max?)`** - Flexible sizing with constraints
- **`GridItem.adaptive(min, max?)`** - Responsive columns that adapt to container width

### Advanced Features
- **Item Spanning** - Span items across multiple columns/rows
- **Animations** - Smooth layout transitions and item entrance effects
- **Accessibility** - WCAG 2.1 AA compliant with keyboard navigation
- **Styling** - Debug visualization, interactive states, and custom styling

## Feature Comparison

| Feature | Grid | LazyVGrid | LazyHGrid |
|---------|------|-----------|-----------|
| **Layout Direction** | 2D explicit | Vertical flow | Horizontal flow |
| **Best For** | Dashboard layouts | Card grids | Carousels, timelines |
| **Responsive** | Manual | Automatic | Automatic |
| **Scrolling** | Container-based | Built-in vertical | Built-in horizontal |
| **Performance** | Excellent | Optimized for large datasets | Optimized for wide content |

## Architecture Benefits

### **Native CSS Grid Performance**
- Leverages browser's optimized layout engine
- Zero JavaScript layout calculations
- Hardware-accelerated rendering

### **Intelligent Caching**
- LRU CSS cache with 95%+ hit rates
- Automatic cache management
- Memory-efficient operation

### **SwiftUI API Compatibility**
- 100% compatible GridItem factory methods
- Familiar declarative syntax
- Easy migration from SwiftUI concepts

### **Advanced Accessibility**
- Built-in keyboard navigation
- Screen reader optimization
- WCAG 2.1 AA compliance

## Real-World Use Cases

### 1. **E-commerce Product Grid**
```typescript
// Responsive product catalog with lazy loading
LazyVGrid({
  columns: [GridItem.adaptive(280, 350)],
  children: products.map(product => ProductCard(product))
})
```

### 2. **Social Media Feed**
```typescript
// Masonry-style social posts
LazyVGrid({
  columns: [GridItem.adaptive(300, 500)],
  animations: GridAnimations.fadeIn(),
  children: posts.map(post => PostCard(post))
})
```

### 3. **Dashboard Widget Grid**
```typescript
// Real-time updating dashboard
LazyVGrid({
  columns: [GridItem.adaptive(300, 400)],
  animations: GridAnimations.smoothLayout(),
  children: widgets.map(widget => WidgetCard(widget))
})
```

### 4. **Image Gallery**
```typescript
// Responsive image gallery with lightbox
LazyVGrid({
  columns: [GridItem.adaptive(200, 300)],
  children: images.map(image => ImageCard(image))
})
```

## Performance Characteristics

| Metric | Small Grid (< 100 items) | Large Grid (1000+ items) | Complex Grid (Rich content) |
|--------|---------------------------|----------------------------|----------------------------|
| **Initial Render** | < 16ms | < 50ms* | < 100ms* |
| **Responsive Changes** | < 8ms | < 20ms | < 30ms |
| **Memory Usage** | Minimal | Optimized** | Managed** |
| **Scroll Performance** | 60fps | 60fps** | 60fps** |

*With virtual scrolling  
**With proper optimization techniques

## Best Practice Quick Reference

### ✅ **Do**
- Use `GridItem.adaptive()` for responsive designs
- Implement virtual scrolling for large datasets
- Memoize complex item components
- Use appropriate Grid component for your layout type
- Leverage built-in accessibility features

### ❌ **Don't**
- Use Grid for simple one-dimensional layouts (use HStack/VStack)
- Create unconstrained flexible columns with large datasets
- Ignore accessibility requirements
- Skip performance testing with realistic data
- Over-animate grid changes

## Migration Paths

### **From SwiftUI**
SwiftUI developers can migrate directly with minimal code changes:
```swift
// SwiftUI
LazyVGrid(columns: [GridItem(.adaptive(minimum: 160))]) {
    ForEach(items) { item in ItemView(item) }
}

// TachUI
LazyVGrid({
  columns: [GridItem.adaptive(160)],
  children: items.map(item => ItemView(item))
})
```

### **From Flexbox**
Flexbox layouts can be systematically migrated to Grid:
```typescript
// Before: Complex flexbox
HStack([...]).responsive().css({...}).build()

// After: Simple Grid
LazyVGrid({
  columns: [GridItem.adaptive(250)],
  children: [...]
})
```

### **From CSS Grid**
Native CSS Grid can be enhanced with TachUI's features:
```css
/* Before: CSS Grid */
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }

/* After: TachUI Grid with accessibility, animations, and TypeScript */
LazyVGrid({
  columns: [GridItem.adaptive(250)],
  accessibility: GridAccessibility.basic('Product Grid'),
  animations: GridAnimations.fadeIn()
})
```

## Next Steps

### **New to TachUI Grids?**
1. Start with [Grid Components](../components/grid.md) for basic usage
2. Review [SwiftUI Comparison](../examples/swiftui-grid-comparison.md) for familiar patterns
3. Try the Quick Start examples above

### **Ready for Advanced Features?**
1. Explore [Advanced Grid Patterns](../examples/advanced-grid-patterns.md) 
2. Implement responsive designs with the patterns guide
3. Optimize with [Performance Guide](../guide/grid-performance-guide.md)

### **Migrating Existing Code?**
1. Use [Flexbox Migration Guide](../guide/flexbox-to-grid-migration.md) for systematic migration
2. Follow the migration checklist and best practices
3. Performance test before and after migration

### **Building Production Apps?**
1. Review [Performance Guide](../guide/grid-performance-guide.md) thoroughly
2. Implement proper accessibility with the provided configurations
3. Use performance monitoring in development

The TachUI Grid system provides everything you need for modern, responsive, and performant grid layouts. Choose your starting point based on your experience level and project needs.