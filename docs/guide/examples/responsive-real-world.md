# Real-World Responsive Applications

This guide demonstrates complete responsive applications built with TachUI, showcasing practical patterns and best practices for production applications.

## 1. Blog Application

A complete responsive blog with header, navigation, article content, and sidebar.

### Blog Layout Structure

```typescript
import { 
  VStack, HStack, Text, Button, Image, Link,
  ResponsiveContainerPatterns, ResponsiveGridPatterns,
  useBreakpoint, ResponsiveDevTools
} from '@tachui/core'

// Main blog application
const BlogApp = () => {
  return VStack([
    BlogHeader(),
    BlogNavigation(),
    BlogMainContent(),
    BlogFooter()
  ])
  .responsive({
    base: { minHeight: '100vh', backgroundColor: '#f8f9fa' },
    md: { backgroundColor: '#ffffff' }
  })
  
}
```

### Responsive Header

```typescript
const BlogHeader = () => {
  const bp = useBreakpoint()
  const isMobile = bp.isBelow('md')()

  return HStack([
    // Logo
    HStack([
      Image('/logo.svg')
        .responsive({
          base: { width: 32, height: 32 },
          md: { width: 40, height: 40 }
        })
        ,
      
      Text("TechBlog")
        .responsive({
          base: { 
            fontSize: 20, 
            fontWeight: 'bold',
            color: '#2c3e50'
          },
          md: { 
            fontSize: 24
          }
        })
        
    ])
    .alignItems('center')
    .gap({ base: 8, md: 12 })
    ,
    
    // Desktop Navigation
    HStack([
      Link("Home").fontSize(16).color('#2c3e50'),
      Link("Articles").fontSize(16).color('#2c3e50'),
      Link("About").fontSize(16).color('#2c3e50'),
      Link("Contact").fontSize(16).color('#2c3e50')
    ])
    .responsive({
      base: { display: 'none' },     // Hidden on mobile
      md: { display: 'flex', gap: 32 }
    })
    ,
    
    // Mobile Menu Button
    Button("☰")
      .responsive({
        base: { 
          display: 'flex',
          padding: 8,
          backgroundColor: 'transparent',
          fontSize: 20
        },
        md: { display: 'none' }       // Hidden on desktop
      })
      
  ])
  .justifyContent('space-between')
  .alignItems('center')
  .responsive({
    base: { 
      padding: 16,
      borderBottom: '1px solid #e9ecef'
    },
    md: { 
      padding: '20px 32px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  })
  .backgroundColor('#ffffff')
  
}
```

### Article Grid with Sidebar

