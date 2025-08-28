# Advanced Grid Patterns & Responsive Design

This guide covers advanced patterns, responsive design strategies, and best practices for creating sophisticated grid layouts with TachUI's Grid components.

## Responsive Design Patterns

### 1. Adaptive Content Cards

Create cards that automatically adjust their size and layout based on screen size:

```typescript
import { LazyVGrid, GridItem, VStack, Image, Text, Button } from '@tachui/core'

const ResponsiveCards = LazyVGrid({
  columns: [
    GridItem.adaptive(280, 400) // Min 280px, max 400px per card
  ],
  spacing: 20,
  accessibility: GridAccessibility.basic('Responsive Card Grid'),
  children: articles.map(article => 
    VStack([
      Image({ src: article.thumbnail, alt: article.title })
        .modifier
        .aspectRatio(16/9, 'fill')
        .cornerRadius(12, [true, true, false, false]) // Top corners only
        .build(),
      
      VStack([
        Text(article.category)
          .modifier
          .fontSize(12)
          .fontWeight('bold')
          .foregroundColor('#007bff')
          .textTransform('uppercase')
          .build(),
        
        Text(article.title)
          .modifier
          .fontSize(18)
          .fontWeight('bold')
          .lineClamp(2)
          .marginVertical(8)
          .build(),
        
        Text(article.excerpt)
          .modifier
          .fontSize(14)
          .foregroundColor('#666666')
          .lineClamp(3)
          .marginBottom(16)
          .build(),
        
        Button({
          title: 'Read More',
          onTap: () => navigation.push(article.url)
        })
          .modifier
          .backgroundColor('#007bff')
          .foregroundColor('#ffffff')
          .padding(12, 24)
          .cornerRadius(6)
          .build()
      ])
      .modifier
      .padding(16)
      .build()
    ])
    .modifier
    .backgroundColor('#ffffff')
    .cornerRadius(12)
    .shadow({ x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.1)' })
    .build()
  )
})
  .modifier
  .responsive()
  .small({ padding: 12 })    // Mobile: smaller padding
  .medium({ padding: 16 })   // Tablet: medium padding
  .large({ padding: 24 })    // Desktop: larger padding
  .build()
```

### 2. Progressive Enhancement Grid

Start with a single column on mobile, then progressively add more columns:

```typescript
const ProgressiveGrid = LazyVGrid({
  columns: [
    // Mobile: 1 column
    GridItem.flexible(),
    
    // Tablet: 2 columns  
    GridItem.flexible(),
    
    // Desktop: 3 columns
    GridItem.flexible()
  ],
  spacing: 16,
  children: items
})
  .modifier
  .responsive()
  .small({
    // Mobile: Force single column by hiding extra columns
    css: { 'grid-template-columns': '1fr' }
  })
  .medium({
    // Tablet: Show 2 columns
    css: { 'grid-template-columns': 'repeat(2, 1fr)' }
  })
  .large({
    // Desktop: Show all 3 columns
    css: { 'grid-template-columns': 'repeat(3, 1fr)' }
  })
  .build()
```

### 3. Responsive Dashboard Layout

Complex dashboard that adapts its structure based on screen size:

