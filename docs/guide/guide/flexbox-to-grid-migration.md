# Flexbox to Grid Migration Guide

This guide helps you migrate existing flexbox-based layouts to TachUI's Grid components for improved layout control, better responsive design, and enhanced performance.

## When to Use Grid vs Flexbox

### Use Grid When:
- ✅ **Two-dimensional layouts** (rows AND columns matter)
- ✅ **Card grids** with consistent sizing
- ✅ **Complex layouts** with overlapping elements
- ✅ **Responsive designs** that change structure
- ✅ **Dashboard layouts** with multiple regions
- ✅ **Magazine-style layouts** with varied content sizes

### Continue Using Flexbox When:
- ✅ **One-dimensional layouts** (either row OR column)
- ✅ **Navigation bars** and toolbars
- ✅ **Button groups** and form controls
- ✅ **Content centering** within containers
- ✅ **Component internal layouts** (inside cards, buttons, etc.)

## Basic Migration Patterns

### 1. Simple Card Grid

**Before (HStack/VStack with wrapping):**
```typescript
import { VStack, HStack, Text } from '@tachui/core'

// Manual responsive wrapping with HStack/VStack
const CardGrid = VStack([
  HStack([
    Card('Item 1'),
    Card('Item 2'),
    Card('Item 3')
  ]),
  HStack([
    Card('Item 4'),
    Card('Item 5'),
    Card('Item 6')
  ])
])
  .modifier
  .responsive()
  .small({
    // Mobile: Stack vertically
    css: { 'flex-direction': 'column' }
  })
  .build()
```

**After (LazyVGrid):**
```typescript
import { LazyVGrid, GridItem, Text } from '@tachui/core'

// Automatic responsive grid
const CardGrid = LazyVGrid({
  columns: [GridItem.adaptive(250, 350)], // Automatically fits columns
  spacing: 16,
  children: [
    Card('Item 1'),
    Card('Item 2'),
    Card('Item 3'),
    Card('Item 4'),
    Card('Item 5'),
    Card('Item 6')
  ]
})
```

### 2. Responsive Layout

**Before (Complex responsive flexbox):**
```typescript
const ResponsiveLayout = HStack([
  Sidebar(),
  MainContent(),
  RightPanel()
])
  .modifier
  .responsive()
  .small({
    css: {
      'flex-direction': 'column',
      '& > *:first-child': { order: 1 }, // Sidebar last on mobile
      '& > *:nth-child(2)': { order: 0 }, // Main content first
      '& > *:last-child': { order: 2 }    // Right panel middle
    }
  })
  .medium({
    css: {
      'flex-direction': 'row',
      '& > *:first-child': { 'flex-basis': '250px' },
      '& > *:nth-child(2)': { 'flex': '1' },
      '& > *:last-child': { 'flex-basis': '300px' }
    }
  })
  .build()
```

**After (Grid):**
```typescript
const ResponsiveLayout = Grid({
  children: [
    GridRow([
      Sidebar(),
      MainContent(),
      RightPanel()
    ])
  ]
})
  .modifier
  .responsive()
  .small({
    // Mobile: Stack vertically, reorder
    css: {
      'grid-template-columns': '1fr',
      'grid-template-rows': 'auto auto auto',
      'grid-template-areas': '"main" "right" "sidebar"'
    }
  })
  .medium({
    // Tablet/Desktop: Side-by-side
    css: {
      'grid-template-columns': '250px 1fr 300px',
      'grid-template-areas': '"sidebar main right"'
    }
  })
  .build()
```

## Common Migration Scenarios

### 1. Product Gallery

**Before (Flexbox with manual wrapping):**
```typescript
const ProductGallery = VStack([
  // Manual row creation
  HStack([
    ProductCard(products[0]),
    ProductCard(products[1]), 
    ProductCard(products[2])
  ]),
  HStack([
    ProductCard(products[3]),
    ProductCard(products[4]),
    ProductCard(products[5])
  ])
  // ... more manual rows
])
  .modifier
  .css({
    '& > *': { 
      display: 'flex',
      'flex-wrap': 'wrap',
      gap: '16px',
      'justify-content': 'space-between'
    }
  })
  .responsive()
  .small({
    css: { '& > * > *': { 'flex-basis': '100%' } } // Single column
  })
  .medium({
    css: { '& > * > *': { 'flex-basis': 'calc(50% - 8px)' } } // Two columns
  })
  .build()
```

