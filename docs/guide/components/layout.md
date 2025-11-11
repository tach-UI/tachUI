# Layout Components

Core layout containers that provide SwiftUI-style layout with flexbox implementation. These components form the foundation of tachUI's layout system.

## Overview

tachUI provides three fundamental layout components:

- **VStack** - Vertical stack layout (column direction)
- **HStack** - Horizontal stack layout (row direction) 
- **ZStack** - Overlay/depth stack layout (absolute positioning)

All layout components support modifier chaining and can contain any tachUI components as children.

## VStack

Arranges child components vertically in a column layout.

### Basic Usage

```typescript
import { VStack, Text } from '@tachui/core'

VStack({
  children: [
    Text("First item"),
    Text("Second item"), 
    Text("Third item")
  ]
})
```

### Props

```typescript
interface VStackProps {
  children?: ComponentInstance[]
  spacing?: number
  alignment?: 'leading' | 'center' | 'trailing'
  debugLabel?: string
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `children` | `ComponentInstance[]` | `[]` | Array of child components |
| `spacing` | `number` | `0` | Space between items in pixels |
| `alignment` | `'leading' \| 'center' \| 'trailing'` | `'center'` | Cross-axis alignment |
| `debugLabel` | `string` | - | Debug identifier for development |

### Alignment Options

```typescript
import { VStack, Text } from '@tachui/core'

// Leading alignment (left-aligned)
VStack({
  children: [Text("Left"), Text("Aligned")],
  alignment: 'leading'
})

// Center alignment (default)
VStack({
  children: [Text("Center"), Text("Aligned")],
  alignment: 'center'
})

// Trailing alignment (right-aligned)
VStack({
  children: [Text("Right"), Text("Aligned")],
  alignment: 'trailing'
})
```

### With Spacing

```typescript
import { VStack, Button } from '@tachui/core'

VStack({
  children: [
    Button("First Button"),
    Button("Second Button"),
    Button("Third Button")
  ],
  spacing: 16 // 16px between each button
})
```

### With Modifiers

```typescript
import { VStack, Text } from '@tachui/core'

VStack({
  children: [
    Text("Styled Stack"),
    Text("With padding and background")
  ],
  spacing: 12
})
.padding(20)
.backgroundColor('#f5f5f5')
.cornerRadius(12)
.shadow({ x: 0, y: 2, blur: 8, color: 'rgba(0,0,0,0.1)' })

```

## HStack

Arranges child components horizontally in a row layout.

### Basic Usage

```typescript
import { HStack, Button } from '@tachui/core'

