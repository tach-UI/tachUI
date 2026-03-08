# Layout Components

TachUI's layout system provides SwiftUI-inspired containers for organizing your UI. Build complex layouts using familiar VStack, HStack, ZStack, ScrollView, and List components.

## Overview

Import layout components from `@tachui/core`:

```typescript
// SwiftUI-aligned direct imports (recommended)
import { 
  VStack, HStack, ZStack,
  Spacer,
  ScrollView, 
  List, 
  ForEach 
} from '@tachui/core'

// Layout namespace (legacy - use direct imports above instead)
import { 
  Layout, 
  ScrollView, 
  List, 
  ForEach 
} from '@tachui/core'

// Simple HTML elements (for basic use cases)
import { HTML } from '@tachui/core'
```

## Component Types

TachUI provides two types of components for different use cases:

### 🎨 **Enhanced SwiftUI Components** (Recommended)
These are full-featured, SwiftUI-inspired components with advanced capabilities:

- **Button**: Press states, variants, accessibility, haptic feedback
- **Image**: Loading states, content modes, progressive loading, visual effects
- **Text**: Typography presets, text formatting, line limits, accessibility
- **TextField**: Validation, formatting, keyboard types, auto-complete

### 🏗️ **Simple HTML Elements** (Basic Use Cases)
These are lightweight wrappers around HTML elements for simple needs:

- **HTML.button**: Basic button with onClick support
- **HTML.img**: Simple image with src, alt, width, height
- **HTML.div/span/p**: Basic containers and text elements
- **HTML.input**: Basic form input

**When to use which:**
- Use **enhanced components** for interactive, styled UI elements
- Use **HTML elements** for simple containers, basic images, or when you need fine-grained HTML control

## Stack Layouts

### VStack (Vertical Stack)

Arranges child components vertically with consistent spacing and alignment.

**SwiftUI-aligned syntax (recommended):**
```typescript
VStack({
  children: [
    Text("Header"),
    Text("Content"), 
    Button("Action", () => {})
  ],
  spacing: 16,
  alignment: 'center'
})
.padding(20)
.backgroundColor('#ffffff')
.cornerRadius(12)

```

**Legacy namespace syntax (deprecated):**
```typescript
// ❌ Deprecated - use VStack() directly instead
VStack({
  children: [
    Text("Header"),
    Text("Content"), 
    Button("Action", () => {})
  ],
  spacing: 16,
  alignment: 'center'
})
.padding(20)
.backgroundColor('#ffffff')
.cornerRadius(12)

```

**VStack Properties:**
- `children: ComponentInstance[]` - Array of child components
- `spacing: number` - Space between children (default: 0)
- `alignment: 'leading' | 'center' | 'trailing'` - Horizontal alignment

### HStack (Horizontal Stack)

Arranges child components horizontally.

**SwiftUI-aligned syntax (recommended):**
```typescript
HStack({
  children: [
    Image("/avatar.jpg")
      .width(40)
      .height(40)
      .cornerRadius(20)
      ,
      
    VStack({
      children: [
        Text("John Doe"),
        Text("Software Developer")
      ],
      spacing: 2,
      alignment: 'leading'
    }),
    
    Button("Follow", handleFollow)
  ],
  spacing: 12,
  alignment: 'center'
})
```

**Legacy namespace syntax (deprecated):**
```typescript
// ❌ Deprecated - use HStack() and VStack() directly instead
HStack({
  children: [
    Image("/avatar.jpg")
      .width(40)
      .height(40)
      .cornerRadius(20)
      ,
      
    VStack({
      children: [
        Text("John Doe"),
        Text("Software Developer")
      ],
      spacing: 2,
      alignment: 'leading'
    }),
    
    Button("Follow", handleFollow)
  ],
  spacing: 12,
  alignment: 'center'
})
```

**HStack Properties:**
- `children: ComponentInstance[]` - Array of child components  
- `spacing: number` - Space between children (default: 0)
- `alignment: 'top' | 'center' | 'bottom' | 'leading' | 'trailing' | 'left' | 'right'` - Vertical alignment (top/center/bottom) or horizontal alignment (leading/trailing/left/right)

### ZStack (Z-Index Stack)

Layers child components on top of each other.