**After (LazyVGrid with automatic layout):**
```typescript
const ProductGallery = LazyVGrid({
  columns: [GridItem.adaptive(280, 350)], // Automatic responsive columns
  spacing: 16,
  children: products.map(product => ProductCard(product))
})
  .modifier
  .padding(16)
  .build()
```

### 2. Dashboard Layout

**Before (Complex nested flexbox):**
```typescript
const Dashboard = VStack([
  // Header
  HStack([
    Text('Dashboard').modifier.fontSize(28).build(),
    Spacer(),
    UserMenu()
  ])
  .modifier.padding(16).backgroundColor('#ffffff').build(),
  
  // Main content
  HStack([
    // Sidebar
    VStack([
      Navigation(),
      QuickActions()
    ])
    .modifier.width(250).backgroundColor('#f8f9fa').build(),
    
    // Content area
    VStack([
      // Stats row
      HStack([
        StatsCard('Users', '12,345'),
        StatsCard('Revenue', '$45,678'),
        StatsCard('Orders', '1,234')
      ])
      .modifier.marginBottom(20).build(),
      
      // Charts row
      HStack([
        ChartWidget().modifier.flex(2).build(),
        RecentActivity().modifier.flex(1).build()
      ])
    ])
    .modifier.flex(1).padding(16).build()
  ])
  .modifier.flex(1).build()
])
```

**After (Grid with explicit areas):**
```typescript
const Dashboard = Grid({
  children: [
    GridRow([
      Text('Dashboard')
        .modifier
        .fontSize(28)
        .gridColumnSpan(4) // Span entire width
        .padding(16)
        .backgroundColor('#ffffff')
        .build()
    ]),
    
    GridRow([
      // Sidebar
      VStack([
        Navigation(),
        QuickActions()
      ])
      .modifier
      .gridRowSpan(2) // Span multiple rows
      .width(250)
      .backgroundColor('#f8f9fa')
      .padding(16)
      .build(),
      
      // Stats cards
      StatsCard('Users', '12,345'),
      StatsCard('Revenue', '$45,678'), 
      StatsCard('Orders', '1,234')
    ]),
    
    GridRow([
      null, // Skip sidebar column
      ChartWidget()
        .modifier
        .gridColumnSpan(2) // Span 2 columns
        .build(),
      
      RecentActivity()
    ])
  ]
})
```

### 3. Responsive Image Gallery

**Before (Flexbox with media queries):**
```typescript
const ImageGallery = HStack([])
  .modifier
  .css({
    'flex-wrap': 'wrap',
    gap: '12px',
    
    '& img': {
      'flex-basis': '300px',
      'flex-grow': 1,
      'max-width': '400px',
      height: '200px',
      'object-fit': 'cover',
      'border-radius': '8px'
    }
  })
  .responsive()
  .small({
    css: { '& img': { 'flex-basis': '100%' } }
  })
  .medium({
    css: { '& img': { 'flex-basis': 'calc(50% - 6px)' } }
  })
  .large({
    css: { '& img': { 'flex-basis': 'calc(33.333% - 8px)' } }
  })
  .build()
```

**After (LazyVGrid with responsive columns):**
```typescript
const ImageGallery = LazyVGrid({
  columns: [GridItem.adaptive(300, 400)],
  spacing: 12,
  children: images.map(image => 
    Image({ src: image.url, alt: image.alt })
      .modifier
      .aspectRatio(1.5, 'fill')
      .cornerRadius(8)
      .build()
  )
})
```

## Advanced Migration Patterns

### 1. Complex Card Layout

