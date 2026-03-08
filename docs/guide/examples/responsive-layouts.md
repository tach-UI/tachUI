# Responsive Layout Patterns

TachUI provides pre-built responsive layout patterns that make it easy to create common responsive designs. These patterns are optimized for performance and follow best practices for accessibility and user experience.

## Grid Patterns

### Auto-Fit Grid

Create responsive grids that automatically adjust the number of columns based on available space.

```typescript
import { ResponsiveGridPatterns, VStack, Text } from '@tachui/core'

// Auto-fit grid with responsive minimum column width
const AutoFitGrid = () => {
  const gridModifier = ResponsiveGridPatterns.autoFit({
    minColumnWidth: {
      base: '250px',    // Minimum 250px columns on mobile
      md: '300px',      // Minimum 300px columns on tablet
      lg: '350px'       // Minimum 350px columns on desktop
    },
    gap: {
      base: '1rem',     // 1rem gap on mobile
      md: '1.5rem',     // 1.5rem gap on tablet
      lg: '2rem'        // 2rem gap on desktop
    },
    maxColumns: {
      base: 1,          // Max 1 column on mobile
      md: 2,            // Max 2 columns on tablet
      lg: 4             // Max 4 columns on desktop
    }
  })

  const items = [
    'Card 1', 'Card 2', 'Card 3', 'Card 4', 
    'Card 5', 'Card 6', 'Card 7', 'Card 8'
  ]

  return VStack(
    items.map(item => 
      Text(item)
        .padding(16)
        .backgroundColor('#f5f5f5')
        .borderRadius(8)
        .textAlign('center')
        
    )
  )
  .apply(gridModifier)
  
}
```

### Responsive Column Grid

Create grids with explicit column counts at different breakpoints.

```typescript
// Explicit responsive columns
const ResponsiveColumnGrid = () => {
  const gridModifier = ResponsiveGridPatterns.columns({
    columns: {
      base: 1,          // 1 column on mobile
      sm: 2,            // 2 columns on small screens
      md: 3,            // 3 columns on medium screens
      lg: 4,            // 4 columns on large screens
      xl: 6             // 6 columns on extra large screens
    },
    gap: {
      base: '0.5rem',
      md: '1rem',
      lg: '1.5rem'
    }
  })

  return VStack([
    // Grid items...
  ])
  .apply(gridModifier)
  
}
```

### Masonry Grid

Create responsive masonry-style layouts.

```typescript
// Masonry grid for variable height content
const MasonryGrid = () => {
  const masonryModifier = ResponsiveGridPatterns.masonry({
    columnWidth: {
      base: '100%',     // Single column on mobile
      md: '300px',      // 300px columns on tablet+
      lg: '250px'       // 250px columns on desktop
    },
    gap: '1rem',
    maxColumns: {
      base: 1,
      md: 2,
      lg: 3,
      xl: 4
    }
  })

  return VStack([
    // Variable height content items...
  ])
  .apply(masonryModifier)
  
}
```

## Flexbox Patterns

### Stack to Row

Transform vertical stacks into horizontal rows at larger breakpoints.

```typescript
import { ResponsiveFlexPatterns, HStack, VStack, Button } from '@tachui/core'

// Navigation that stacks on mobile, becomes horizontal on desktop
const ResponsiveNavigation = () => {
  const stackToRowModifier = ResponsiveFlexPatterns.stackToRow({
    breakpoint: 'md',   // Switch to row at medium breakpoint
    gap: {
      base: '0.5rem',   // Smaller gap when stacked
      md: '2rem'        // Larger gap when horizontal
    },
    alignment: {
      base: 'center',   // Center alignment when stacked
      md: 'flex-start'  // Start alignment when horizontal
    }
  })

  return VStack([
    Button("Home"),
    Button("About"),
    Button("Services"),
    Button("Contact")
  ])
  .apply(stackToRowModifier)
  
}
```

### Responsive Flex Wrapping

Create flex layouts that adapt their wrapping behavior.

