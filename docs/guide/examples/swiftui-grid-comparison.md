# SwiftUI Grid Comparison & Migration

This guide provides side-by-side comparisons between SwiftUI Grid components and their TachUI equivalents, making it easy to migrate from SwiftUI concepts to web implementations.

## API Compatibility Overview

TachUI Grid components maintain **100% API compatibility** with SwiftUI's Grid system:

| SwiftUI | TachUI | Compatibility |
|---------|--------|---------------|
| `Grid { GridRow { ... } }` | `Grid({ children: [GridRow([...])] })` | ✅ 100% |
| `LazyVGrid(columns:)` | `LazyVGrid({ columns: [...] })` | ✅ 100% |
| `LazyHGrid(rows:)` | `LazyHGrid({ rows: [...] })` | ✅ 100% |
| `GridItem.fixed(size)` | `GridItem.fixed(size)` | ✅ 100% |
| `GridItem.flexible()` | `GridItem.flexible()` | ✅ 100% |
| `GridItem.adaptive(minimum)` | `GridItem.adaptive(minimum)` | ✅ 100% |

## Basic Grid Patterns

### Simple Grid Layout

**SwiftUI:**
```swift
Grid {
    GridRow {
        Text("A1")
        Text("B1") 
        Text("C1")
    }
    GridRow {
        Text("A2")
        Text("B2")
        Text("C2")
    }
}
.padding()
.background(Color.gray.opacity(0.1))
.cornerRadius(8)
```

**TachUI:**
```typescript
import { Grid, GridRow, Text } from '@tachui/core'

const BasicGrid = Grid({
  children: [
    GridRow([
      Text('A1'),
      Text('B1'),
      Text('C1')
    ]),
    GridRow([
      Text('A2'),
      Text('B2'),
      Text('C2')
    ])
  ]
})
  .padding(16)
  .backgroundColor('rgba(128, 128, 128, 0.1)')
  .cornerRadius(8)
  
```

### Vertical Grid (LazyVGrid)

**SwiftUI:**
```swift
LazyVGrid(columns: [
    GridItem(.flexible()),
    GridItem(.flexible()),
    GridItem(.flexible())
], spacing: 16) {
    ForEach(items, id: \.id) { item in
        Text(item.title)
            .padding()
            .background(Color.blue.opacity(0.2))
            .cornerRadius(8)
    }
}
.padding()
```

**TachUI:**
```typescript
import { LazyVGrid, GridItem, Text } from '@tachui/core'

const VerticalGrid = LazyVGrid({
  columns: [
    GridItem.flexible(),
    GridItem.flexible(),
    GridItem.flexible()
  ],
  spacing: 16,
  children: items.map(item => 
    Text(item.title)
      .padding(16)
      .backgroundColor('rgba(0, 123, 255, 0.2)')
      .cornerRadius(8)
      
  )
})
  .padding(16)
  
```

### Horizontal Grid (LazyHGrid)

**SwiftUI:**
```swift
LazyHGrid(rows: [
    GridItem(.fixed(100)),
    GridItem(.fixed(100))
], spacing: 12) {
    ForEach(photos, id: \.id) { photo in
        AsyncImage(url: photo.url)
            .frame(width: 150, height: 100)
            .cornerRadius(8)
    }
}
.padding()
```

**TachUI:**
```typescript
import { LazyHGrid, GridItem, Image } from '@tachui/core'

const HorizontalGrid = LazyHGrid({
  rows: [
    GridItem.fixed(100),
    GridItem.fixed(100)
  ],
  spacing: 12,
  children: photos.map(photo => 
    Image({ src: photo.url, alt: photo.title })
      .frame(150, 100)
      .cornerRadius(8)
      
  )
})
  .padding(16)
  
```

## GridItem Configuration Patterns

### Fixed Size Columns

**SwiftUI:**
```swift
LazyVGrid(columns: [
    GridItem(.fixed(100)),
    GridItem(.fixed(150)), 
    GridItem(.fixed(200))
])
```

**TachUI:**
```typescript
LazyVGrid({
  columns: [
    GridItem.fixed(100),
    GridItem.fixed(150),
    GridItem.fixed(200)
  ]
})
```

### Flexible Columns

**SwiftUI:**
```swift
LazyVGrid(columns: [
    GridItem(.flexible()),                    // No constraints
    GridItem(.flexible(minimum: 100)),        // Min 100pt
    GridItem(.flexible(minimum: 50, maximum: 200))  // 50-200pt
])
```

**TachUI:**
```typescript
LazyVGrid({
  columns: [
    GridItem.flexible(),           // No constraints
    GridItem.flexible(100),        // Min 100px
    GridItem.flexible(50, 200)     // 50-200px range
  ]
})
```

### Adaptive Columns

**SwiftUI:**
```swift
LazyVGrid(columns: [
    GridItem(.adaptive(minimum: 150))         // Fit as many 150pt+ columns as possible
])
```

