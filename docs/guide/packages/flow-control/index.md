---
title: '@tachui/flow-control'
---

# @tachui/flow-control

Flow control components for conditional rendering and data iteration in tachUI applications.

## Overview

The `@tachui/flow-control` package provides essential components for controlling flow of your tachUI applications, including conditional rendering and data iteration patterns inspired by SwiftUI.

## Installation

```bash
npm install @tachui/flow-control@0.9.0
# or
pnpm add @tachui/flow-control@0.9.0
```

## Components

### Show

Conditionally renders content based on a reactive condition.

```typescript
import { Show } from '@tachui/flow-control'
import { createSignal, Text } from '@tachui/core'

const [isVisible, setIsVisible] = createSignal(false)

Show({
  when: () => isVisible(),
  children: Text('This content is conditionally shown'),
})
```

### ForEach

Renders a list of items with efficient updates and proper cleanup.

```typescript
import { ForEach } from '@tachui/flow-control'
import { createSignal, Text } from '@tachui/core'

const items = createSignal(['Item 1', 'Item 2', 'Item 3'])

ForEach({
  data: () => items(),
  renderItem: (item: string, index: number) => Text(`${index}: ${item}`),
})
```

## Features

- **Reactive Updates**: Automatically updates when conditions change
- **Efficient Rendering**: Minimal DOM updates using fine-grained reactivity
- **SwiftUI-Inspired**: Familiar API for SwiftUI developers
- **TypeScript Support**: Full type safety with excellent IntelliSense
- **Performance Optimized**: Smart diffing and minimal re-renders

## API Reference

### Show Props

| Prop       | Type                                       | Description                              |
| ---------- | ------------------------------------------ | ---------------------------------------- |
| `when`     | `() => boolean`                            | Reactive condition for rendering         |
| `children` | `ComponentInstance \| ComponentInstance[]` | Content to render when condition is true |
| `fallback` | `ComponentInstance`                        | Optional content when condition is false |

### ForEach Props

| Prop         | Type                                            | Description                                 |
| ------------ | ----------------------------------------------- | ------------------------------------------- |
| `data`       | `() => T[]`                                     | Reactive array of items to render           |
| `renderItem` | `(item: T, index: number) => ComponentInstance` | Function to render each item                |
| `keyFn`      | `(item: T, index: number) => string \| number`  | Optional key function for efficient updates |

## Usage with Other Packages

Flow control components work seamlessly with other tachUI packages:

```typescript
import { VStack, Text, Button } from '@tachui/primitives'
import { Show, ForEach } from '@tachui/flow-control'
import { createSignal } from '@tachui/core'

const [items, setItems] = createSignal<string[]>([])
const [showList, setShowList] = createSignal(false)

VStack({
  children: [
    Button('Toggle List', () => setShowList(!showList())),

    Show({
      when: () => showList(),
      children: ForEach({
        data: () => items(),
        renderItem: item => Text(item),
      }),
    }),
  ],
})
```

## Performance Considerations

- Use `keyFn` with ForEach for better performance with dynamic lists
- Avoid creating new objects in render functions
- Prefer signals over direct state access for reactive conditions

## License

This package is part of tachUI framework and is licensed under MPL-2.0 License.