**Before (Flexbox with complex positioning):**
```typescript
const ComplexCard = VStack([
  // Header with avatar and actions
  HStack([
    Image({ src: user.avatar, alt: user.name })
      .modifier.frame(40, 40).cornerRadius(20).build(),
    
    VStack([
      Text(user.name).modifier.fontWeight('bold').build(),
      Text(user.role).modifier.fontSize(12).foregroundColor('#666').build()
    ])
    .modifier.flex(1).marginLeft(12).build(),
    
    Button({ title: 'Follow' })
  ])
  .modifier.padding(16).build(),
  
  // Main content
  VStack([
    Text(post.content).modifier.marginBottom(12).build(),
    
    post.image && Image({ src: post.image, alt: 'Post image' })
      .modifier.cornerRadius(8).marginBottom(12).build(),
    
    // Actions
    HStack([
      Button({ title: '♥ Like' }),
      Button({ title: '💬 Comment' }),
      Button({ title: '🔄 Share' }),
      Spacer(),
      Text(post.timestamp).modifier.fontSize(12).foregroundColor('#999').build()
    ])
  ])
  .modifier.padding(16).paddingTop(0).build()
])
```

**After (Grid with defined areas):**
```typescript
const ComplexCard = Grid({
  children: [
    GridRow([
      Image({ src: user.avatar, alt: user.name })
        .modifier
        .frame(40, 40)
        .cornerRadius(20)
        .gridArea('avatar')
        .build(),
      
      VStack([
        Text(user.name).modifier.fontWeight('bold').build(),
        Text(user.role).modifier.fontSize(12).foregroundColor('#666').build()
      ])
      .modifier.gridArea('userInfo').build(),
      
      Button({ title: 'Follow' })
        .modifier.gridArea('action').build()
    ]),
    
    GridRow([
      VStack([
        Text(post.content),
        post.image && Image({ src: post.image, alt: 'Post image' }),
        
        HStack([
          Button({ title: '♥ Like' }),
          Button({ title: '💬 Comment' }),
          Button({ title: '🔄 Share' }),
          Spacer(),
          Text(post.timestamp)
        ])
      ])
      .modifier
      .gridColumnSpan(3)
      .padding(16)
      .build()
    ])
  ]
})
  .modifier
  .css({
    'grid-template-columns': 'auto 1fr auto',
    'grid-template-areas': '"avatar userInfo action" "content content content"',
    gap: '12px 16px'
  })
  .build()
```

### 2. Masonry-Style Layout Migration

**Before (Complex flexbox masonry):**
```typescript
const MasonryLayout = () => {
  const [columns, setColumns] = useState(3)
  
  // Manually distribute items across columns
  const distributedItems = items.reduce((acc, item, index) => {
    const columnIndex = index % columns
    if (!acc[columnIndex]) acc[columnIndex] = []
    acc[columnIndex].push(item)
    return acc
  }, [] as Item[][])
  
  return HStack(
    distributedItems.map(columnItems => 
      VStack(columnItems.map(item => ItemCard(item)))
    )
  )
    .modifier
    .responsive()
    .small({ 
      children: () => {
        setColumns(1)
        return distributedItems
      }
    })
    .medium({
      children: () => {
        setColumns(2) 
        return distributedItems
      }
    })
    .build()
}
```

**After (LazyVGrid with natural flow):**
```typescript
const MasonryLayout = LazyVGrid({
  columns: [GridItem.adaptive(250, 350)], // Automatic responsive columns
  spacing: 16,
  children: items.map(item => ItemCard(item))
})
  .modifier
  .css({
    // CSS Grid masonry (when supported)
    'grid-template-rows': 'masonry'
  })
  .build()
```

## Migration Checklist

### Before Migration
- [ ] **Identify layout type**: Is it 1D (flexbox) or 2D (grid)?
- [ ] **Analyze responsive behavior**: How does it adapt to different screen sizes?
- [ ] **Check for complex positioning**: Are there overlapping elements or specific positioning needs?
- [ ] **Evaluate performance**: Are there performance issues with the current approach?