```typescript
// Tag list that wraps responsively
const ResponsiveTagList = () => {
  const flexWrapModifier = ResponsiveFlexPatterns.responsiveWrap({
    direction: {
      base: 'column',   // Column on mobile
      sm: 'row'         // Row on small screens and up
    },
    wrap: {
      base: 'nowrap',   // No wrap on mobile (column layout)
      sm: 'wrap'        // Wrap on small screens and up
    },
    gap: {
      base: '0.5rem',
      sm: '0.75rem',
      md: '1rem'
    },
    justifyContent: {
      base: 'center',   // Center on mobile
      sm: 'flex-start'  // Start on larger screens
    }
  })

  const tags = ['React', 'TypeScript', 'CSS', 'JavaScript', 'HTML']

  return VStack(
    tags.map(tag => 
      Text(tag)
        .padding({ base: 6, sm: 8 })
        .backgroundColor('#e0e0e0')
        .borderRadius(16)
        .fontSize({ base: 12, sm: 14 })
        
    )
  )
  .apply(flexWrapModifier)
  
}
```

### Space Distribution

Create responsive layouts with different space distribution patterns.

```typescript
// Card layout with responsive space distribution
const SpaceDistributionLayout = () => {
  const spaceModifier = ResponsiveFlexPatterns.spaceDistribution({
    distribution: {
      base: 'center',        // Center on mobile
      md: 'space-between',   // Space between on tablet
      lg: 'space-around'     // Space around on desktop
    },
    alignment: {
      base: 'stretch',       // Stretch on mobile
      md: 'center'           // Center on tablet+
    },
    direction: {
      base: 'column',        // Column on mobile
      md: 'row'              // Row on tablet+
    }
  })

  return VStack([
    // Content cards...
  ])
  .apply(spaceModifier)
  
}
```

## Container Patterns

### Responsive Container

Create containers that adapt their max-width and padding at different breakpoints.

```typescript
import { ResponsiveContainerPatterns, VStack } from '@tachui/core'

// Content container with responsive constraints
const ResponsiveContainer = ({ children }: { children: any[] }) => {
  const containerModifier = ResponsiveContainerPatterns.contentContainer({
    maxWidth: {
      base: '100%',      // Full width on mobile
      sm: '540px',       // Constrained on small screens
      md: '720px',       // Medium container on tablets
      lg: '960px',       // Large container on laptops
      xl: '1140px',      // Extra large on desktops
      '2xl': '1320px'    // Maximum on large screens
    },
    padding: {
      base: '1rem',      // 1rem padding on mobile
      sm: '1.5rem',      // 1.5rem on small screens
      md: '2rem',        // 2rem on tablets
      lg: '2.5rem',      // 2.5rem on laptops
      xl: '3rem'         // 3rem on desktops
    },
    margin: 'auto'       // Center the container
  })

  return VStack(children)
    .apply(containerModifier)
    
}
```

### Centered Layout

Create responsive centered layouts with different alignment strategies.

```typescript
// Centered layout that adapts alignment method
const CenteredLayout = ({ children }: { children: any[] }) => {
  const centeredModifier = ResponsiveContainerPatterns.centered({
    method: {
      base: 'padding',    // Use padding centering on mobile
      md: 'margin',       // Use margin centering on tablet+
      lg: 'flexbox'       // Use flexbox centering on desktop
    },
    maxWidth: {
      base: '100%',
      md: '600px',
      lg: '800px'
    },
    verticalAlignment: {
      base: 'flex-start', // Top aligned on mobile
      md: 'center'        // Center aligned on tablet+
    }
  })

  return VStack(children)
    .apply(centeredModifier)
    
}
```

### Sidebar Layout

Create responsive sidebar layouts that collapse on mobile.