```typescript
const BlogMainContent = () => {
  const articles = [
    {
      id: 1,
      title: "Building Responsive Web Applications",
      excerpt: "Learn how to create applications that work on all devices...",
      image: "/article1.jpg",
      date: "2024-01-15",
      readTime: "5 min read"
    },
    // More articles...
  ]

  return ResponsiveContainerPatterns.contentContainer({
    maxWidth: { base: '100%', lg: '1200px' },
    padding: { base: 16, md: 24, lg: 32 }
  }).apply(
    HStack([
      // Main content area
      VStack([
        // Featured article
        FeaturedArticle(articles[0]),
        
        // Article grid
        ArticleGrid(articles.slice(1))
      ])
      .responsive({
        base: { width: '100%' },
        lg: { width: 'calc(75% - 2rem)' }
      })
      .gap({ base: 24, md: 32 })
      ,
      
      // Sidebar
      BlogSidebar()
        .responsive({
          base: { 
            display: 'none'           // Hidden on mobile
          },
          lg: { 
            display: 'block',
            width: 'calc(25% - 2rem)'
          }
        })
        
    ])
    .responsive({
      base: { flexDirection: 'column' },
      lg: { 
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '4rem'
      }
    })
    
  )
}

const FeaturedArticle = (article: Article) => {
  return VStack([
    Image(article.image)
      .responsive({
        base: { 
          width: '100%', 
          height: 200,
          objectFit: 'cover'
        },
        md: { 
          height: 300
        },
        lg: { 
          height: 400
        }
      })
      .borderRadius(12)
      ,
    
    VStack([
      Text(article.title)
        .responsive({
          base: { 
            fontSize: 24, 
            fontWeight: 'bold',
            lineHeight: 1.2,
            marginBottom: 12
          },
          md: { 
            fontSize: 32,
            marginBottom: 16
          },
          lg: { 
            fontSize: 36,
            marginBottom: 20
          }
        })
        .color('#2c3e50')
        ,
      
      Text(article.excerpt)
        .responsive({
          base: { 
            fontSize: 16, 
            lineHeight: 1.5,
            color: '#6c757d',
            marginBottom: 16
          },
          md: { 
            fontSize: 18,
            marginBottom: 20
          }
        })
        ,
      
      HStack([
        Text(article.date)
          .fontSize({ base: 14, md: 16 })
          .color('#6c757d')
          ,
        
        Text("•")
          .color('#6c757d')
          ,
        
        Text(article.readTime)
          .fontSize({ base: 14, md: 16 })
          .color('#6c757d')
          
      ])
      .gap(8)
      
    ])
    .padding({ base: 16, md: 20 })
    
  ])
  .backgroundColor('#ffffff')
  .borderRadius(16)
  .boxShadow('0 4px 12px rgba(0,0,0,0.1)')
  
}

const ArticleGrid = (articles: Article[]) => {
  const gridModifier = ResponsiveGridPatterns.autoFit({
    minColumnWidth: {
      base: '100%',        // Single column on mobile
      md: 'calc(50% - 1rem)', // Two columns on tablet
      lg: 'calc(33.333% - 1rem)' // Three columns on desktop
    },
    gap: { base: '1rem', md: '2rem' }
  })

  return VStack(
    articles.map(article => ArticleCard(article))
  )
  .apply(gridModifier)
  
}

const ArticleCard = (article: Article) => {
  return VStack([
    Image(article.image)
      .responsive({
        base: { width: '100%', height: 150 },
        md: { height: 180 },
        lg: { height: 200 }
      })
      .objectFit('cover')
      .borderRadius({ base: 8, md: 12 })
      ,
    
    VStack([
      Text(article.title)
        .responsive({
          base: { 
            fontSize: 18, 
            fontWeight: '600',
            lineHeight: 1.3,
            marginBottom: 8
          },
          md: { 
            fontSize: 20,
            marginBottom: 12
          }
        })
        .color('#2c3e50')
        ,
      
      Text(article.excerpt)
        .fontSize({ base: 14, md: 16 })
        .lineHeight(1.5)
        .color('#6c757d')
        .marginBottom({ base: 12, md: 16 })
        ,
      
      HStack([
        Text(article.date).fontSize(12).color('#6c757d'),
        Text("•").color('#6c757d'),
        Text(article.readTime).fontSize(12).color('#6c757d')
      ])
      .gap(6)
      
    ])
    .padding({ base: 12, md: 16 })
    
  ])
  .backgroundColor('#ffffff')
  .borderRadius({ base: 12, md: 16 })
  .boxShadow('0 2px 8px rgba(0,0,0,0.1)')
  
}
```

### Responsive Sidebar

```typescript
const BlogSidebar = () => {
  return VStack([
    // Search
    VStack([
      Text("Search")
        .fontSize(18)
        .fontWeight('600')
        .marginBottom(12)
        ,
      
      // Search input would go here
      Text("Search functionality...")
        .fontSize(14)
        .color('#6c757d')
        
    ])
    .padding(20)
    .backgroundColor('#ffffff')
    .borderRadius(12)
    .boxShadow('0 2px 8px rgba(0,0,0,0.1)')
    .marginBottom(24)
    ,
    
    // Categories
    VStack([
      Text("Categories")
        .fontSize(18)
        .fontWeight('600')
        .marginBottom(12)
        ,
      
      VStack([
        SidebarLink("Web Development", 23),
        SidebarLink("JavaScript", 18),
        SidebarLink("CSS", 15),
        SidebarLink("React", 12),
        SidebarLink("TypeScript", 8)
      ])
      .gap(8)
      
    ])
    .padding(20)
    .backgroundColor('#ffffff')
    .borderRadius(12)
    .boxShadow('0 2px 8px rgba(0,0,0,0.1)')
    
  ])
  
}

const SidebarLink = (title: string, count: number) => {
  return HStack([
    Text(title)
      .fontSize(14)
      .color('#2c3e50')
      ,
    
    Text(`(${count})`)
      .fontSize(12)
      .color('#6c757d')
      
  ])
  .justifyContent('space-between')
  .padding(8)
  .borderRadius(6)
  
}
```