HStack({
  children: [
    Button("Cancel"),
    Button("OK")
  ]
})
```

### Props

```typescript
interface HStackProps {
  children?: ComponentInstance[]
  spacing?: number
  alignment?: 'top' | 'center' | 'bottom'
  debugLabel?: string
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `children` | `ComponentInstance[]` | `[]` | Array of child components |
| `spacing` | `number` | `0` | Space between items in pixels |
| `alignment` | `'top' \| 'center' \| 'bottom'` | `'center'` | Cross-axis alignment |
| `debugLabel` | `string` | - | Debug identifier for development |

### Alignment Options

```typescript
import { HStack, Text, Button } from '@tachui/core'

// Top alignment
HStack({
  children: [
    Text("Top").font({ size: 12 }),
    Button("Aligned"),
    Text("Content").font({ size: 20 })
  ],
  alignment: 'top'
})

// Center alignment (default)
HStack({
  children: [
    Text("Center").font({ size: 12 }), 
    Button("Aligned"),
    Text("Content").font({ size: 20 })
  ],
  alignment: 'center'
})

// Bottom alignment
HStack({
  children: [
    Text("Bottom").font({ size: 12 }),
    Button("Aligned"), 
    Text("Content").font({ size: 20 })
  ],
  alignment: 'bottom'
})
```

### Navigation Toolbar

```typescript
import { HStack, Button, Text, Spacer } from '@tachui/core'

const NavigationBar = () =>
  HStack({
    children: [
      Button("Back"),
      Text("Page Title")
        .font({ size: 18, weight: 'bold' })
        ,
      Spacer(),
      Button("More")
    ],
    spacing: 12
  })
  .padding({ horizontal: 16, vertical: 12 })
  .backgroundColor('white')
  .shadow({ x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.1)' })
  
```

## ZStack

Overlays child components with absolute positioning and z-index control.

### Basic Usage

```typescript
import { ZStack, Image, Text } from '@tachui/core'

ZStack({
  children: [
    Image({ src: 'background.jpg' }), // Bottom layer
    Text("Overlay Text")               // Top layer
      .foregroundColor('white')
      
  ]
})
```

### Props

```typescript
interface ZStackProps {
  children?: ComponentInstance[]
  alignment?: 'center' | 'top' | 'bottom' | 'leading' | 'trailing' | 
              'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'
  debugLabel?: string
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `children` | `ComponentInstance[]` | `[]` | Array of child components (back to front) |
| `alignment` | `ZStackAlignment` | `'center'` | Alignment of all children |
| `debugLabel` | `string` | - | Debug identifier for development |

### Alignment Options

```typescript
import { ZStack, Text, VStack } from '@tachui/core'

// Center alignment (default)
ZStack({
  children: [
    VStack().backgroundColor('blue').size({ width: 200, height: 200 }),
    Text("Centered")
  ],
  alignment: 'center'
})

// Corner alignments
ZStack({
  children: [
    VStack().backgroundColor('blue').size({ width: 200, height: 200 }),
    Text("Top Left")
  ],
  alignment: 'topLeading'
})

ZStack({
  children: [
    VStack().backgroundColor('blue').size({ width: 200, height: 200 }), 
    Text("Bottom Right")
  ],
  alignment: 'bottomTrailing'
})
```

### Card with Overlay

```typescript
import { ZStack, Image, VStack, Text, Button } from '@tachui/core'

const ImageCard = ({ src, title, description }: {
  src: string
  title: string
  description: string
}) => 
  ZStack({
    children: [
      // Background image
      Image({ src })
        .css({ 
          width: '100%', 
          height: '300px', 
          objectFit: 'cover' 
        })
        ,
      
      // Dark overlay
      VStack()
        .backgroundColor('rgba(0,0,0,0.4)')
        .css({ position: 'absolute', inset: '0' })
        ,
      
      // Content overlay
      VStack({
        children: [
          Text(title)
            .font({ size: 24, weight: 'bold' })
            .foregroundColor('white')
            .textAlign('center')
            ,
          
          Text(description)
            .foregroundColor('rgba(255,255,255,0.9)')
            .textAlign('center')
            ,
          
          Button("Learn More")
            .backgroundColor('rgba(255,255,255,0.2)')
            .foregroundColor('white')
            .border({ width: 1, color: 'rgba(255,255,255,0.3)' })
            .cornerRadius(8)
            .padding({ horizontal: 20, vertical: 10 })
            
        ],
        spacing: 12
      })
    ],
    alignment: 'center'
  })
  .cornerRadius(16)
  .overflow('hidden')
  
```

## Layout Composition

Layout components can be nested to create complex layouts:

### Sidebar Layout

```typescript
import { HStack, VStack, Text, Button, Spacer } from '@tachui/core'

const SidebarLayout = () =>
  HStack({
    children: [
      // Sidebar
      VStack({
        children: [
          Text("Navigation")
            .font({ size: 18, weight: 'bold' })
            ,
          
          Button("Home"),
          Button("About"), 
          Button("Contact"),
          
          Spacer(),
          
          Button("Settings")
        ],
        spacing: 8
      })
      .width(200)
      .padding(16)
      .backgroundColor('#f5f5f5')
      ,
      
      // Main content
      VStack({
        children: [
          Text("Main Content Area")
            .font({ size: 24, weight: 'bold' })
            ,
          
          Text("This is the main content area")
        ],
        spacing: 16
      })
      .padding(24)
      .flexGrow(1)
      
    ]
  })
  .css({ minHeight: '100vh' })
  
```

### Card Grid

```typescript
import { VStack, HStack, Text } from '@tachui/core'

const CardGrid = ({ items }: { items: string[] }) => {
  const rows: string[][] = []
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3))
  }
  
  return VStack({
    children: rows.map(row =>
      HStack({
        children: row.map(item =>
          VStack({
            children: [
              Text(item)
                .font({ weight: 'bold' })
                
            ]
          })
          .padding(20)
          .backgroundColor('white')
          .cornerRadius(8)
          .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
          .flexGrow(1)
          
        ),
        spacing: 16
      })
    ),
    spacing: 16
  })
  .padding(16)
  
}
```

## Best Practices

### Performance

```typescript
// ✅ Good - Use specific alignments when needed
VStack({
  children: [...],
  alignment: 'leading' // Explicit alignment
})

// ✅ Good - Set appropriate spacing
HStack({
  children: [...],
  spacing: 12 // Consistent spacing
})

// ❌ Avoid - Excessive nesting without purpose
VStack({
  children: [
    HStack({
      children: [
        VStack({ children: [Text("Overly nested")] }) // Unnecessary nesting
      ]
    })
  ]
})
```

### Responsive Design

```typescript
import { VStack, HStack } from '@tachui/core'

// Use responsive modifiers for layout adaptation
VStack({
  children: [...],
  spacing: 16
})
.responsive()
.xs(() => padding(8))
.md(() => padding(16))
.lg(() => padding(24))

```

### Accessibility

```typescript
import { VStack, Text } from '@tachui/core'

// Provide semantic structure
VStack({
  children: [
    Text("Section Title"),
    Text("Section content")
  ],
  debugLabel: "Article Section" // Helps with debugging
})
.aria({ role: 'section' })

```

## Integration with Other Components

Layout components work seamlessly with all tachUI components:

```typescript
import { VStack, HStack, Text, Button, Image, Form, TextField } from '@tachui/core'

const ProfileForm = () =>
  VStack({
    children: [
      // Profile image section
      HStack({
        children: [
          Image({ src: 'avatar.jpg' })
            .css({ width: '80px', height: '80px', borderRadius: '50%' })
            ,
          
          VStack({
            children: [
              Text("Profile Photo"),
              Button("Change Photo")
            ],
            spacing: 8
          })
        ],
        spacing: 16,
        alignment: 'center'
      }),
      
      // Form fields
      Form({
        children: [
          TextField({ placeholder: "Full Name" }),
          TextField({ placeholder: "Email" }),
          TextField({ placeholder: "Bio", multiline: true })
        ]
      }),
      
      // Action buttons
      HStack({
        children: [
          Button("Cancel"),
          Button("Save Changes")
        ],
        spacing: 12
      })
    ],
    spacing: 24
  })
  .padding(24)
  .maxWidth(400)
  
```

## See Also

- **[Spacer Component](/components/spacer)** - Flexible space component for layout
- **[Complete Components Guide](/guide/complete-components-guide)** - Comprehensive component usage patterns
- **[Modifiers API](/api/modifiers)** - Layout and styling modifiers
- **[Responsive Design](/guide/responsive-design)** - Responsive layout patterns