**SwiftUI-aligned syntax (recommended):**
```typescript
ZStack({
  children: [
    // Background
    Image("/hero-bg.jpg")
      .width('100%')
      .height(300)
      .contentMode('cover')
      ,
      
    // Overlay content
    VStack({
      children: [
        Text("Welcome")
          .fontSize(32)
          .fontWeight('bold')
          .foregroundColor('#ffffff')
          ,
          
        Text("Get started today")
          .fontSize(18)
          .foregroundColor('#ffffff')
          .opacity(0.9)
          
      ],
      spacing: 8,
      alignment: 'center'
    })
  ],
  alignment: 'center'  
})
```

**Legacy namespace syntax (deprecated):**
```typescript
// ❌ Deprecated - use ZStack() and VStack() directly instead
Layout.ZStack({
  children: [
    // Background
    Image("/hero-bg.jpg")
      .width('100%')
      .height(300)
      .contentMode('cover')
      ,
      
    // Overlay content
    VStack({
      children: [
        Text("Welcome")
          .fontSize(32)
          .fontWeight('bold')
          .foregroundColor('#ffffff')
          ,
          
        Text("Get started today")
          .fontSize(18)
          .foregroundColor('#ffffff')
          .opacity(0.9)
          
      ],
      spacing: 8,
      alignment: 'center'
    })
  ],
  alignment: 'center'  
})
```

**ZStack Properties:** 
- `children: ComponentInstance[]` - Array of child components
- `alignment: 'topLeading' | 'top' | 'topTrailing' | 'leading' | 'center' | 'trailing' | 'bottomLeading' | 'bottom' | 'bottomTrailing'`

### Layout Priority

Control how components expand within stacks using `layoutPriority`:

**SwiftUI-aligned syntax (recommended):**
```typescript
HStack({
  children: [
    Text("Fixed")
      .layoutPriority(0) // Fixed size
      ,
      
    Text("Flexible")
      .layoutPriority(1) // Expands to fill space
      ,
      
    Button("Action", handleAction)
      .layoutPriority(0) // Fixed size
      
  ],
  spacing: 12
})
```

**Legacy namespace syntax (deprecated):**
```typescript
// ❌ Deprecated - use HStack() directly instead
HStack({
  children: [
    Text("Fixed")
      .layoutPriority(0) // Fixed size
      ,
      
    Text("Flexible")
      .layoutPriority(1) // Expands to fill space
      ,
      
    Button("Action", handleAction)
      .layoutPriority(0) // Fixed size
      
  ],
  spacing: 12
})
```

## Spacer Component

The Spacer component fills available space in stack layouts, pushing other components apart. Inspired by SwiftUI's Spacer, it's essential for flexible layouts and proper spacing distribution.

### Basic Usage

```typescript
// Simple spacer that fills all available space
HStack({
  children: [
    Text("Left"),
    Spacer(),
    Text("Right")
  ]
})
```

### With Minimum Length

```typescript
// Spacer with minimum space requirement
VStack({
  children: [
    Text("Header"),
    Spacer(50), // Minimum 50px
    Text("Footer")
  ]
})
```

### Advanced Configuration

```typescript
// Spacer with custom properties
Spacer({
  minLength: 20  // Minimum 20px in main axis direction
})
.backgroundColor('rgba(255, 0, 0, 0.1)') // Debug visualization

```

### Spacer Properties

- `minLength?: number` - Minimum space along the main axis (default: 0)

### Layout Behavior

The Spacer component uses CSS flexbox properties to expand:

- **flex-grow: 1** - Expands to fill available space
- **flex-shrink: 1** - Can shrink when space is limited  
- **flex-basis: 0** - Starts with no initial size
- **align-self: stretch** - Fills cross-axis when possible

### Common Patterns

**Push to edges:**
```typescript
HStack({
  children: [
    Button("Cancel", handleCancel),
    Spacer(),
    Button("Save", handleSave)
  ]
})
```

**Center with equal spacing:**
```typescript
HStack({
  children: [
    Spacer(),
    Text("Centered Content"),
    Spacer()
  ]
})
```

**Multiple spacers for distribution:**
```typescript
HStack({
  children: [
    Button("1", action1),
    Spacer(),
    Button("2", action2),
    Spacer(),
    Button("3", action3)
  ]
})
```