## 2. E-Commerce Product Page

A responsive product page with image gallery, product details, and purchase options.

### Product Page Layout

```typescript
const ProductPage = ({ product }: { product: Product }) => {
  return ResponsiveContainerPatterns.contentContainer({
    maxWidth: { base: '100%', xl: '1200px' },
    padding: { base: 16, md: 24, lg: 32 }
  }).apply(
    VStack([
      // Breadcrumb navigation
      ProductBreadcrumb(product),
      
      // Main product content
      HStack([
        // Product images
        ProductImageGallery(product.images)
          .responsive({
            base: { width: '100%' },
            lg: { width: '55%' }
          })
          ,
        
        // Product details
        ProductDetails(product)
          .responsive({
            base: { width: '100%' },
            lg: { width: '40%' }
          })
          
      ])
      .responsive({
        base: { 
          flexDirection: 'column',
          gap: 24
        },
        lg: { 
          flexDirection: 'row',
          gap: 48,
          alignItems: 'flex-start'
        }
      })
      ,
      
      // Product tabs (description, reviews, etc.)
      ProductTabs(product)
    ])
    .gap({ base: 24, md: 32, lg: 40 })
    
  )
}
```

### Responsive Image Gallery

```typescript
const ProductImageGallery = (images: string[]) => {
  const [selectedImage, setSelectedImage] = createSignal(0)
  
  return VStack([
    // Main image
    Image(images[selectedImage()])
      .responsive({
        base: { 
          width: '100%', 
          height: 300,
          objectFit: 'cover'
        },
        sm: { 
          height: 400
        },
        md: { 
          height: 500
        },
        lg: { 
          height: 600
        }
      })
      .borderRadius(12)
      ,
    
    // Thumbnail navigation
    HStack(
      images.map((image, index) => 
        Image(image)
          .responsive({
            base: { 
              width: 60, 
              height: 60,
              objectFit: 'cover'
            },
            md: { 
              width: 80, 
              height: 80
            }
          })
          .borderRadius(8)
          .opacity(selectedImage() === index ? 1 : 0.6)
          .borderWidth(selectedImage() === index ? 2 : 0)
          .borderColor('#007bff')
          .onClick(() => setSelectedImage(index))
          
      )
    )
    .responsive({
      base: { 
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 8
      },
      md: { 
        gap: 12,
        justifyContent: 'center'
      }
    })
    .marginTop({ base: 12, md: 16 })
    
  ])
  
}
```

### Responsive Product Details