```typescript
// Sidebar layout that becomes full-width stack on mobile
const SidebarLayout = ({ sidebar, main }: { sidebar: any, main: any }) => {
  const sidebarModifier = ResponsiveContainerPatterns.sidebar({
    sidebarWidth: {
      md: '250px',        // Fixed sidebar width on tablet+
      lg: '300px',        // Wider sidebar on desktop
      xl: '350px'         // Even wider on large screens
    },
    gap: {
      base: '1rem',       // Gap between sections
      md: '1.5rem',
      lg: '2rem'
    },
    layout: {
      base: 'stack',      // Stacked layout on mobile
      md: 'sidebar-left', // Left sidebar on tablet+
      lg: 'sidebar-left'  // Maintain left sidebar on desktop
    },
    sidebarPosition: {
      base: 'top',        // Sidebar at top on mobile
      md: 'left'          // Sidebar on left on tablet+
    }
  })

  return VStack([sidebar, main])
    .apply(sidebarModifier)
    
}
```

## Visibility Patterns

### Responsive Show/Hide

Show or hide elements at specific breakpoints.

```typescript
import { ResponsiveVisibilityPatterns, Text, Button } from '@tachui/core'

// Mobile menu button (visible only on mobile)
const MobileMenuButton = () => {
  const mobileOnlyModifier = ResponsiveVisibilityPatterns.showOnBreakpoints(['base', 'sm'])
  
  return Button("☰ Menu")
    .apply(mobileOnlyModifier)
    
}

// Desktop navigation (hidden on mobile)
const DesktopNavigation = () => {
  const desktopOnlyModifier = ResponsiveVisibilityPatterns.hideOnBreakpoints(['base', 'sm'])
  
  return HStack([
    Button("Home"),
    Button("About"),
    Button("Contact")
  ])
  .apply(desktopOnlyModifier)
  
}

// Progressive disclosure (show more content on larger screens)
const ProgressiveContent = () => {
  return VStack([
    // Always visible core content
    Text("Essential content visible on all devices"),
    
    // Additional content on tablets and up
    Text("Additional content for tablet and desktop users")
      .apply(ResponsiveVisibilityPatterns.showFromBreakpoint('md'))
      ,
    
    // Extra content only on desktop
    Text("Extra content only for desktop users")
      .apply(ResponsiveVisibilityPatterns.showFromBreakpoint('lg'))
      
  ])
  
}
```

### Responsive Text Truncation

Handle text overflow responsively.

```typescript
// Text that truncates differently at different breakpoints
const ResponsiveText = ({ content }: { content: string }) => {
  const textModifier = ResponsiveVisibilityPatterns.responsiveTextHandling({
    truncation: {
      base: 'ellipsis',   // Truncate with ellipsis on mobile
      md: 'wrap',         // Allow wrapping on tablet
      lg: 'none'          // No truncation on desktop
    },
    maxLines: {
      base: 2,            // Max 2 lines on mobile
      md: 3,              // Max 3 lines on tablet
      lg: undefined       // No line limit on desktop
    }
  })

  return Text(content)
    .apply(textModifier)
    
}
```

## Spacing Patterns

### Responsive Spacing Scale

Apply consistent responsive spacing throughout your application.

```typescript
import { ResponsiveSpacingPatterns } from '@tachui/core'

// Component with responsive spacing scale
const SpacedComponent = () => {
  const spacingModifier = ResponsiveSpacingPatterns.scale({
    // Consistent spacing scale across breakpoints
    scale: {
      base: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
      md: { xs: 6, sm: 12, md: 18, lg: 24, xl: 30 },
      lg: { xs: 8, sm: 16, md: 24, lg: 32, xl: 40 }
    },
    // Apply spacing using scale values
    padding: {
      base: 'md',         // Use medium spacing on mobile
      md: 'lg',           // Use large spacing on tablet
      lg: 'xl'            // Use extra large spacing on desktop
    },
    margin: {
      base: 'sm',         // Use small margins on mobile
      md: 'md',           // Use medium margins on tablet
      lg: 'lg'            // Use large margins on desktop
    }
  })

  return VStack([
    Text("Consistently spaced content")
  ])
  .apply(spacingModifier)
  
}
```

### Responsive Rhythm

Create responsive vertical rhythm and spacing.