### During Migration
- [ ] **Choose appropriate Grid component**:
  - `Grid` for explicit row/column layouts
  - `LazyVGrid` for vertical scrolling grids
  - `LazyHGrid` for horizontal scrolling grids
- [ ] **Replace manual responsive logic** with GridItem adaptive columns
- [ ] **Use GridItem factory methods**:
  - `GridItem.fixed()` for specific sizes
  - `GridItem.flexible()` for flexible sizing
  - `GridItem.adaptive()` for responsive columns
- [ ] **Simplify responsive code** using automatic grid behavior

### After Migration
- [ ] **Test responsive behavior** across different screen sizes
- [ ] **Verify accessibility** with keyboard navigation and screen readers
- [ ] **Check performance** - Grid should be faster for complex layouts
- [ ] **Update any dependent styles** that relied on flexbox behavior

## Performance Comparison

### Before (Flexbox)
```typescript
// Manual responsive calculations
const ResponsiveFlexGrid = () => {
  const [itemsPerRow, setItemsPerRow] = useState(3)
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 600) setItemsPerRow(1)
      else if (width < 1200) setItemsPerRow(2)  
      else setItemsPerRow(3)
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Manual row creation and re-rendering on resize
  const rows = []
  for (let i = 0; i < items.length; i += itemsPerRow) {
    rows.push(items.slice(i, i + itemsPerRow))
  }
  
  return VStack(
    rows.map(row => 
      HStack(row.map(item => ItemCard(item)))
    )
  )
}
```

### After (Grid)
```typescript
// Automatic responsive behavior, no JavaScript needed
const ResponsiveGrid = LazyVGrid({
  columns: [GridItem.adaptive(300)], // Browser handles all responsive logic
  spacing: 16,
  children: items.map(item => ItemCard(item))
})
```

**Performance Benefits:**
- ❌ **Flexbox**: JavaScript-based responsive calculations, re-renders on resize
- ✅ **Grid**: Native browser layout engine, no JavaScript overhead
- ❌ **Flexbox**: Manual DOM manipulation for responsive changes  
- ✅ **Grid**: CSS-only responsive behavior
- ❌ **Flexbox**: Complex layout calculations in JavaScript
- ✅ **Grid**: Optimized browser layout algorithms

## Common Pitfalls and Solutions

### 1. Over-Engineering
**Avoid**: Converting simple one-dimensional layouts to Grid
```typescript
// ❌ Don't do this for simple button groups
const ButtonGroup = LazyVGrid({
  columns: [GridItem.flexible(), GridItem.flexible(), GridItem.flexible()],
  children: [Button1, Button2, Button3]
})
```

**Instead**: Keep using HStack for simple cases
```typescript
// ✅ HStack is perfect for this
const ButtonGroup = HStack([Button1, Button2, Button3])
```

### 2. Ignoring Content Flow
**Problem**: Forcing content into rigid grid structures
```typescript
// ❌ Rigid grid that doesn't adapt to content
const RigidGrid = LazyVGrid({
  columns: [
    GridItem.fixed(200),
    GridItem.fixed(200), 
    GridItem.fixed(200)
  ],
  children: items // Content might not fit well
})
```

**Solution**: Use adaptive columns for content-driven layouts
```typescript
// ✅ Adapts to content and container size
const FlexibleGrid = LazyVGrid({
  columns: [GridItem.adaptive(200, 300)],
  children: items
})
```

### 3. Missing Accessibility
**Problem**: Forgetting keyboard navigation in complex grids
```typescript
// ❌ No accessibility considerations
const InaccessibleGrid = LazyVGrid({
  columns: [GridItem.adaptive(250)],
  children: items
})
```

**Solution**: Add proper accessibility configuration
```typescript
// ✅ Full accessibility support
const AccessibleGrid = LazyVGrid({
  columns: [GridItem.adaptive(250)],
  accessibility: GridAccessibility.full('Product Grid', 'Grid of available products'),
  children: items
})
```

This migration guide provides a systematic approach to moving from flexbox-based layouts to TachUI's powerful Grid system, resulting in cleaner code, better performance, and enhanced responsive design capabilities.