```typescript
const ResponsiveDashboard = () => {
  // Different layouts for different screen sizes
  const mobileLayout = VStack([
    // Mobile: Stack everything vertically
    HeaderWidget(),
    StatsWidget(),
    ChartWidget(),
    RecentActivityWidget()
  ])

  const desktopLayout = Grid({
    children: [
      GridRow([
        Text('Dashboard')
          .modifier
          .gridColumnSpan(4)
          .fontSize(28)
          .fontWeight('bold')
          .padding(16)
          .build()
      ]),
      
      GridRow([
        // Sidebar
        VStack([
          NavigationWidget(),
          QuickActionsWidget()
        ])
        .modifier
        .gridRowSpan(2)
        .width(250)
        .backgroundColor('#f8f9fa')
        .padding(16)
        .build(),
        
        // Main stats
        LazyVGrid({
          columns: [GridItem.flexible(), GridItem.flexible(), GridItem.flexible()],
          children: [
            StatsCard('Users', '12,345', '+12%', '#28a745'),
            StatsCard('Revenue', '$45,678', '+8%', '#007bff'), 
            StatsCard('Orders', '1,234', '+15%', '#ffc107')
          ]
        }),
        
        // Recent activity
        RecentActivityWidget()
          .modifier
          .backgroundColor('#ffffff')
          .padding(16)
          .cornerRadius(8)
          .build()
      ]),
      
      GridRow([
        null, // Skip sidebar column
        ChartWidget()
          .modifier
          .gridColumnSpan(2)
          .build()
      ])
    ]
  })

  return Show({
    condition: useResponsive().isMobile,
    then: mobileLayout,
    else: desktopLayout
  })
}
```

### 4. Masonry-Style Grid

Create Pinterest-style layouts with varying item heights:

```typescript
const MasonryGrid = LazyVGrid({
  columns: [
    GridItem.adaptive(250, 350) // Responsive column count
  ],
  spacing: 16,
  styling: GridStyling.comprehensive({
    debug: false,
    interactive: true,
    card: false
  }),
  children: posts.map(post => {
    // Vary card heights based on content
    const contentHeight = calculateContentHeight(post)
    
    return VStack([
      post.image && Image({ src: post.image, alt: post.title })
        .modifier
        .aspectRatio(post.aspectRatio || 1.5, 'fill')
        .cornerRadius(8)
        .marginBottom(12)
        .build(),
      
      Text(post.title)
        .modifier
        .fontSize(16)
        .fontWeight('bold')
        .lineClamp(post.image ? 2 : 4)
        .marginBottom(8)
        .build(),
      
      Text(post.excerpt)
        .modifier
        .fontSize(14)
        .foregroundColor('#666666')
        .lineClamp(contentHeight > 200 ? 6 : 3)
        .marginBottom(12)
        .build(),
      
      HStack([
        Image({ src: post.author.avatar, alt: post.author.name })
          .modifier
          .frame(24, 24)
          .cornerRadius(12)
          .build(),
        
        Text(post.author.name)
          .modifier
          .fontSize(12)
          .foregroundColor('#666666')
          .build(),
        
        Spacer(),
        
        Text(post.date)
          .modifier
          .fontSize(12)
          .foregroundColor('#999999')
          .build()
      ])
    ])
    .modifier
    .padding(16)
    .backgroundColor('#ffffff')
    .cornerRadius(12)
    .shadow({ x: 0, y: 2, blur: 8, color: 'rgba(0,0,0,0.1)' })
    .build()
  })
})
```

## Complex Layout Patterns

### 1. Magazine Layout

Complex editorial layout with mixed content types:

```typescript
const MagazineLayout = LazyVGrid({
  columns: [
    GridItem.flexible(),
    GridItem.flexible(),
    GridItem.flexible(),
    GridItem.flexible()
  ],
  spacing: 16,
  children: [
    // Hero article (spans 2x2)
    HeroArticle(featuredArticle)
      .modifier
      .gridColumnSpan(2)
      .gridRowSpan(2)
      .build(),
    
    // Secondary articles (right column)
    ...secondaryArticles.slice(0, 2).map(article => 
      SecondaryArticle(article)
    ),
    
    // Ad banner (full width)
    AdBanner()
      .modifier
      .gridColumnSpan(4)
      .build(),
    
    // Regular articles (1 column each)
    ...regularArticles.map(article => 
      RegularArticle(article)
    ),
    
    // Newsletter signup (spans 2 columns)
    NewsletterSignup()
      .modifier
      .gridColumnSpan(2)
      .backgroundColor('#f8f9fa')
      .padding(24)
      .cornerRadius(8)
      .build(),
    
    // More regular articles
    ...moreArticles.map(article => 
      RegularArticle(article)
    )
  ]
})
```