```typescript
// Content with responsive vertical rhythm
const RhythmicContent = () => {
  const rhythmModifier = ResponsiveSpacingPatterns.verticalRhythm({
    baseLineHeight: {
      base: 1.4,          // Tighter line height on mobile
      md: 1.5,            // Standard line height on tablet
      lg: 1.6             // Looser line height on desktop
    },
    verticalSpacing: {
      base: '1rem',       // 1rem rhythm on mobile
      md: '1.25rem',      // 1.25rem rhythm on tablet  
      lg: '1.5rem'        // 1.5rem rhythm on desktop
    },
    elementSpacing: {
      heading: {
        base: '0.5rem',
        md: '0.75rem',
        lg: '1rem'
      },
      paragraph: {
        base: '1rem',
        md: '1.25rem',
        lg: '1.5rem'
      }
    }
  })

  return VStack([
    Text("Heading").fontSize({ base: 24, md: 28, lg: 32 }),
    Text("Paragraph content with proper vertical rhythm..."),
    Text("Another paragraph...")
  ])
  .apply(rhythmModifier)
  
}
```

## Typography Patterns

### Responsive Typography Scale

Create consistent responsive typography scaling.

```typescript
import { ResponsiveTypographyPatterns } from '@tachui/core'

// Heading with responsive typography scale
const ResponsiveHeading = ({ level, children }: { level: 1 | 2 | 3 | 4 | 5 | 6, children: string }) => {
  const typographyModifier = ResponsiveTypographyPatterns.headingScale({
    level,
    scale: {
      base: {
        1: { fontSize: 24, lineHeight: 1.2, fontWeight: 'bold' },
        2: { fontSize: 20, lineHeight: 1.3, fontWeight: 'bold' },
        3: { fontSize: 18, lineHeight: 1.4, fontWeight: '600' },
        4: { fontSize: 16, lineHeight: 1.4, fontWeight: '600' },
        5: { fontSize: 14, lineHeight: 1.5, fontWeight: '600' },
        6: { fontSize: 12, lineHeight: 1.5, fontWeight: '600' }
      },
      md: {
        1: { fontSize: 32, lineHeight: 1.1 },
        2: { fontSize: 26, lineHeight: 1.2 },
        3: { fontSize: 22, lineHeight: 1.3 },
        4: { fontSize: 18, lineHeight: 1.4 },
        5: { fontSize: 16, lineHeight: 1.4 },
        6: { fontSize: 14, lineHeight: 1.5 }
      },
      lg: {
        1: { fontSize: 40, lineHeight: 1.0 },
        2: { fontSize: 32, lineHeight: 1.1 },
        3: { fontSize: 26, lineHeight: 1.2 },
        4: { fontSize: 20, lineHeight: 1.3 },
        5: { fontSize: 18, lineHeight: 1.4 },
        6: { fontSize: 16, lineHeight: 1.4 }
      }
    }
  })

  return Text(children)
    .apply(typographyModifier)
    
}

// Body text with responsive sizing
const ResponsiveBodyText = ({ children }: { children: string }) => {
  const bodyModifier = ResponsiveTypographyPatterns.bodyText({
    size: {
      base: { fontSize: 14, lineHeight: 1.5 },
      md: { fontSize: 16, lineHeight: 1.6 },
      lg: { fontSize: 18, lineHeight: 1.7 }
    },
    spacing: {
      base: '1rem',
      md: '1.25rem',
      lg: '1.5rem'
    }
  })

  return Text(children)
    .apply(bodyModifier)
    
}
```

### Fluid Typography

Create typography that scales smoothly between breakpoints.

```typescript
// Fluid typography that scales smoothly
const FluidTypography = ({ children }: { children: string }) => {
  const fluidModifier = ResponsiveTypographyPatterns.fluid({
    minSize: {
      fontSize: 16,
      lineHeight: 1.4
    },
    maxSize: {
      fontSize: 24,
      lineHeight: 1.2
    },
    minViewport: '320px',
    maxViewport: '1200px',
    // CSS clamp() function for smooth scaling
    preferClamp: true
  })

  return Text(children)
    .apply(fluidModifier)
    
}
```

## Real-World Layout Examples

### Hero Section

Responsive hero section with different layouts for mobile and desktop.