**TachUI:**
```typescript
LazyVGrid({
  columns: [
    GridItem.adaptive(150)        // Fit as many 150px+ columns as possible
  ]
})
```

## Advanced Features Comparison

### Grid Item Spanning

**SwiftUI:**
```swift
Grid {
    GridRow {
        Text("Header")
            .gridCellColumns(3)
            .background(Color.blue)
            .foregroundColor(.white)
    }
    GridRow {
        Text("A1")
        Text("B1")
        Text("C1")
    }
}
```

**TachUI:**
```typescript
import { Grid, GridRow, Text } from '@tachui/core'

const SpanningGrid = Grid({
  children: [
    GridRow([
      Text('Header')
        .gridColumnSpan(3)
        .backgroundColor('#007bff')
        .foregroundColor('#ffffff')
        
    ]),
    GridRow([
      Text('A1'),
      Text('B1'), 
      Text('C1')
    ])
  ]
})
```

### Section Headers and Footers

**SwiftUI:**
```swift
LazyVGrid(columns: columns, spacing: 16) {
    Section(header: Text("Featured Items").font(.headline)) {
        ForEach(featuredItems) { item in
            ItemView(item)
        }
    }
}
```

**TachUI:**
```typescript
const SectionGrid = LazyVGrid({
  columns: [GridItem.flexible(), GridItem.flexible()],
  spacing: 16,
  header: Text('Featured Items')
    .fontSize(18)
    .fontWeight('bold')
    ,
  children: featuredItems.map(item => ItemView(item))
})
```

## Complex Layout Patterns

### Photo Gallery

**SwiftUI:**
```swift
LazyVGrid(columns: [
    GridItem(.adaptive(minimum: 200, maximum: 300))
], spacing: 16) {
    ForEach(photos) { photo in
        VStack {
            AsyncImage(url: photo.url)
                .aspectRatio(contentMode: .fill)
                .frame(height: 200)
                .clipped()
                .cornerRadius(12)
            
            Text(photo.title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(8)
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .shadow(radius: 2)
    }
}
```

**TachUI:**
```typescript
import { LazyVGrid, GridItem, VStack, Image, Text } from '@tachui/core'

const PhotoGallery = LazyVGrid({
  columns: [GridItem.adaptive(200, 300)],
  spacing: 16,
  children: photos.map(photo => 
    VStack([
      Image({ src: photo.url, alt: photo.title })
        .aspectRatio(1, 'fill')
        .frame(undefined, 200)
        .clipped()
        .cornerRadius(12)
        ,
      
      Text(photo.title)
        .fontSize(12)
        .foregroundColor('#666666')
        
    ])
    .padding(8)
    .backgroundColor('#ffffff')
    .cornerRadius(8)
    .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
    
  )
})
```

### Dashboard Layout

**SwiftUI:**
```swift
Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 16) {
    GridRow {
        Text("Dashboard")
            .font(.largeTitle)
            .gridCellColumns(3)
    }
    
    GridRow {
        VStack {
            Text("Sidebar")
            // Sidebar content
        }
        .gridCellRows(2)
        .frame(width: 200)
        
        VStack {
            Text("Main Content")
            // Main content
        }
        
        VStack {
            Text("Stats Panel") 
            // Stats content
        }
        .frame(width: 150)
    }
    
    GridRow {
        // Skip first column (spanned by sidebar)
        VStack {
            Text("Footer Content")
        }
        .gridCellColumns(2)
    }
}
.padding()
```

**TachUI:**
```typescript
import { Grid, GridRow, VStack, Text } from '@tachui/core'

const DashboardLayout = Grid({
  children: [
    GridRow([
      Text('Dashboard')
        .fontSize(28)
        .gridColumnSpan(3)
        
    ]),
    
    GridRow([
      VStack([
        Text('Sidebar'),
        // Sidebar content components
      ])
      .gridRowSpan(2)
      .width(200)
      ,
      
      VStack([
        Text('Main Content'),
        // Main content components
      ]),
      
      VStack([
        Text('Stats Panel'),
        // Stats content components  
      ])
      .width(150)
      
    ]),
    
    GridRow([
      null, // Skip first column (spanned by sidebar)
      VStack([
        Text('Footer Content')
      ])
      .gridColumnSpan(2)
      
    ])
  ]
})
  .padding(16)
  
```

## Migration Patterns

### Converting SwiftUI ForEach to TachUI

**SwiftUI:**
```swift
LazyVGrid(columns: columns) {
    ForEach(items, id: \.id) { item in
        ItemView(item: item)
    }
}
```

**TachUI:**
```typescript
LazyVGrid({
  columns: columns,
  children: items.map(item => ItemView({ item }))
})
```

### Converting SwiftUI Sections

**SwiftUI:**
```swift
LazyVGrid(columns: columns) {
    Section(header: HeaderView()) {
        ForEach(sectionItems) { item in
            ItemView(item: item)
        }
    }
    
    Section(header: HeaderView2()) {
        ForEach(section2Items) { item in
            ItemView(item: item)
        }
    }
}
```

