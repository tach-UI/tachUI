# Navigation Guide

TachUI's navigation system provides 100% SwiftUI-compatible navigation components through the dedicated `@tachui/navigation` package. TachUI Navigation matches SwiftUI APIs exactly, enabling direct code transfer between platforms.

## Installation

Navigation components are provided through a separate package with optimized bundle size:

```bash
npm install @tachui/navigation @tachui/core
# or
pnpm add @tachui/navigation @tachui/core
# or  
yarn add @tachui/navigation @tachui/core
```

**Bundle Impact**: Only +18KB gzipped (82KB total) - 59% smaller than previous versions.

## Core Navigation Components

### NavigationStack - Modern Stack Navigation

NavigationStack provides SwiftUI-compatible stack-based navigation with automatic path management and environment integration.

```typescript
import { NavigationStack, NavigationLink } from '@tachui/navigation'
import { Text, VStack } from '@tachui/core'

// Root view with navigation - SwiftUI compatible syntax
const ContentView = () => VStack([
  Text('Home Screen'),
  NavigationLink('Go to Detail', () => DetailView()),
  NavigationLink('Settings', () => SettingsView())
])

// Detail view
const DetailView = () => VStack([
  Text('Detail View'),
  NavigationLink('Go Further', () => AnotherDetailView())
])

// App with navigation container - matches SwiftUI exactly
const App = NavigationStack(ContentView())
  .navigationTitle('My App')
  .navigationBarTitleDisplayMode('large')
```

#### Navigation Bar Configuration

```typescript
NavigationView(() => ContentView(), {
  // Title display
  title: 'App Title',
  navigationBarTitleDisplayMode: 'automatic' | 'inline' | 'large',
  
  // Visibility
  navigationBarHidden: false,
  navigationBarBackButtonHidden: false,
  
  // Custom buttons
  navigationBarTrailingButton: Button('Done', () => handleDone()),
  navigationBarLeadingButton: Button('Cancel', () => handleCancel()),
  
  // Styling
  navigationBarColor: '#007AFF',
  navigationBarTitleColor: '#FFFFFF'
})
```

### NavigationLink - SwiftUI-Compatible Navigation

NavigationLink provides declarative navigation with SwiftUI parameter order that automatically manages the navigation stack.

```typescript
// Basic navigation link - SwiftUI compatible parameter order
NavigationLink(
  'Link Text',           // Label (first parameter)
  () => DestinationView() // Destination view (second parameter)
)

// Custom styled navigation link
NavigationLink(
  () => ProfileView(userId),
  Button('View Profile', { variant: 'outlined' }),
  {
    style: 'button',       // 'plain' | 'button' | 'card' | 'listItem'
    icon: '👤',
    accessibilityLabel: 'View user profile'
  }
)

// Navigation link with programmatic control
const [isActive, setIsActive] = createSignal(false)

NavigationLink(
  () => DetailView(),
  'Conditional Link',
  {
    isActive,              // Control navigation programmatically
    onActivate: () => setIsActive(true)
  }
)
```

### SimpleTabView - SwiftUI-Compatible Tab Interface

SimpleTabView provides SwiftUI-compatible tab navigation with `.tabItem()` modifier patterns, replacing complex coordinator systems.

```typescript
import { SimpleTabView, tabItem } from '@tachui/navigation'

const App = SimpleTabView([
  tabItem('home', 'Home', HomeView(), {
    icon: '🏠',
    badge: unreadCount() > 0 ? unreadCount() : undefined
  }),
  tabItem('search', 'Search', SearchView(), {
    icon: '🔍'
  }),
  tabItem('profile', 'Profile', ProfileView(), {
    icon: '👤'
  })
], {
  selection: selectedTabBinding,
  onSelectionChange: (tabId) => handleTabChange(tabId)
})
```

#### Enhanced TabView Features

```typescript
import { EnhancedTabView } from '@tachui/navigation'

// Modern tab features
const App = EnhancedTabView(tabs, {
  style: 'floating',       // 'automatic' | 'floating' | 'sidebar'
  customization: 'visible', // 'none' | 'visible' | 'hidden'
  
  // Hierarchical sections
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

## Programmatic Navigation

### Navigation Router

Create programmatic navigation with URL-based routing:

```typescript
import { createNavigationRouter } from '@tachui/navigation'

const router = createNavigationRouter({
  // Static routes
  '/': () => HomeView(),
  '/about': () => AboutView(),
  
  // Dynamic routes with parameters
  '/user/:id': ({ id }) => UserView(id),
  '/post/:id/comments': ({ id }) => CommentsView(id),
  
  // Query parameters
  '/search': ({ query, page = '1' }) => SearchView(query, parseInt(page))
})

// Navigation methods
router.push('/user/123')           // Navigate to route
router.push('/search?query=tachui') // With query params
router.pop()                       // Go back
router.popToRoot()                 // Return to root
router.replace('/login')           // Replace current route

// Route information
const canGoBack = router.canGoBack()
const currentPath = router.currentPath()
const routeParams = router.getRouteParams()
```

### useNavigation Hook

Access navigation context within components:

```typescript
import { useNavigation } from '@tachui/navigation'