```typescript
const HeroSection = () => {
  return VStack([
    // Hero content
    VStack([
      Text("Welcome to TachUI")
        .responsive({
          base: { 
            fontSize: 28, 
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: 16
          },
          md: { 
            fontSize: 40, 
            textAlign: 'left',
            marginBottom: 24
          },
          lg: { 
            fontSize: 52,
            marginBottom: 32
          }
        })
        ,
      
      Text("Build responsive applications with ease")
        .responsive({
          base: { 
            fontSize: 16, 
            textAlign: 'center',
            color: '#666',
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
        Button("Get Started"),
        Button("Learn More")
      ])
      .responsive({
        base: { 
          flexDirection: 'column', 
          gap: 12,
          alignItems: 'stretch'
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
        padding: 24,
        alignItems: 'center',
        textAlign: 'center'
      },
      md: { 
        padding: 40,
        alignItems: 'flex-start',
        textAlign: 'left'
      },
      lg: { 
        padding: 60
      }
    })
    
  ])
  .responsive({
    base: { 
      minHeight: '60vh',
      justifyContent: 'center'
    },
    md: { 
      minHeight: '70vh'
    },
    lg: { 
      minHeight: '80vh'
    }
  })
  .backgroundColor({ base: '#f8f9fa', md: '#ffffff' })
  
}
```

### Product Grid

Responsive product grid with different layouts for different screen sizes.

```typescript
const ProductGrid = ({ products }: { products: Product[] }) => {
  const gridModifier = ResponsiveGridPatterns.autoFit({
    minColumnWidth: {
      base: '280px',
      md: '300px',
      lg: '320px'
    },
    gap: {
      base: '1rem',
      md: '1.5rem',
      lg: '2rem'
    },
    maxColumns: {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5
    }
  })

  return VStack(
    products.map(product => 
      VStack([
        // Product image
        Image(product.image)
          .responsive({
            base: { width: '100%', height: 200 },
            md: { height: 220 },
            lg: { height: 240 }
          })
          .borderRadius(8)
          ,
        
        // Product info
        VStack([
          Text(product.name)
            .fontSize({ base: 16, md: 18 })
            .fontWeight('600')
            .marginBottom(8)
            ,
          
          Text(product.price)
            .fontSize({ base: 18, md: 20 })
            .fontWeight('bold')
            .color('#007bff')
            
        ])
        .padding({ base: 12, md: 16 })
        
      ])
      .backgroundColor('#ffffff')
      .borderRadius(12)
      .boxShadow('0 2px 8px rgba(0,0,0,0.1)')
      
    )
  )
  .apply(gridModifier)
  .padding({ base: 16, md: 24, lg: 32 })
  
}
```

## Pattern Composition

### Combining Multiple Patterns

You can combine multiple responsive patterns for complex layouts:

```typescript
const ComplexLayout = () => {
  // Combine container, grid, and spacing patterns
  const containerModifier = ResponsiveContainerPatterns.contentContainer({
    maxWidth: { base: '100%', lg: '1200px' },
    padding: { base: '1rem', md: '2rem' }
  })
  
  const gridModifier = ResponsiveGridPatterns.columns({
    columns: { base: 1, md: 2, lg: 3 },
    gap: { base: '1rem', md: '2rem' }
  })
  
  const spacingModifier = ResponsiveSpacingPatterns.scale({
    scale: { base: { sm: 8, md: 16 }, lg: { sm: 12, md: 24 } }
  })

  return VStack([
    // Content items...
  ])
  .apply(containerModifier)
  .apply(gridModifier)
  .apply(spacingModifier)
  
}
```

These responsive layout patterns provide a solid foundation for building modern, responsive applications with TachUI. They handle the complexity of responsive design while maintaining clean, readable code.

## Related Guides

- [Responsive Design](../guide/responsive-design.md) - Complete responsive design guide
- [Breakpoint System](../guide/breakpoints.md) - Understanding breakpoints
- [Responsive API Reference](../api/responsive-modifiers.md) - Complete API documentation
- [Performance Optimization](../guide/responsive-performance.md) - Optimize responsive performance