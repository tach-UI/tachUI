# @tachui/grid

Advanced grid layout system for tachUI applications with responsive design and SwiftUI-style API.

## Overview

The `@tachui/grid` package provides powerful grid layout components that bring CSS Grid capabilities to tachUI with a declarative, SwiftUI-inspired interface. Build complex layouts with automatic responsiveness and accessibility features.

## Installation

```bash
npm install @tachui/grid
# or
pnpm add @tachui/grid
```

## Components

### Grid

A flexible container that arranges children in a grid layout with automatic sizing and spacing.

```typescript
import { Grid } from '@tachui/grid'
import { Text } from '@tachui/primitives'

Grid({
  columns: 3,
  spacing: 16,
  children: [
    Text('Item 1'),
    Text('Item 2'),
    Text('Item 3'),
    Text('Item 4'),
    Text('Item 5'),
    Text('Item 6'),
  ],
})
```

### GridResponsive

Responsive grid that adapts to different screen sizes automatically.

```typescript
import { GridResponsive } from '@tachui/grid'

GridResponsive({
  columns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  spacing: {
    mobile: 8,
    tablet: 12,
    desktop: 16,
  },
  children: gridItems,
})
```

## Features

- **CSS Grid Integration**: Full CSS Grid support with tachUI's declarative syntax
- **Responsive Design**: Automatic breakpoint handling and adaptive layouts
- **SwiftUI-Inspired API**: Familiar grid syntax for SwiftUI developers
- **Accessibility**: Built-in ARIA support and keyboard navigation
- **Performance Optimized**: Efficient rendering with minimal layout thrashing
- **TypeScript Support**: Complete type safety with excellent IntelliSense

## Grid Properties

### Basic Layout

```typescript
Grid({
  // Column configuration
  columns: 3, // Fixed columns
  // or
  columns: 'repeat(auto-fit, minmax(200px, 1fr))', // CSS Grid template

  // Row configuration
  rows: 2, // Fixed rows
  // or
  rows: 'auto 1fr auto', // CSS Grid template

  // Spacing
  spacing: 16, // Uniform spacing
  // or
  spacing: { horizontal: 16, vertical: 12 }, // Custom spacing

  children: gridItems,
})
```

### Advanced Grid Configuration

```typescript
Grid({
  // Grid template areas for named layouts
  templateAreas: ['header header', 'sidebar content', 'footer footer'],

  // Individual cell sizing
  columnSizes: ['200px', '1fr', '200px'],
  rowSizes: ['auto', '1fr', 'auto'],

  // Alignment
  alignItems: 'center',
  justifyContent: 'space-between',

  children: [
    Text('Header').modifier.gridArea('header').build(),
    Text('Sidebar').modifier.gridArea('sidebar').build(),
    Text('Content').modifier.gridArea('content').build(),
    Text('Footer').modifier.gridArea('footer').build(),
  ],
})
```

## Grid Modifiers

The grid system includes specialized modifiers for precise control:

```typescript
import { gridColumn, gridRow, gridArea } from '@tachui/grid'

// Span multiple columns/rows
Text('Wide Item')
  .modifier.gridColumn('1 / 3') // Span from column 1 to 3
  .gridRow('2 / 4') // Span from row 2 to 4
  .build()

// Named grid areas
Text('Header').modifier.gridArea('header').build()

// Positioning with line numbers
Text('Positioned Item').modifier.gridColumn(2).gridRow(1).build()
```

## Responsive Grid Patterns

### Auto-Fitting Cards

```typescript
Grid({
  columns: 'repeat(auto-fit, minmax(250px, 1fr))',
  spacing: 16,
  children: cardItems.map(item =>
    Card({ title: item.title, content: item.content })
  ),
})
```

### Dashboard Layout

```typescript
GridResponsive({
  templateAreas: {
    mobile: ['header', 'stats', 'chart', 'footer'],
    desktop: [
      'header header header',
      'stats chart chart',
      'footer footer footer',
    ],
  },
  children: [
    DashboardHeader().modifier.gridArea('header').build(),
    StatsPanel().modifier.gridArea('stats').build(),
    ChartWidget().modifier.gridArea('chart').build(),
    Footer().modifier.gridArea('footer').build(),
  ],
})
```

## Accessibility Features

- **ARIA Grid Roles**: Automatic grid role assignment for screen readers
- **Keyboard Navigation**: Arrow key navigation between grid cells
- **Focus Management**: Proper focus handling and visual indicators
- **Screen Reader Support**: Cell position announcements

## Performance Optimization

- **Virtualization**: Built-in virtual scrolling for large grids
- **Lazy Loading**: Automatic lazy loading of off-screen content
- **Efficient Updates**: Minimal re-renders using fine-grained reactivity
- **GPU Acceleration**: CSS transforms for smooth animations

## Integration with Other Packages

Works seamlessly with the tachUI ecosystem:

```typescript
import { Grid } from '@tachui/grid'
import { Card, Text, Button } from '@tachui/primitives'
import { Show } from '@tachui/flow-control'
import { createSignal } from '@tachui/core'

const [items, setItems] = createSignal(initialItems)
const [isLoading, setIsLoading] = createSignal(false)

VStack({
  children: [
    Show({
      when: () => !isLoading(),
      children: Grid({
        columns: 'repeat(auto-fill, minmax(300px, 1fr))',
        spacing: 20,
        children: items().map(item =>
          Card({
            title: item.title,
            content: item.description,
          })
            .modifier.padding(16)
            .cornerRadius(8)
            .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
            .build()
        ),
      }),
    }),
  ],
})
```

## Browser Support

- Modern browsers with CSS Grid support
- Graceful fallback to flexbox for older browsers
- Progressive enhancement for advanced features

## License

This package is part of the tachUI framework and is licensed under the MPL-2.0 License.