### 2. E-commerce Product Grid

Advanced product grid with filters, sorting, and dynamic layouts:

```typescript
interface ProductGridState {
  viewMode: 'grid' | 'list'
  sortBy: string
  filters: FilterState
}

const ProductGrid = (products: Product[], state: ProductGridState) => {
  const getColumns = () => {
    switch (state.viewMode) {
      case 'list':
        return [GridItem.flexible()] // Single column for list view
      case 'grid':
      default:
        return [GridItem.adaptive(280, 320)] // Adaptive grid
    }
  }
  
  const renderProduct = (product: Product) => {
    if (state.viewMode === 'list') {
      // List view: horizontal layout
      return HStack([
        Image({ src: product.image, alt: product.name })
          .modifier
          .frame(120, 120)
          .cornerRadius(8)
          .build(),
        
        VStack([
          Text(product.name)
            .modifier
            .fontSize(18)
            .fontWeight('bold')
            .marginBottom(8)
            .build(),
          
          Text(product.description)
            .modifier
            .fontSize(14)
            .foregroundColor('#666666')
            .lineClamp(2)
            .marginBottom(8)
            .build(),
          
          HStack([
            Text(`$${product.price}`)
              .modifier
              .fontSize(16)
              .fontWeight('bold')
              .foregroundColor('#28a745')
              .build(),
            
            Spacer(),
            
            Button({
              title: 'Add to Cart',
              onTap: () => addToCart(product)
            })
              .modifier
              .backgroundColor('#007bff')
              .foregroundColor('#ffffff')
              .padding(8, 16)
              .cornerRadius(4)
              .build()
          ])
        ])
        .modifier
        .flex(1)
        .padding(16)
        .build()
      ])
      .modifier
      .backgroundColor('#ffffff')
      .cornerRadius(8)
      .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
      .build()
    } else {
      // Grid view: vertical card layout
      return VStack([
        Image({ src: product.image, alt: product.name })
          .modifier
          .aspectRatio(1, 'fill')
          .cornerRadius(8)
          .marginBottom(12)
          .build(),
        
        Text(product.name)
          .modifier
          .fontSize(16)
          .fontWeight('bold')
          .lineClamp(2)
          .marginBottom(8)
          .textAlign('center')
          .build(),
        
        Text(`$${product.price}`)
          .modifier
          .fontSize(18)
          .fontWeight('bold')
          .foregroundColor('#28a745')
          .marginBottom(12)
          .textAlign('center')
          .build(),
        
        Button({
          title: 'Add to Cart',
          onTap: () => addToCart(product)
        })
          .modifier
          .backgroundColor('#007bff')
          .foregroundColor('#ffffff')
          .padding(10, 20)
          .cornerRadius(4)
          .build()
      ])
      .modifier
      .padding(16)
      .backgroundColor('#ffffff')
      .cornerRadius(8)
      .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
      .build()
    }
  }
  
  return LazyVGrid({
    columns: getColumns(),
    spacing: state.viewMode === 'list' ? 12 : 16,
    accessibility: GridAccessibility.basic('Product Grid'),
    animations: GridAnimations.smoothLayout(300), // Animate view mode changes
    children: products.map(renderProduct)
  })
}
```

### 3. Timeline Grid

Horizontal scrolling timeline with responsive breakpoints:

```typescript
const TimelineGrid = LazyHGrid({
  rows: [
    GridItem.flexible(100, 150) // Flexible height between 100-150px
  ],
  spacing: 20,
  animations: GridAnimations.slideIn('left', 200),
  children: events.map((event, index) => 
    VStack([
      // Date indicator
      VStack([
        Text(event.date.day)
          .modifier
          .fontSize(24)
          .fontWeight('bold')
          .build(),
        
        Text(event.date.month)
          .modifier
          .fontSize(12)
          .textTransform('uppercase')
          .foregroundColor('#666666')
          .build()
      ])
      .modifier
      .padding(12)
      .backgroundColor('#f8f9fa')
      .cornerRadius(8)
      .marginBottom(12)
      .build(),
      
      // Event content
      VStack([
        Text(event.title)
          .modifier
          .fontSize(16)
          .fontWeight('bold')
          .lineClamp(2)
          .marginBottom(8)
          .build(),
        
        Text(event.description)
          .modifier
          .fontSize(14)
          .foregroundColor('#666666')
          .lineClamp(3)
          .build()
      ])
      .modifier
      .padding(16)
      .backgroundColor('#ffffff')
      .cornerRadius(8)
      .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
      .build()
    ])
    .modifier
    .minWidth(250)
    .maxWidth(300)
    .build()
  )
})
  .modifier
  .responsive()
  .small({
    // Mobile: Show fewer items, larger touch targets
    css: { 'min-width': '280px' }
  })
  .build()
```

## Performance Optimization Patterns

### 1. Virtual Scrolling for Large Datasets

```typescript
const VirtualizedGrid = (items: Item[], windowSize: number = 50) => {
  const [visibleItems, setVisibleItems] = useState<Item[]>([])
  const [startIndex, setStartIndex] = useState(0)
  
  // Calculate which items are visible
  useEffect(() => {
    const start = Math.max(0, startIndex - 10) // Buffer
    const end = Math.min(items.length, startIndex + windowSize + 10)
    setVisibleItems(items.slice(start, end))
  }, [startIndex, items, windowSize])
  
  return LazyVGrid({
    columns: [GridItem.adaptive(250, 350)],
    spacing: 16,
    children: visibleItems.map(item => ItemComponent(item))
  })
    .modifier
    .onScroll((event) => {
      // Update visible window based on scroll position
      const scrollTop = event.target.scrollTop
      const itemHeight = 300 // Approximate item height
      const newStartIndex = Math.floor(scrollTop / itemHeight)
      setStartIndex(newStartIndex)
    })
    .build()
}
```

### 2. Lazy Loading with Intersection Observer

```typescript
const LazyLoadingGrid = (items: Item[]) => {
  const [loadedItems, setLoadedItems] = useState<Item[]>(items.slice(0, 20))
  const [isLoading, setIsLoading] = useState(false)
  
  const loadMoreItems = useCallback(async () => {
    if (isLoading) return
    
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setLoadedItems(prev => [
      ...prev,
      ...items.slice(prev.length, prev.length + 20)
    ])
    setIsLoading(false)
  }, [items, isLoading])
  
  return LazyVGrid({
    columns: [GridItem.adaptive(200, 300)],
    spacing: 16,
    children: [
      ...loadedItems.map(item => ItemComponent(item)),
      
      // Loading indicator
      isLoading && LoadingSpinner()
        .modifier
        .gridColumnSpan(3)
        .padding(20)
        .textAlign('center')
        .build()
    ].filter(Boolean)
  })
    .modifier
    .onScroll((event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.target
      
      // Load more when near bottom
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMoreItems()
      }
    })
    .build()
}
```

### 3. Responsive Image Loading

```typescript
const ResponsiveImageGrid = (images: ImageData[]) => {
  return LazyVGrid({
    columns: [GridItem.adaptive(200, 400)],
    spacing: 12,
    children: images.map(image => 
      Image({
        // Responsive images based on container size
        src: image.src,
        srcSet: `
          ${image.thumbnails.small} 200w,
          ${image.thumbnails.medium} 400w,
          ${image.thumbnails.large} 600w
        `,
        sizes: `
          (max-width: 600px) 200px,
          (max-width: 1200px) 400px,
          600px
        `,
        alt: image.alt,
        loading: 'lazy'
      })
      .modifier
      .aspectRatio(image.aspectRatio || 1, 'fill')
      .cornerRadius(8)
      .build()
    )
  })
}
```