const MyComponent = () => {
  const navigation = useNavigation()
  
  const handleNavigate = () => {
    navigation.push(() => NextView(), '/next')
  }
  
  const handleGoBack = () => {
    navigation.pop()
  }
  
  return VStack([
    Button('Navigate Forward', handleNavigate),
    Button('Go Back', handleGoBack, {
      disabled: !navigation.canGoBack()
    })
  ])
}
```

## Navigation Patterns

### Master-Detail Navigation

```typescript
const MasterDetailApp = () => {
  const [selectedItem, setSelectedItem] = createSignal(null)
  
  return NavigationView(() => VStack([
    List({
      data: items,
      renderItem: (item) => NavigationLink(
        () => DetailView(item), 
        item.title
      )
    })
  ]), {
    title: 'Items'
  })
}
```

### Tab + Stack Navigation

```typescript
// Each tab can have its own navigation stack
const App = TabView([
  createTabItem({
    id: 'home',
    title: 'Home',
    icon: '🏠',
    view: () => NavigationView(() => HomeView(), { 
      title: 'Home' 
    })
  }),
  createTabItem({
    id: 'settings',
    title: 'Settings', 
    icon: '⚙️',
    view: () => NavigationView(() => SettingsView(), {
      title: 'Settings'
    })
  })
])
```

### Modal Navigation

```typescript
const [showModal, setShowModal] = createSignal(false)

const MainView = () => VStack([
  Button('Show Modal', () => setShowModal(true)),
  
  Show({
    when: showModal,
    children: () => NavigationView(() => ModalContent(), {
      title: 'Modal',
      navigationBarLeadingButton: Button('Done', () => setShowModal(false))
    })
  })
])
```

## Deep Linking & URL Integration

### Browser Integration

```typescript
const router = createNavigationRouter(routes, {
  deepLinking: {
    enabled: true,
    baseURL: 'https://myapp.com',
    handleUnknownRoutes: (path) => NotFoundView(path)
  },
  
  // History management
  history: {
    mode: 'browser',      // 'browser' | 'hash' | 'memory'
    base: '/app'
  }
})
```

### Custom URL Schemes

```typescript
// Handle custom schemes (mobile apps)
router.registerScheme('myapp', {
  'open': ({ path }) => handleDeepLink(path),
  'share': ({ content }) => handleShare(content)
})

// myapp://open?path=/user/123
// myapp://share?content=hello
```

## Navigation Accessibility

```typescript
NavigationView(() => ContentView(), {
  accessibilityLabel: 'Main navigation',
  
  // Screen reader announcements
  announceRouteChanges: true,
  
  // Keyboard navigation
  keyboardNavigation: {
    enabled: true,
    focusManagement: 'automatic'
  }
})

NavigationLink(
  () => DetailView(),
  'View Details',
  {
    accessibilityLabel: 'View item details',
    accessibilityHint: 'Navigate to detailed information about this item',
    accessibilityRole: 'link'
  }
)
```

## Animation & Transitions

```typescript
NavigationView(() => ContentView(), {
  navigationTransition: {
    push: {
      type: 'slide',
      direction: 'left', 
      duration: 0.3,
      easing: 'ease-out'
    },
    pop: {
      type: 'slide',
      direction: 'right',
      duration: 0.3,
      easing: 'ease-in'
    }
  }
})

TabView(tabs, {
  tabTransition: {
    type: 'fade',
    duration: 0.2
  }
})
```

## State Persistence

```typescript
NavigationView(() => ContentView(), {
  persistence: {
    enabled: true,
    key: 'main-navigation',
    storage: 'localStorage',    // 'localStorage' | 'sessionStorage' | 'memory'
    
    // What to persist
    include: ['navigationStack', 'selectedTab'],
    exclude: ['transientData']
  }
})
```

## Navigation Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/dom'
import { NavigationView, NavigationLink } from '@tachui/navigation'

test('navigation between views', () => {
  const app = NavigationView(() => VStack([
    Text('Home'),
    NavigationLink(() => Text('Detail'), 'Go to Detail')
  ]))
  
  render(app, container)
  
  // Navigate to detail
  fireEvent.click(screen.getByText('Go to Detail'))
  expect(screen.getByText('Detail')).toBeInTheDocument()
  
  // Navigate back
  fireEvent.click(screen.getByText('Back'))
  expect(screen.getByText('Home')).toBeInTheDocument()
})
```

## Bundle Size Impact

The navigation package provides significant bundle size benefits:

- **Core only**: ~60KB (no navigation)
- **Core + Navigation**: ~75KB (+15KB for navigation)
- **Tree-shakable**: Only import what you need

```typescript
// Import only what you need
import { NavigationView } from '@tachui/navigation'        // ~8KB
import { TabView } from '@tachui/navigation'              // ~6KB  
import { createNavigationRouter } from '@tachui/navigation' // ~5KB
```

## Migration from Core

If you were previously using navigation from `@tachui/core`:

```typescript
// Before
import { NavigationView, TabView } from '@tachui/core/navigation'

// After  
import { NavigationView, TabView } from '@tachui/navigation'
```

All APIs remain identical - only the import path has changed.

## Best Practices

1. **Use NavigationView for hierarchical content** - Perfect for drill-down interfaces
2. **Use TabView for peer content** - Best for content that's equally important
3. **Combine both for complex apps** - Tabs with individual navigation stacks
4. **Handle navigation state** - Always provide fallback routes and error handling
5. **Test navigation flows** - Ensure all paths are accessible and functional
6. **Optimize for accessibility** - Provide clear labels and keyboard navigation
7. **Consider mobile patterns** - Use appropriate navigation for screen sizes

## Advanced Topics

- Navigation Performance Optimization
- Custom Navigation Components
- Navigation State Management  
- Mobile Navigation Patterns