### Best Practices

1. **Use in stacks** - Spacer only works within VStack, HStack, or ZStack
2. **Minimum lengths** - Set `minLength` when you need guaranteed spacing
3. **Visual debugging** - Add background color during development to see spacer areas
4. **Performance** - Spacers are lightweight and don't impact performance

### Integration with Modifiers

Like all TachUI components, Spacer supports the full modifier system:

```typescript
Spacer()
  .backgroundColor('#f0f0f0')
  .cornerRadius(4)
  .margin({ horizontal: 8 })
  
```

## ScrollView Component

Create scrollable content areas with pull-to-refresh and infinite scroll support.

### Basic ScrollView

```typescript
ScrollView({
  children: [
    Text("Item 1"),
    Text("Item 2"), 
    Text("Item 3"),
    // ... many more items
  ]
})
.height(400)
.backgroundColor('#ffffff')

```

### Horizontal ScrollView

```typescript
ScrollView({
  children: [
    Image("/photo1.jpg"),
    Image("/photo2.jpg"),
    Image("/photo3.jpg")
  ],
  direction: 'horizontal',
  showsScrollIndicator: true
})
.height(200)

```

### Pull to Refresh

```typescript
const [isRefreshing, setIsRefreshing] = createSignal(false)

ScrollView({
  children: articleComponents,
  refreshControl: {
    enabled: true,
    refreshing: isRefreshing,
    onRefresh: async () => {
      setIsRefreshing(true)
      try {
        await loadNewArticles()
      } finally {
        setIsRefreshing(false)
      }
    },
    tintColor: '#007AFF'
  }
})
```

### ScrollView with Events

```typescript
const [scrollPosition, setScrollPosition] = createSignal({ x: 0, y: 0 })

ScrollView({
  children: contentComponents,
  onScroll: (info) => {
    setScrollPosition({ x: info.contentOffset.x, y: info.contentOffset.y })
  },
  onReachBottom: () => {
    console.log("Reached bottom - load more content")
  },
  scrollEventThrottle: 16
})
```

### ScrollView Properties

```typescript
interface ScrollViewProps {
  // Content
  children?: ComponentInstance[]
  
  // Scroll behavior
  direction?: 'vertical' | 'horizontal' | 'both'
  showsScrollIndicator?: boolean
  bounces?: boolean
  scrollEnabled?: boolean | Signal<boolean>
  
  // Pull to refresh
  refreshControl?: {
    enabled: boolean
    onRefresh: () => Promise<void>
    refreshing?: Signal<boolean>
    threshold?: number
    tintColor?: string
  }
  
  // Events
  onScroll?: (info: ScrollEventInfo) => void
  onScrollBegin?: () => void
  onScrollEnd?: () => void
  onReachTop?: () => void
  onReachBottom?: () => void
  
  // Performance
  scrollEventThrottle?: number
  decelerationRate?: 'normal' | 'fast' | number
  
  // Snap behavior
  pagingEnabled?: boolean
  snapToAlignment?: 'start' | 'center' | 'end'
  snapToInterval?: number
}
```

## List Component

Efficiently render large datasets with virtual scrolling, selection, and swipe actions.

### Basic List

```typescript
const todos = State([
  { id: '1', text: 'Buy groceries', completed: false },
  { id: '2', text: 'Walk the dog', completed: true },
  { id: '3', text: 'Write code', completed: false }
])

List({
  data: todos.projectedValue,
  renderItem: (todo, index) => 
    HStack({
      children: [
        Button(todo.completed ? "✅" : "⬜", () => {
          // Toggle completion
          todos.wrappedValue = todos.wrappedValue.map(t =>
            t.id === todo.id ? { ...t, completed: !t.completed } : t
          )
        }),
        
        Text(todo.text)
          .fontSize(16)
          .foregroundColor(todo.completed ? '#999' : '#333')
          .textDecoration(todo.completed ? 'line-through' : 'none')
          
      ],
      spacing: 12,
      alignment: 'center'
    })
    .padding(16)
    .backgroundColor('#ffffff')
    .borderBottom(1, '#f0f0f0')
    ,
    
  getItemId: (todo) => todo.id,
  onItemTap: (todo) => console.log("Tapped:", todo.text)
})
```