## Animation Patterns

### 1. Staggered Entrance Animations

```typescript
const StaggeredGrid = LazyVGrid({
  columns: [GridItem.adaptive(250, 350)],
  spacing: 16,
  children: items.map((item, index) => 
    ItemComponent(item)
      .modifier
      .opacity(0)
      .transform(`translateY(20px)`)
      .animation({
        keyframes: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        duration: 300,
        easing: 'ease-out',
        delay: index * 50 // Stagger by 50ms per item
      })
      .build()
  )
})
```

### 2. Filter Transition Animations

```typescript
const FilterableGrid = (items: Item[], activeFilter: string) => {
  const filteredItems = items.filter(item => 
    activeFilter === 'all' || item.category === activeFilter
  )
  
  return LazyVGrid({
    columns: [GridItem.adaptive(250, 350)],
    spacing: 16,
    animations: GridAnimations.comprehensive(200, 300),
    children: filteredItems.map(item => 
      ItemComponent(item)
        .modifier
        // Fade in filtered items
        .animation({
          keyframes: {
            '0%': { opacity: '0', transform: 'scale(0.95)' },
            '100%': { opacity: '1', transform: 'scale(1)' }
          },
          duration: 250,
          easing: 'ease-out'
        })
        .build()
    )
  })
}
```

## Accessibility Patterns

### 1. Keyboard Navigation Grid

```typescript
const AccessibleGrid = LazyVGrid({
  columns: [GridItem.adaptive(250, 350)],
  spacing: 16,
  accessibility: {
    label: 'Product Grid',
    description: 'Grid of product cards. Use arrow keys to navigate.',
    role: 'grid',
    keyboardNavigation: {
      enabled: true,
      mode: 'grid', // 2D navigation with arrow keys
      pageNavigation: true, // Page Up/Down support
      homeEndNavigation: true // Home/End key support
    },
    screenReader: {
      enabled: true,
      announceChanges: true,
      announceStructure: true,
      announcePositions: true
    },
    focusManagement: {
      enabled: true,
      trapFocus: false,
      restoreFocus: true
    }
  },
  children: products.map((product, index) => 
    ProductCard(product)
      .modifier
      .tabIndex(0)
      .aria({
        'aria-rowindex': Math.floor(index / 3) + 1,
        'aria-colindex': (index % 3) + 1,
        'aria-describedby': `product-${product.id}-desc`
      })
      .onKeyDown((event) => {
        // Custom keyboard handlers for complex interactions
        if (event.key === 'Enter' || event.key === ' ') {
          viewProduct(product)
        }
      })
      .build()
  )
})
```

### 2. Screen Reader Optimized Grid

```typescript
const ScreenReaderGrid = LazyVGrid({
  columns: [GridItem.adaptive(200, 300)],
  accessibility: GridAccessibility.screenReader('Article Grid'),
  children: articles.map((article, index) => 
    VStack([
      Text(`Article ${index + 1} of ${articles.length}`)
        .modifier
        .fontSize(0) // Visually hidden but available to screen readers
        .aria({ 'aria-hidden': false })
        .build(),
      
      Text(article.title)
        .modifier
        .fontSize(18)
        .fontWeight('bold')
        .marginBottom(8)
        .build(),
      
      Text(article.summary)
        .modifier
        .fontSize(14)
        .foregroundColor('#666666')
        .lineClamp(3)
        .build()
    ])
    .modifier
    .aria({
      role: 'article',
      'aria-labelledby': `article-${article.id}-title`,
      'aria-describedby': `article-${article.id}-summary`
    })
    .build()
  )
})
```

These patterns provide a comprehensive foundation for building sophisticated, responsive, and accessible grid layouts with TachUI's Grid components. Each pattern can be combined and customized based on specific use cases and requirements.