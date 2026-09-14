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
    Text('Header').gridArea('header'),
    Text('Sidebar').gridArea('sidebar'),
    Text('Content').gridArea('content'),
    Text('Footer').gridArea('footer'),
  ],
})
```

## Grid Modifiers

The grid system includes specialized modifiers for precise control:

```typescript
import { gridColumnSpan, gridRowSpan, gridArea } from '@tachui/grid'

// Span multiple columns/rows
Text('Wide Item')
  .gridColumnSpan(2) // Span two columns
  .gridRowSpan(2) // Span two rows
  

// Named grid areas
Text('Header').gridArea('header')

// Positioning with line numbers
Text('Positioned Item').gridArea('header')
```

## Responsive Grid Patterns

### Auto-Fitting Cards

```typescript
Grid({
  columns: 'repeat(auto-fit, minmax(250px, 1fr))',
  spacing: 16,
  // There is no Card primitive; a card is a stack you style.
  children: cardItems.map(item =>
    VStack({
      children: [Text(item.title).fontWeight('bold'), Text(item.content)],
      spacing: 4,
    })
      .padding(16)
      .cornerRadius(8)
  ),
})
```

### Dashboard Layout

`Grid` takes CSS grid template areas directly; children claim an area with the
`gridArea` modifier.

```typescript
Grid({
  templateAreas: [
    'header header header',
    'stats chart chart',
    'footer footer footer',
  ],
  children: [
    DashboardHeader().gridArea('header'),
    StatsPanel().gridArea('stats'),
    ChartWidget().gridArea('chart'),
    Footer().gridArea('footer'),
  ],
})
```

> There is no `GridResponsive`. Per-breakpoint template areas are not
> implemented; drive them with `@tachui/responsive`'s modifiers instead.

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
import { Text, VStack } from '@tachui/primitives'
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
          VStack({
            children: [
              Text(item.title).fontWeight('bold'),
              Text(item.description),
            ],
            spacing: 4,
          })
            .padding(16)
            .cornerRadius(8)
            .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
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
