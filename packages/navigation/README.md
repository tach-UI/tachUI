# @tachui/navigation

> Navigation components and routing utilities for tachUI framework

[![npm version](https://img.shields.io/npm/v/@tachui/navigation.svg)](https://www.npmjs.com/package/@tachui/navigation)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

The tachUI navigation package provides SwiftUI-compatible navigation components including NavigationView, TabView, and routing utilities for building multi-screen applications with smooth transitions and deep linking support.

## Features

- 🧭 **NavigationView & NavigationStack** - Hierarchical navigation with back button support
- 📑 **TabView** - Tab-based navigation with customizable tab bars
- 🔗 **Deep Linking** - URL-based navigation with parameter parsing
- 🎨 **Customizable Transitions** - Smooth page transitions and animations
- 📱 **Mobile-optimized** - Touch gestures and mobile navigation patterns
- 🔧 **TypeScript-first** - Complete type safety for routing and navigation

## Installation

```bash
npm install @tachui/core @tachui/navigation
# or
pnpm add @tachui/core @tachui/navigation
```

## Quick Start

### Subpath Imports (Recommended)

Prefer focused subpaths when you only need part of navigation:

```typescript
import { NavigationStack } from '@tachui/navigation/stack'
import { NavigationLink } from '@tachui/navigation/link'
import { TabView } from '@tachui/navigation/tabs'
import { NavigationPath } from '@tachui/navigation/path'
import { NavigationEnvironmentProvider } from '@tachui/navigation/environment'
import { sheet, fullScreenCover, popover } from '@tachui/navigation/sheet'
import { navigationTitle } from '@tachui/navigation/modifiers'
```

Available subpaths:

- `@tachui/navigation/stack`
- `@tachui/navigation/link`
- `@tachui/navigation/tabs`
- `@tachui/navigation/path`
- `@tachui/navigation/environment`
- `@tachui/navigation/sheet`
- `@tachui/navigation/modifiers`
- `@tachui/navigation/modifiers/register` (explicitly side-effectful registration for modifier-builder patching)
- `@tachui/navigation/types`

Use root `@tachui/navigation` when you intentionally want the full legacy surface.

### Stack Navigation

```typescript
import { NavigationView, NavigationLink } from '@tachui/navigation'
import { Text, VStack, Button } from '@tachui/core'

// Root view
const ContentView = () =>
  VStack([Text('Home'), NavigationLink(() => DetailView(), 'Go to Detail')])

// Detail view
const DetailView = () =>
  VStack([
    Text('Detail View'),
    NavigationLink(() => AnotherView(), 'Go Further'),
  ])

// App with navigation
const App = NavigationView(() => ContentView(), {
  title: 'My App',
  navigationBarTitleDisplayMode: 'large',
})
```

### Tab Navigation

```typescript
import { TabView } from '@tachui/navigation'
import { Text, VStack } from '@tachui/core'

const App = TabView(
  [
    {
      id: 'home',
      title: 'Home',
      icon: '🏠',
      view: () => VStack([Text('Home Content')]),
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: '👤',
      view: () => VStack([Text('Profile Content')]),
    },
  ],
  {
    tabPlacement: 'bottom',
  }
)
```

### Programmatic Navigation

```typescript
import { createNavigationRouter } from '@tachui/navigation'

const router = createNavigationRouter({
  '/home': () => HomeView(),
  '/profile': () => ProfileView(),
  '/detail/:id': ({ id }) => DetailView(id),
})

// Navigate programmatically
router.push('/detail/123')
router.pop()
router.popToRoot()
```

## Components

### NavigationView

Stack-based navigation with automatic back button handling and navigation bar.

```typescript
NavigationView(
  rootView: () => ComponentInstance,
  options?: {
    title?: string
    navigationBarTitleDisplayMode?: 'automatic' | 'inline' | 'large'
    navigationBarHidden?: boolean
    navigationBarBackButtonHidden?: boolean
    // ... more options
  }
)
```

### NavigationLink

Declarative navigation that pushes views onto the navigation stack.

```typescript
NavigationLink(
  destination: () => ComponentInstance,
  label?: string | ComponentInstance,
  options?: {
    style?: 'plain' | 'button' | 'card' | 'listItem'
    icon?: string
    // ... more options
  }
)
```

### TabView

Tab-based navigation with customizable tab bars and selection binding.

```typescript
TabView(
  tabs: TabItem[],
  options?: {
    tabPlacement?: 'bottom' | 'top'
    selectedTab?: Signal<string>
    onTabChange?: (tabId: string) => void
    // ... more options
  }
)
```

### EnhancedTabView

Modern SwiftUI tab features with floating tabs and user customization.

```typescript
EnhancedTabView(
  tabs: TabItem[],
  options?: {
    style?: 'automatic' | 'floating' | 'sidebar' | 'sidebar-adaptable'
    customization?: 'none' | 'visible' | 'hidden'
    sections?: TabSection[]
    // ... more options
  }
)
```

## Navigation Router

### Creating Routes

```typescript
import { createNavigationRouter } from '@tachui/navigation'

const router = createNavigationRouter({
  // Static routes
  '/': () => HomeView(),
  '/about': () => AboutView(),

  // Dynamic routes with parameters
  '/user/:id': ({ id }) => UserView(id),
  '/post/:id/comments': ({ id }) => CommentsView(id),

  // Wildcard routes
  '/admin/*': () => AdminView(),

  // Query parameter handling
  '/search': ({ query, page }) => SearchView(query, page),
})
```

### Navigation Methods

```typescript
// Push new view
router.push('/user/123')
router.push('/search?query=tachui&page=1')

// Pop back
router.pop()
router.popToRoot()
router.popTo('/home')

// Replace current view
router.replace('/login')

// Check navigation state
const canGoBack = router.canGoBack()
const currentPath = router.currentPath()
```

### Deep Linking

```typescript
const router = createNavigationRouter(routes, {
  deepLinking: {
    enabled: true,
    baseURL: 'https://myapp.com',
    handleUnknownRoutes: path => NotFoundView(path),
  },
})
```

## Advanced Usage

### Custom Navigation Transitions

```typescript
NavigationView(() => ContentView(), {
  navigationTransition: {
    push: {
      type: 'slide',
      direction: 'left',
      duration: 0.3,
    },
    pop: {
      type: 'slide',
      direction: 'right',
      duration: 0.3,
    },
  },
})
```

### Navigation Persistence

```typescript
NavigationView(() => ContentView(), {
  persistence: {
    enabled: true,
    key: 'main-navigation',
    storage: 'localStorage', // or 'sessionStorage'
  },
})
```

### Hierarchical Tab Sections

```typescript
EnhancedTabView(tabs, {
  style: 'sidebar-adaptable',
  sections: [
    {
      id: 'main',
      title: 'Main',
      tabs: ['home', 'search', 'favorites'],
    },
    {
      id: 'account',
      title: 'Account',
      tabs: ['profile', 'settings'],
    },
  ],
})
```

## Integration with TachUI Core

Navigation components work seamlessly with all TachUI Core components and the modifier system:

```typescript
NavigationView(() => ContentView())
  .modifier.padding(16)
  .backgroundColor('#f5f5f5')
  
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  NavigationDestination,
  NavigationContext,
  TabItem,
  NavigationRouter,
} from '@tachui/navigation'
```

## Bundle Size

- **Core navigation**: ~15KB gzipped
- **Enhanced features**: Additional ~8KB gzipped
- **Tree-shakable**: Only import what you need

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with modern JavaScript support

## License

MPL-2.0