```typescript
const ProductDetails = (product: Product) => {
  return VStack([
    // Product title
    Text(product.name)
      .responsive({
        base: { 
          fontSize: 24, 
          fontWeight: 'bold',
          lineHeight: 1.2,
          marginBottom: 12
        },
        md: { 
          fontSize: 28,
          marginBottom: 16
        },
        lg: { 
          fontSize: 32,
          marginBottom: 20
        }
      })
      .color('#2c3e50')
      ,
    
    // Price
    HStack([
      Text(`$${product.price}`)
        .responsive({
          base: { fontSize: 28, fontWeight: 'bold' },
          md: { fontSize: 32 },
          lg: { fontSize: 36 }
        })
        .color('#e74c3c')
        ,
      
      ...(product.originalPrice ? [
        Text(`$${product.originalPrice}`)
          .fontSize({ base: 18, md: 20 })
          .color('#6c757d')
          .textDecoration('line-through')
          
      ] : [])
    ])
    .alignItems('baseline')
    .gap(12)
    .marginBottom({ base: 16, md: 20 })
    ,
    
    // Product description
    Text(product.description)
      .responsive({
        base: { 
          fontSize: 16, 
          lineHeight: 1.6,
          marginBottom: 20
        },
        md: { 
          fontSize: 18,
          marginBottom: 24
        }
      })
      .color('#495057')
      ,
    
    // Options (size, color, etc.)
    ProductOptions(product.options),
    
    // Purchase section
    VStack([
      // Quantity selector
      HStack([
        Text("Quantity:")
          .fontSize({ base: 16, md: 18 })
          .fontWeight('600')
          ,
        
        // Quantity controls would go here
        Text("1") // Placeholder
          .padding(8)
          .border('1px solid #dee2e6')
          .borderRadius(4)
          
      ])
      .alignItems('center')
      .gap(12)
      .marginBottom({ base: 16, md: 20 })
      ,
      
      // Add to cart button
      Button("Add to Cart")
        .responsive({
          base: { 
            width: '100%',
            padding: 16,
            fontSize: 16,
            fontWeight: 'bold'
          },
          md: { 
            padding: 18,
            fontSize: 18
          }
        })
        .backgroundColor('#007bff')
        .color('#ffffff')
        .borderRadius(8)
        .marginBottom({ base: 12, md: 16 })
        ,
      
      // Buy now button
      Button("Buy Now")
        .responsive({
          base: { 
            width: '100%',
            padding: 16,
            fontSize: 16,
            fontWeight: 'bold'
          },
          md: { 
            padding: 18,
            fontSize: 18
          }
        })
        .backgroundColor('#28a745')
        .color('#ffffff')
        .borderRadius(8)
        
    ])
    .padding({ base: 20, md: 24 })
    .backgroundColor('#f8f9fa')
    .borderRadius(12)
    
  ])
  .responsive({
    base: { padding: 0 },
    lg: { paddingLeft: 24 }
  })
  
}
```

## 3. Dashboard Application

A responsive admin dashboard with sidebar navigation, metrics cards, and data tables.

### Dashboard Layout

```typescript
const DashboardApp = () => {
  const [sidebarOpen, setSidebarOpen] = createSignal(false)
  const bp = useBreakpoint()
  const isMobile = bp.isBelow('lg')()

  return HStack([
    // Sidebar
    DashboardSidebar(sidebarOpen, setSidebarOpen)
      .responsive({
        base: { 
          position: 'fixed',
          left: sidebarOpen() ? 0 : -280,
          top: 0,
          height: '100vh',
          width: 280,
          zIndex: 1000,
          transition: 'left 0.3s ease'
        },
        lg: { 
          position: 'static',
          width: 250,
          height: '100vh'
        }
      })
      ,
    
    // Main content
    VStack([
      // Top bar
      DashboardTopBar(setSidebarOpen),
      
      // Main dashboard content
      DashboardContent()
    ])
    .responsive({
      base: { width: '100%' },
      lg: { width: 'calc(100% - 250px)' }
    })
    
  ])
  .backgroundColor('#f8f9fa')
  
}
```

### Responsive Metrics Cards

```typescript
const MetricsGrid = () => {
  const metrics = [
    { title: "Total Revenue", value: "$12,345", change: "+12.5%", positive: true },
    { title: "Active Users", value: "1,234", change: "+5.2%", positive: true },
    { title: "Conversion Rate", value: "3.45%", change: "-0.8%", positive: false },
    { title: "Avg. Order Value", value: "$89.50", change: "+8.1%", positive: true }
  ]

  const gridModifier = ResponsiveGridPatterns.autoFit({
    minColumnWidth: {
      base: '100%',        // Single column on mobile
      sm: 'calc(50% - 0.5rem)', // Two columns on small screens
      lg: 'calc(25% - 0.75rem)'  // Four columns on desktop
    },
    gap: { base: '1rem', lg: '1.5rem' }
  })

  return VStack(
    metrics.map(metric => MetricCard(metric))
  )
  .apply(gridModifier)
  .marginBottom({ base: 24, md: 32 })
  
}

const MetricCard = (metric: Metric) => {
  return VStack([
    Text(metric.title)
      .fontSize({ base: 14, md: 16 })
      .color('#6c757d')
      .marginBottom({ base: 8, md: 12 })
      ,
    
    HStack([
      Text(metric.value)
        .responsive({
          base: { fontSize: 24, fontWeight: 'bold' },
          md: { fontSize: 28 },
          lg: { fontSize: 32 }
        })
        .color('#2c3e50')
        ,
      
      Text(metric.change)
        .fontSize({ base: 12, md: 14 })
        .color(metric.positive ? '#28a745' : '#dc3545')
        .fontWeight('600')
        
    ])
    .justifyContent('space-between')
    .alignItems('baseline')
    
  ])
  .responsive({
    base: { 
      padding: 16,
      backgroundColor: '#ffffff'
    },
    md: { 
      padding: 20
    },
    lg: { 
      padding: 24
    }
  })
  .borderRadius({ base: 8, md: 12 })
  .boxShadow('0 2px 4px rgba(0,0,0,0.1)')
  
}
```

