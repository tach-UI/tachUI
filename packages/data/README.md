# @tachui/data

> Data display and organization components for tachUI framework

[![npm version](https://img.shields.io/npm/v/@tachui/data.svg)](https://www.npmjs.com/package/@tachui/data)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

The tachUI data package provides essential components for displaying and organizing data including lists and menus with advanced features like virtual scrolling, contextual menus, and flexible content organization.

## Features

- 📋 **Advanced Lists** - Virtual scrolling, sectioned data, selection modes, swipe actions
- 🎯 **Contextual Menus** - Dropdowns, positioning, keyboard navigation, nested submenus
- ⚡ **Performance Optimized** - Virtual scrolling for large datasets, efficient updates
- 🎨 **SwiftUI-inspired API** - Familiar component patterns and modifiers
- 🔧 **TypeScript-first** - Complete type safety with comprehensive interfaces
- 📱 **Responsive Design** - Adapts to different screen sizes and interaction patterns

## Installation

```bash
npm install @tachui/core@0.8.0-alpha @tachui/data@0.8.0-alpha
# or
pnpm add @tachui/core@0.8.0-alpha @tachui/data@0.8.0-alpha
```

## Quick Start

### Basic List

```typescript
import { VStack, Text } from '@tachui/primitives'
import { List } from '@tachui/data'

const items = [
  { id: 1, name: 'Item 1', category: 'A' },
  { id: 2, name: 'Item 2', category: 'A' },
  { id: 3, name: 'Item 3', category: 'B' },
]

const app = VStack({
  children: [
    List({
      data: items,
      renderItem: item => Text(item.name),
    })
      .modifier.padding(16)
      .build(),
  ],
})
```

### Sectioned List with Headers

```typescript
import { List } from '@tachui/data'

const sectionedList = List({
  sections: [
    {
      id: 'favorites',
      header: 'Favorites',
      items: favoriteItems,
    },
    {
      id: 'recent',
      header: 'Recent',
      items: recentItems,
    },
  ],
  renderItem: item => Text(item.name),
  renderSectionHeader: section =>
    Text(section.header).modifier.fontWeight('bold'),
}).build()
```

### Contextual Menu

```typescript
import { Menu } from '@tachui/data'

const menuItems = [
  { id: 'edit', title: 'Edit', action: () => console.log('Edit') },
  {
    id: 'duplicate',
    title: 'Duplicate',
    action: () => console.log('Duplicate'),
  },
  {
    id: 'delete',
    title: 'Delete',
    role: 'destructive',
    action: () => console.log('Delete'),
  },
]

const menu = Menu({
  items: menuItems,
  placement: 'bottom-start',
}).build()
```

## Components

### List Component

Advanced list component with virtual scrolling, selection, and swipe actions.

#### Basic Usage

```typescript
import { List } from '@tachui/data'

const list = List({
  data: items,
  renderItem: (item, index) => Text(`${index + 1}. ${item.name}`),
}).build()
```

#### Virtual Scrolling

```typescript
const virtualList = List({
  data: largeDataset,
  renderItem: item => Text(item.name),
  virtualScrolling: {
    enabled: true,
    itemHeight: 50, // Fixed height for performance
    overscan: 5, // Extra items to render
  },
}).build()
```

#### Sectioned List

```typescript
const sectionedList = List({
  sections: [
    {
      id: 'group1',
      header: 'Group 1',
      footer: '3 items',
      items: group1Items,
    },
    {
      id: 'group2',
      header: 'Group 2',
      items: group2Items,
    },
  ],
  renderItem: item => Text(item.name),
  renderSectionHeader: section =>
    Text(section.header).modifier.fontWeight('bold'),
  renderSectionFooter: section =>
    section.footer ? Text(section.footer).modifier.fontSize(12) : undefined,
}).build()
```

#### Selection Modes

```typescript
const selectableList = List({
  data: items,
  renderItem: (item, index) => Text(item.name),
  selectionMode: 'multiple', // 'none' | 'single' | 'multiple'
  selectedItems: selectedItemsSignal,
  onSelectionChange: selected => {
    console.log('Selected items:', selected)
  },
}).build()
```

#### Swipe Actions

```typescript
const swipeableList = List({
  data: items,
  renderItem: item => Text(item.name),
  leadingSwipeActions: item => [
    {
      id: 'favorite',
      title: 'Favorite',
      backgroundColor: '#FFD700',
      icon: 'star',
      onTap: () => favoriteItem(item),
    },
  ],
  trailingSwipeActions: item => [
    {
      id: 'delete',
      title: 'Delete',
      backgroundColor: '#FF3B30',
      destructive: true,
      onTap: () => deleteItem(item),
    },
  ],
}).build()
```

### Menu Component

Contextual menu component with positioning and keyboard navigation.

#### Basic Dropdown Menu

```typescript
import { Menu } from '@tachui/data'

const dropdownMenu = Menu({
  items: [
    { id: 'new', title: 'New Document', action: () => createNew() },
    { id: 'open', title: 'Open...', action: () => openFile() },
    { id: 'separator', title: '' }, // Visual separator
    { id: 'exit', title: 'Exit', action: () => exitApp() },
  ],
  placement: 'bottom-start',
}).build()
```

#### Nested Submenus

```typescript
const nestedMenu = Menu({
  items: [
    {
      id: 'file',
      title: 'File',
      submenu: [
        { id: 'new', title: 'New', action: () => createNew() },
        { id: 'open', title: 'Open', action: () => openFile() },
        { id: 'save', title: 'Save', action: () => saveFile() },
      ],
    },
    {
      id: 'edit',
      title: 'Edit',
      submenu: [
        { id: 'undo', title: 'Undo', action: () => undo() },
        { id: 'redo', title: 'Redo', action: () => redo() },
      ],
    },
  ],
}).build()
```

#### Menu with Icons and Shortcuts

```typescript
const advancedMenu = Menu({
  items: [
    {
      id: 'save',
      title: 'Save',
      systemImage: 'square.and.arrow.down',
      shortcut: '⌘S',
      action: () => save(),
    },
    {
      id: 'export',
      title: 'Export...',
      systemImage: 'arrow.up.doc',
      submenu: [
        { id: 'pdf', title: 'PDF', action: () => exportPDF() },
        { id: 'png', title: 'PNG', action: () => exportPNG() },
      ],
    },
  ],
  placement: 'bottom-end',
}).build()
```

## Advanced Features

### Virtual Scrolling

For large datasets, enable virtual scrolling to maintain performance:

```typescript
const virtualList = List({
  data: largeDataset, // 10,000+ items
  renderItem: item => Text(item.name),
  virtualScrolling: {
    enabled: true,
    itemHeight: 44, // Fixed height for performance
    estimatedItemHeight: 44,
    overscan: 10, // Extra items to render
    threshold: 100, // Distance from viewport to trigger loading
  },
}).build()
```

### Infinite Scrolling

Load data progressively as the user scrolls:

```typescript
const [data, setData] = createSignal(initialData)
const [hasMore, setHasMore] = createSignal(true)

const infiniteList = List({
  data,
  renderItem: item => Text(item.name),
  infiniteScrolling: {
    enabled: true,
    hasMore,
    onLoadMore: async () => {
      const newData = await loadMoreData()
      setData([...data(), ...newData])
      setHasMore(newData.length > 0)
    },
  },
}).build()
```

### Reactive Data

Lists automatically update when reactive data changes:

```typescript
const [items, setItems] = createSignal([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
])

const reactiveList = List({
  data: items, // Signal-based data
  renderItem: item => Text(item.name),
}).build()

// Update data reactively
setItems([...items(), { id: 3, name: 'Item 3' }])
```

### Custom Item IDs

For better performance with large datasets:

```typescript
const listWithIds = List({
  data: items,
  renderItem: item => Text(item.name),
  getItemId: (item, index) => item.id || `item-${index}`,
}).build()
```

## Performance Optimization

### Bundle Size Optimization

Import only what you need for smaller bundles:

```typescript
// Import specific components
import { List } from '@tachui/data/list'
import { Menu } from '@tachui/data/menu'

// Or import everything
import { List, Menu } from '@tachui/data'
```

### Memory Management

The components automatically handle cleanup:

- Event listeners are properly removed
- Reactive effects are disposed
- Virtual scrolling caches are cleared
- DOM nodes are efficiently updated

### Rendering Performance

- **Virtual scrolling** for large lists
- **Reactive updates** only re-render changed items
- **Efficient diffing** for minimal DOM updates
- **Lazy loading** for images and content

## Accessibility

All components include comprehensive accessibility features:

- **ARIA labels** and descriptions
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Focus management** for modals and menus
- **Semantic HTML** structure

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
interface CustomItem {
  id: number
  name: string
  category: string
  completed: boolean
}

const typedList = List<CustomItem>({
  data: items,
  renderItem: item => Text(item.name),
  // TypeScript knows item is CustomItem
}).build()
```

## Browser Support

- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **ES2020+** features supported
- **CSS Grid** and **Flexbox** required
- **Intersection Observer** for virtual scrolling

## API Reference

### List Props

```typescript
interface ListProps<T = any> {
  // Data
  data?: T[] | Signal<T[]>
  sections?: ListSection<T>[] | Signal<ListSection<T>[]>

  // Rendering
  renderItem: (item: T, index: number) => ComponentInstance
  renderSectionHeader?: (
    section: ListSection<T>,
    index: number
  ) => ComponentInstance
  renderSectionFooter?: (
    section: ListSection<T>,
    index: number
  ) => ComponentInstance

  // Appearance
  style?: ListStyle
  separator?: boolean | ComponentInstance

  // Selection
  selectionMode?: SelectionMode
  selectedItems?: Signal<Set<string | number>>
  onSelectionChange?: (selectedItems: Set<string | number>) => void

  // Item actions
  leadingSwipeActions?: (item: T, index: number) => SwipeAction[]
  trailingSwipeActions?: (item: T, index: number) => SwipeAction[]
  onItemTap?: (item: T, index: number) => void
  onItemLongPress?: (item: T, index: number) => void

  // Virtual scrolling
  virtualScrolling?: VirtualScrollConfig

  // Infinite scrolling
  infiniteScrolling?: InfiniteScrollConfig

  // Performance
  getItemId?: (item: T, index: number) => string | number

  // Empty state
  emptyState?: ComponentInstance
}
```

### Menu Props

```typescript
interface MenuProps {
  items: MenuItem[]
  placement?: MenuPlacement
  trigger?: ComponentInstance
  isOpen?: Signal<boolean>
  onOpenChange?: (isOpen: boolean) => void
  keyboardNavigation?: boolean
  closeOnSelect?: boolean
}
```

## Contributing

See the main [Contributing Guide](https://github.com/tach-UI/tachUI/blob/main/CONTRIBUTING.md) for information on contributing to tachUI data components.

## License

Mozilla Public License 2.0 - see [LICENSE](https://github.com/tach-UI/tachUI/blob/main/LICENSE) for details.</content>
</xai:function_call: write_file>./tachUI/packages/data/README.md