### Sectioned List

```typescript
const sections = State([
  {
    title: "Today",
    data: [
      { id: '1', text: 'Morning meeting', time: '9:00 AM' },
      { id: '2', text: 'Lunch with team', time: '12:30 PM' }
    ]
  },
  {
    title: "Tomorrow", 
    data: [
      { id: '3', text: 'Project review', time: '10:00 AM' }
    ]
  }
])

List({
  sections: sections.projectedValue,
  renderItem: (item, index) =>
    HStack({
      children: [
        VStack({
          children: [
            Text(item.text),
            Text(item.time)
              .fontSize(14)
              .foregroundColor('#666')
                
          ],
          spacing: 4,
          alignment: 'leading'
        })
      ]
    }),
    
  renderSectionHeader: (section, index) =>
    Text(section.title)
      .fontSize(18)
      .fontWeight('600')
      .padding(16, 12)
      .backgroundColor('#f8f9fa')
      
})
```

### List with Selection

```typescript
const [selectedItems, setSelectedItems] = createSignal(new Set())

List({
  data: items.projectedValue,
  selectionMode: 'multiple',
  selectedItems: selectedItems,
  onSelectionChange: setSelectedItems,
  renderItem: (item, index) => {
    const isSelected = selectedItems().has(item.id)
    
    return HStack({
      children: [
        Button(isSelected ? "✅" : "⬜", () => {
          const newSelection = new Set(selectedItems())
          if (isSelected) {
            newSelection.delete(item.id)
          } else {
            newSelection.add(item.id)
          }
          setSelectedItems(newSelection)
        }),
        
        Text(item.name)
      ]
    })
  }
})
```

### Swipe Actions

```typescript
List({
  data: emails.projectedValue,
  renderItem: (email, index) =>
    EmailRow(email),
    
  trailingSwipeActions: (email, index) => [
    {
      title: "Archive",
      backgroundColor: '#007AFF',
      action: () => archiveEmail(email.id)
    },
    {
      title: "Delete",
      backgroundColor: '#ff3b30', 
      action: () => deleteEmail(email.id)
    }
  ],
  
  leadingSwipeActions: (email, index) => [
    {
      title: "Mark Read",
      backgroundColor: '#34c759',
      action: () => markAsRead(email.id)
    }
  ]
})
```

### Virtual Scrolling

For large datasets, enable virtual scrolling for optimal performance:

```typescript
const [items, setItems] = createSignal(generateLargeDataset(10000))

List({
  data: items,
  renderItem: (item, index) => ListItemComponent(item),
  virtualScrolling: {
    enabled: true,
    itemHeight: 60, // Fixed height for better performance
    overscan: 5 // Render extra items for smooth scrolling
  }
})
```

### ForEach Component

For simpler iteration without the full List features:

```typescript
ForEach({
  data: colors.projectedValue,
  children: (color, index) =>
    HStack({
      children: [
        HTML.div()
          .width(20)
          .height(20)
          .backgroundColor(color.hex)
          .cornerRadius(4)
          ,
          
        Text(color.name)
      ],
      spacing: 12
    })
})
```

### List Properties

```typescript
interface ListProps<T> {
  // Data
  data?: T[] | Signal<T[]>
  sections?: ListSection<T>[] | Signal<ListSection<T>[]>
  
  // Rendering
  renderItem: (item: T, index: number) => ComponentInstance
  renderSectionHeader?: (section: ListSection<T>, index: number) => ComponentInstance
  renderSectionFooter?: (section: ListSection<T>, index: number) => ComponentInstance
  
  // Appearance
  style?: 'plain' | 'grouped' | 'inset' | 'sidebar'
  separator?: boolean | ComponentInstance
  
  // Selection
  selectionMode?: 'none' | 'single' | 'multiple'
  selectedItems?: Signal<Set<string | number>>
  onSelectionChange?: (selectedItems: Set<string | number>) => void
  
  // Actions
  leadingSwipeActions?: (item: T, index: number) => SwipeAction[]
  trailingSwipeActions?: (item: T, index: number) => SwipeAction[]
  onItemTap?: (item: T, index: number) => void
  onItemLongPress?: (item: T, index: number) => void
  
  // Performance
  virtualScrolling?: VirtualScrollConfig
  getItemId?: (item: T, index: number) => string | number
  
  // States
  emptyState?: ComponentInstance
  isLoading?: boolean | Signal<boolean>
  loadingIndicator?: ComponentInstance
  
  // Infinite scroll
  onLoadMore?: () => Promise<void>
  hasMore?: boolean | Signal<boolean>
}
```