### Responsive Data Table

```typescript
const ResponsiveDataTable = ({ data, columns }: { data: any[], columns: Column[] }) => {
  const bp = useBreakpoint()
  const isMobile = bp.isBelow('md')()

  if (isMobile) {
    // Card layout for mobile
    return VStack(
      data.map(row => 
        VStack(
          columns.map(column => 
            HStack([
              Text(column.header)
                .fontSize(12)
                .fontWeight('600')
                .color('#6c757d')
                .width('40%')
                ,
              
              Text(row[column.key])
                .fontSize(14)
                .color('#2c3e50')
                .flex(1)
                
            ])
            .marginBottom(8)
            
          )
        )
        .padding(16)
        .backgroundColor('#ffffff')
        .borderRadius(8)
        .marginBottom(12)
        .boxShadow('0 2px 4px rgba(0,0,0,0.1)')
        
      )
    )
    
  }

  // Table layout for desktop
  return VStack([
    // Table header
    HStack(
      columns.map(column => 
        Text(column.header)
          .fontSize({ base: 14, md: 16 })
          .fontWeight('600')
          .color('#495057')
          .padding({ base: 8, md: 12 })
          .flex(1)
          
      )
    )
    .backgroundColor('#f8f9fa')
    .borderRadius(8)
    ,
    
    // Table rows
    VStack(
      data.map(row => 
        HStack(
          columns.map(column => 
            Text(row[column.key])
              .fontSize({ base: 13, md: 15 })
              .color('#2c3e50')
              .padding({ base: 8, md: 12 })
              .flex(1)
              
          )
        )
        .borderBottom('1px solid #e9ecef')
        
      )
    )
    .backgroundColor('#ffffff')
    .borderRadius(8)
    .boxShadow('0 2px 4px rgba(0,0,0,0.1)')
    
  ])
  
}
```

## 4. Landing Page

A complete responsive marketing landing page with hero section, features, testimonials, and CTA.

### Hero Section with Responsive Layout

```typescript
const HeroSection = () => {
  return ResponsiveContainerPatterns.contentContainer({
    maxWidth: { base: '100%', xl: '1200px' },
    padding: { base: 16, md: 24, lg: 32 }
  }).apply(
    HStack([
      // Hero content
      VStack([
        Text("Build Amazing Web Applications")
          .responsive({
            base: { 
              fontSize: 32, 
              fontWeight: 'bold',
              lineHeight: 1.1,
              textAlign: 'center',
              marginBottom: 16
            },
            md: { 
              fontSize: 48,
              textAlign: 'left',
              marginBottom: 20
            },
            lg: { 
              fontSize: 56,
              marginBottom: 24
            }
          })
          .color('#2c3e50')
          ,
        
        Text("The modern framework for creating responsive, performant web applications with TypeScript.")
          .responsive({
            base: { 
              fontSize: 16, 
              lineHeight: 1.5,
              textAlign: 'center',
              color: '#6c757d',
              marginBottom: 24
            },
            md: { 
              fontSize: 18,
              textAlign: 'left',
              marginBottom: 32
            },
            lg: { 
              fontSize: 20,
              marginBottom: 40
            }
          })
          ,
        
        // CTA buttons
        HStack([
          Button("Get Started")
            .responsive({
              base: { 
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 'bold'
              },
              md: { 
                padding: '16px 32px',
                fontSize: 18
              }
            })
            .backgroundColor('#007bff')
            .color('#ffffff')
            .borderRadius(8)
            ,
          
          Button("View Demo")
            .responsive({
              base: { 
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 'bold'
              },
              md: { 
                padding: '16px 32px',
                fontSize: 18
              }
            })
            .backgroundColor('transparent')
            .color('#007bff')
            .border('2px solid #007bff')
            .borderRadius(8)
            
        ])
        .responsive({
          base: { 
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center'
          },
          md: { 
            flexDirection: 'row',
            gap: 16,
            alignItems: 'center'
          }
        })
        
      ])
      .responsive({
        base: { 
          width: '100%',
          alignItems: 'center'
        },
        lg: { 
          width: '50%',
          alignItems: 'flex-start'
        }
      })
      ,
      
      // Hero image/illustration
      Image('/hero-illustration.svg')
        .responsive({
          base: { 
            display: 'none'  // Hidden on mobile
          },
          lg: { 
            display: 'block',
            width: '45%',
            height: 400
          }
        })
        
    ])
    .responsive({
      base: { 
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: '70vh',
        justifyContent: 'center'
      },
      lg: { 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '80vh'
      }
    })
    
  )
}
```