**TachUI:**
```typescript
// Option 1: Multiple grids with headers
VStack([
  HeaderView(),
  LazyVGrid({
    columns: columns,
    children: sectionItems.map(item => ItemView({ item }))
  }),
  
  HeaderView2(),
  LazyVGrid({
    columns: columns, 
    children: section2Items.map(item => ItemView({ item }))
  })
])

// Option 2: Single grid with header/footer props
LazyVGrid({
  columns: columns,
  header: HeaderView(),
  footer: HeaderView2(),
  children: [...sectionItems, ...section2Items].map(item => ItemView({ item }))
})
```

### Converting SwiftUI Spacing and Alignment

**SwiftUI:**
```swift
LazyVGrid(columns: columns, 
          alignment: .leading,
          spacing: 16,
          pinnedViews: .sectionHeaders)
```

**TachUI:**
```typescript
LazyVGrid({
  columns: columns,
  spacing: 16,
  // Alignment handled via CSS Grid properties
  // Pinned headers handled via styling configuration
  styling: {
    container: {
      // Custom CSS for alignment and pinning
    }
  }
})
```

## TachUI-Specific Enhancements

TachUI provides several features beyond SwiftUI's capabilities:

### 1. Advanced Animations
```typescript
LazyVGrid({
  columns: columns,
  animations: GridAnimations.comprehensive(250, 300),
  children: items
})
```

### 2. Accessibility Features
```typescript
LazyVGrid({
  columns: columns,
  accessibility: GridAccessibility.full(
    'Product Grid',
    'Responsive grid of product cards with keyboard navigation'
  ),
  children: items
})
```

### 3. Debug Visualization
```typescript
LazyVGrid({
  columns: columns,
  styling: GridStyling.debug({
    showLines: true,
    showAreas: true,
    lineColor: '#ff0000'
  }),
  children: items
})
```

### 4. CSS Grid Template Areas
```typescript
LazyVGrid({
  columns: columns,
  styling: GridStyling.templateAreas([
    'header header header',
    'sidebar main aside',
    'footer footer footer'
  ]),
  children: items
})
```

## Performance Considerations

### SwiftUI Performance Tips → TachUI Equivalents

1. **Use LazyVGrid/LazyHGrid for large datasets** (same as SwiftUI)
2. **Prefer fixed or constrained flexible items** for predictable layouts
3. **Use adaptive columns** for responsive design instead of multiple breakpoint-specific grids
4. **Leverage TachUI's CSS caching** by reusing GridItem configurations
5. **Use animations judiciously** - TachUI provides fine-grained animation control

### Memory Management
- **SwiftUI**: Automatic view recycling in lazy grids  
- **TachUI**: Native CSS Grid with minimal JavaScript overhead + automatic CSS caching

## Complete Migration Example

Here's a complete SwiftUI grid migrated to TachUI:

**SwiftUI:**
```swift
struct ProductGrid: View {
    let products: [Product]
    
    private let columns = [
        GridItem(.adaptive(minimum: 160, maximum: 240))
    ]
    
    var body: some View {
        LazyVGrid(columns: columns, spacing: 16) {
            ForEach(products) { product in
                VStack(alignment: .leading, spacing: 8) {
                    AsyncImage(url: product.imageURL)
                        .aspectRatio(1, contentMode: .fit)
                        .cornerRadius(8)
                    
                    Text(product.name)
                        .font(.headline)
                        .lineLimit(2)
                    
                    Text("$\\(product.price, format: .currency(code: \"USD\"))")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(12)
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(radius: 2)
            }
        }
        .padding()
        .navigationTitle("Products")
    }
}
```

**TachUI:**
```typescript
import { LazyVGrid, GridItem, VStack, Image, Text } from '@tachui/core'

interface Product {
  id: string
  name: string
  price: number
  imageURL: string
}

const ProductGrid = (products: Product[]) => {
  const columns = [
    GridItem.adaptive(160, 240)
  ]
  
  return LazyVGrid({
    columns: columns,
    spacing: 16,
    accessibility: GridAccessibility.basic('Products Grid'),
    animations: GridAnimations.fadeIn(200),
    children: products.map(product => 
      VStack([
        Image({ src: product.imageURL, alt: product.name })
          .aspectRatio(1, 'fit')
          .cornerRadius(8)
          ,
        
        Text(product.name)
          .fontSize(16)
          .fontWeight('bold')
          .lineClamp(2)
          ,
        
        Text(`$${product.price.toFixed(2)}`)
          .fontSize(14)
          .foregroundColor('#666666')
          
      ])
      .padding(12)
      .backgroundColor('#ffffff')
      .cornerRadius(12)
      .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
      
    )
  })
    .padding(16)
    
}
```

This migration maintains SwiftUI's declarative approach while leveraging TachUI's web-specific enhancements like accessibility, animations, and CSS Grid performance.