## Complex Layout Examples

### Card Grid Layout

```typescript
function CardGrid({ items }) {
  return VStack({
    children: [
      // Create rows of cards
      ...chunkArray(items, 2).map(rowItems =>
        HStack({
          children: rowItems.map(item =>
            ItemCard(item)
              .frame({ flex: 1 })
              
          ),
          spacing: 16,
          alignment: 'top'
        })
      )
    ],
    spacing: 16
  })
  .padding(16)
  
}
```

### Sidebar Layout

```typescript
function SidebarLayout({ sidebar, content }) {
  return HStack({
    children: [
      // Sidebar
      VStack({
        children: sidebar
      })
      .width(250)
      .backgroundColor('#f8f9fa')
      .padding(16)
      ,
      
      // Main content
      VStack({
        children: content  
      })
      .frame({ flex: 1 })
      .padding(24)
      
    ],
    spacing: 0,
    alignment: 'top'
  })
}
```

### Responsive Layout

```typescript
function ResponsiveLayout({ children }) {
  const [windowWidth, setWindowWidth] = createSignal(window.innerWidth)
  
  // Listen for resize events
  createEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  })
  
  const isMobile = () => windowWidth() < 768
  
  return isMobile() ?
    // Mobile: Stack vertically
    VStack({
      children: children,
      spacing: 16
    }) :
    // Desktop: Side by side  
    HStack({
      children: children,
      spacing: 24,
      alignment: 'top'
    })
}
```

## Layout Best Practices  

### 1. Use Semantic Spacing

```typescript
// ✅ Good - Consistent spacing scale
VStack({
  children: components,
  spacing: 16 // Use 4, 8, 12, 16, 24, 32...
})

// ❌ Avoid - Random spacing values
VStack({ 
  children: components,
  spacing: 13 // Inconsistent
})
```

### 2. Consider Content Flow

```typescript
// ✅ Good - Logical content hierarchy
VStack({
  children: [
    HeaderComponent(),
    MainContentComponent(), 
    FooterComponent()
  ],
  spacing: 24,
  alignment: 'stretch'
})
```

### 3. Use Layout Priority Effectively

```typescript
// ✅ Good - Flexible layouts
HStack({
  children: [
    SidebarComponent()
      .layoutPriority(0) // Fixed width
      ,
      
    MainContentComponent()
      .layoutPriority(1) // Fills remaining space
      
  ]
})
```

### 4. Optimize List Performance

```typescript
// ✅ Good - Virtual scrolling for large lists
List({
  data: largeDataset,
  renderItem: ItemComponent,
  virtualScrolling: { enabled: true, itemHeight: 60 },
  getItemId: (item) => item.id // Stable keys
})

// ❌ Avoid - Rendering thousands of items at once
VStack({
  children: largeDataset.map(item => ItemComponent(item))
})
```

### 5. Handle Empty States

```typescript
// ✅ Good - Proper empty state handling
List({
  data: items.projectedValue,
  renderItem: ItemComponent,
  emptyState: 
    VStack({
      children: [
        Text("No items found"),
        Button("Add Item", handleAddItem)
      ],
      spacing: 16,
      alignment: 'center'
    })
    .padding(40)
    
})
```

## Performance Tips

1. **Use virtual scrolling** for lists with 100+ items
2. **Set stable keys** with `getItemId` for efficient updates
3. **Minimize nested stacks** - flatten layouts where possible
4. **Use layout priority** instead of fixed widths for responsive design
5. **Lazy load content** in ScrollViews for better initial performance

## Next Steps

- Learn about [State Management](/guide/state-management) for data flow
- Explore [Navigation](/guide/navigation) for multi-screen apps
- Check out [Examples](/examples/) for complete layout patterns