These real-world examples demonstrate how TachUI's responsive system handles complex, production-ready applications with clean, maintainable code. Each example showcases different responsive patterns and best practices for creating applications that work seamlessly across all device sizes.

## Reactive Responsive Examples

All the examples above can be enhanced with reactive values for dynamic behavior:

```typescript
// Example: Reactive dashboard metrics
const ReactiveMetricCard = ({ metric }: { metric: Signal<Metric> }) => {
  const currentMetric = metric()
  
  const statusColor = createComputed(() => {
    switch (currentMetric.status) {
      case 'critical': return '#ff0000'
      case 'warning': return '#ff8800'
      case 'normal': return '#00aa00'
    }
  })
  
  const dynamicScale = createComputed(() => 
    currentMetric.status === 'critical' ? 1.05 : 1.0
  )
  
  return VStack([
    Text(currentMetric.title)
      .fontSize({ base: 14, md: 16 })
      .color('#6c757d')
      .marginBottom({ base: 8, md: 12 })
      ,
    
    Text(currentMetric.value)
      .responsive({
        base: { 
          fontSize: 24, 
          fontWeight: 'bold',
          color: statusColor,           // Reactive color
          transform: `scale(${dynamicScale()})` // Reactive scale
        },
        md: { fontSize: 28 },
        lg: { fontSize: 32 }
      })
      
  ])
  .responsive({
    base: { padding: 16, backgroundColor: '#ffffff' },
    md: { padding: 20 },
    lg: { padding: 24 }
  })
  .borderRadius({ base: 8, md: 12 })
  .boxShadow('0 2px 4px rgba(0,0,0,0.1)')
  
}

// Example: Theme-reactive blog card
const ThemeAwareBlogCard = ({ article }: { article: Article }) => {
  const cardBackground = ColorAsset.init({
    light: '#ffffff',
    dark: '#1c1c1e',
    name: 'cardBackground'
  })
  
  const textColor = ColorAsset.init({
    light: '#2c3e50',
    dark: '#ffffff',
    name: 'textColor'
  })
  
  return VStack([
    Image(article.image)
      .responsive({
        base: { width: '100%', height: 150 },
        md: { height: 180 },
        lg: { height: 200 }
      })
      ,
    
    Text(article.title)
      .responsive({
        base: { 
          fontSize: 18,
          color: textColor,         // Reactive theme color
          marginBottom: 8
        },
        md: { fontSize: 20, marginBottom: 12 }
      })
      
  ])
  .responsive({
    base: { 
      padding: 12,
      backgroundColor: cardBackground // Reactive theme background
    },
    md: { padding: 16 }
  })
  .borderRadius({ base: 12, md: 16 })
  
}
```

These examples demonstrate how TachUI's responsive system seamlessly integrates with reactive values, automatically updating styles when themes change or application state updates.

## Related Guides

- [Responsive Design Guide](../guide/responsive-design.md) - Core responsive concepts with reactive examples
- [Responsive Layout Patterns](./responsive-layouts.md) - Reusable layout patterns  
- [API Reference](../api/responsive-modifiers.md) - Complete API documentation with reactive examples
- [Performance Guide](../guide/responsive-performance.md) - Optimization techniques