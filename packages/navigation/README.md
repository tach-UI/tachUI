# @tachui/navigation

SwiftUI-inspired navigation components for TachUI. This package provides stack-based and tab-based navigation with automatic back button handling, URL routing, and deep linking support.

## Installation

```bash
npm install @tachui/navigation @tachui/core
# or
pnpm add @tachui/navigation @tachui/core
# or
yarn add @tachui/navigation @tachui/core
```

## Overview

The navigation package includes:

- **NavigationView**: Stack-based navigation with automatic back button
- **NavigationLink**: Declarative navigation to other views  
- **TabView**: Tab-based navigation interface
- **EnhancedTabView**: Modern SwiftUI features (floating tabs, customization)
- **Navigation Router**: Programmatic navigation and URL routing
- **Navigation Manager**: Global navigation state management

## Quick Start

### Stack Navigation

```typescript
import { NavigationView, NavigationLink } from '@tachui/navigation'
import { Text, VStack, Button } from '@tachui/core'

// Root view
const ContentView = () => VStack([
  Text('Home'),
  NavigationLink(() => DetailView(), 'Go to Detail')
])

// Detail view
const DetailView = () => VStack([
  Text('Detail View'),
  NavigationLink(() => AnotherView(), 'Go Further')
])

// App with navigation
const App = NavigationView(() => ContentView(), {
  title: 'My App',
  navigationBarTitleDisplayMode: 'large'
})
```

### Tab Navigation

```typescript
import { TabView } from '@tachui/navigation'
import { Text, VStack } from '@tachui/core'

const App = TabView([
  {
    id: 'home',
    title: 'Home',
    icon: '🏠',
    view: () => VStack([Text('Home Content')])
  },
  {
    id: 'profile', 
    title: 'Profile',
    icon: '👤',
    view: () => VStack([Text('Profile Content')])
  }
], {
  tabPlacement: 'bottom'
})
```

### Programmatic Navigation

```typescript
import { createNavigationRouter } from '@tachui/navigation'

const router = createNavigationRouter({
  '/home': () => HomeView(),
  '/profile': () => ProfileView(),
  '/detail/:id': ({ id }) => DetailView(id)
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
  '/search': ({ query, page }) => SearchView(query, page)
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
    handleUnknownRoutes: (path) => NotFoundView(path)
  }
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
      duration: 0.3
    },
    pop: {
      type: 'slide', 
      direction: 'right',
      duration: 0.3
    }
  }
})
```

### Navigation Persistence

```typescript
NavigationView(() => ContentView(), {
  persistence: {
    enabled: true,
    key: 'main-navigation',
    storage: 'localStorage' // or 'sessionStorage'
  }
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
      tabs: ['home', 'search', 'favorites']
    },
    {
      id: 'account',
      title: 'Account', 
      tabs: ['profile', 'settings']
    }
  ]
})
```

## Integration with TachUI Core

Navigation components work seamlessly with all TachUI Core components and the modifier system:

```typescript
NavigationView(() => ContentView())
  .modifier
  .padding(16)
  .backgroundColor('#f5f5f5')
  .build()
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { 
  NavigationDestination,
  NavigationContext,
  TabItem,
  NavigationRouter
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