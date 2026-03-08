# SimpleTabView Component

SimpleTabView provides SwiftUI-compatible tab-based navigation with clean APIs and automatic state management, replacing complex coordinator patterns with simple, declarative syntax.

## Overview

SimpleTabView matches SwiftUI's TabView API with the `.tabItem()` modifier pattern, providing intuitive tab navigation without the complexity of coordinator systems.

```typescript
import { SimpleTabView, tabItem } from '@tachui/navigation'

// Basic SimpleTabView - SwiftUI compatible
SimpleTabView([
  tabItem('home', 'Home', HomeView()),
  tabItem('settings', 'Settings', SettingsView())
])
```

## SwiftUI Compatibility

SimpleTabView provides SwiftUI-compatible tab navigation:

```typescript
// This SwiftUI pattern...
TabView {
  HomeView().tabItem { Label("Home", systemImage: "house") }
  SettingsView().tabItem { Label("Settings", systemImage: "gear") }
}

// ...works similarly in TachUI
SimpleTabView([
  tabItem('home', 'Home', HomeView(), { icon: '🏠' }),
  tabItem('settings', 'Settings', SettingsView(), { icon: '⚙️' })
])
```

## Basic Usage

### Simple Tab Navigation

```typescript
import { SimpleTabView, tabItem } from '@tachui/navigation'
import { Text, VStack } from '@tachui/core'

const HomeView = () => VStack([Text('Home Content')])
const ProfileView = () => VStack([Text('Profile Content')])
const SettingsView = () => VStack([Text('Settings Content')])

const App = SimpleTabView([
  tabItem('home', 'Home', HomeView()),
  tabItem('profile', 'Profile', ProfileView()),
  tabItem('settings', 'Settings', SettingsView())
])
```

### Tabs with Icons

```typescript
const App = SimpleTabView([
  tabItem('home', 'Home', HomeView(), {
    icon: '🏠'
  }),
  tabItem('search', 'Search', SearchView(), {
    icon: '🔍'
  }),
  tabItem('profile', 'Profile', ProfileView(), {
    icon: '👤'
  }),
  tabItem('settings', 'Settings', SettingsView(), {
    icon: '⚙️'
  })
])
```

## Tab Item Configuration

### Basic Tab Item

```typescript
import { tabItem } from '@tachui/navigation'

// Simple tab item
tabItem(
  'home',        // id
  'Home',        // title
  HomeView()     // content
)
```

### Advanced Tab Item Options

```typescript
interface SimpleTabItemOptions {
  icon?: string
  badge?: string | number
  disabled?: boolean
  accessibilityLabel?: string
}

tabItem(
  'notifications',
  'Notifications',
  NotificationsView(),
  {
    icon: '🔔',
    badge: unreadCount(),
    disabled: false,
    accessibilityLabel: 'View notifications'
  }
)
```

## Tab Selection Management

### Controlled Tab Selection

```typescript
import { createBinding } from '@tachui/core'

const TabNavigationApp = () => {
  const [selectedTab, setSelectedTab] = createBinding('home')
  
  return SimpleTabView([
    tabItem('home', 'Home', HomeView()),
    tabItem('profile', 'Profile', ProfileView()),
    tabItem('settings', 'Settings', SettingsView())
  ], {
    selection: selectedTab
  })
}
```

### Tab Change Handling

```typescript
const App = SimpleTabView([
  tabItem('home', 'Home', HomeView()),
  tabItem('analytics', 'Analytics', AnalyticsView()),
  tabItem('settings', 'Settings', SettingsView())
], {
  onSelectionChange: (tabId) => {
    console.log(`Switched to tab: ${tabId}`)
    analytics.track('tab_changed', { tabId })
  }
})
```

## Dynamic Tab Management

### Conditional Tabs

```typescript
const ConditionalTabApp = () => {
  const [isLoggedIn] = createSignal(true)
  const [isAdmin] = createSignal(false)
  
  const tabs = [
    tabItem('home', 'Home', HomeView()),
    tabItem('search', 'Search', SearchView())
  ]
  
  if (isLoggedIn()) {
    tabs.push(tabItem('profile', 'Profile', ProfileView()))
  }
  
  if (isAdmin()) {
    tabs.push(tabItem('admin', 'Admin', AdminView()))
  }
  
  return SimpleTabView(tabs)
}
```

### Tab Badges and Notifications

```typescript
const NotificationTabApp = () => {
  const [unreadMessages] = createSignal(5)
  const [hasUpdates] = createSignal(true)
  
  return SimpleTabView([
    tabItem('home', 'Home', HomeView()),
    
    tabItem('messages', 'Messages', MessagesView(), {
      icon: '💬',
      badge: unreadMessages() > 0 ? unreadMessages() : undefined
    }),
    
    tabItem('updates', 'Updates', UpdatesView(), {
      icon: '🔄',
      badge: hasUpdates() ? '●' : undefined
    }),
    
    tabItem('profile', 'Profile', ProfileView(), {
      icon: '👤'
    })
  ])
}
```

## Tab Navigation with Stack Navigation

### Nested Navigation

```typescript
import { NavigationStack } from '@tachui/navigation'

const TabWithStackApp = () => SimpleTabView([
  tabItem('home', 'Home', 
    NavigationStack(HomeContentView())
      .navigationTitle('Home')
  ),
  
  tabItem('browse', 'Browse',
    NavigationStack(BrowseContentView())
      .navigationTitle('Browse')
  ),
  
  tabItem('profile', 'Profile',
    NavigationStack(ProfileContentView())
      .navigationTitle('Profile')
  )
])

const HomeContentView = () => VStack([
  Text('Home Screen'),
  NavigationLink('Details', () => HomeDetailView())
])
```

## Tab Customization

### Tab Appearance

```typescript
const CustomizedTabApp = SimpleTabView([
  tabItem('home', 'Home', HomeView()),
  tabItem('settings', 'Settings', SettingsView())
], {
  appearance: {
    backgroundColor: '#f8f9fa',
    selectedColor: '#007AFF',
    unselectedColor: '#8E8E93',
    badgeColor: '#FF3B30'
  }
})
```

### Tab Bar Position

```typescript
const App = SimpleTabView([
  tabItem('tab1', 'Tab 1', Tab1View()),
  tabItem('tab2', 'Tab 2', Tab2View())
], {
  tabBarPosition: 'bottom', // 'bottom' | 'top'
  hideTabBarOnScroll: false
})
```

## SimpleTabView Builder Pattern

For complex tab configurations:

```typescript
import { createSimpleTabView } from '@tachui/navigation'

const complexTabView = createSimpleTabView()
  .addTab('home', 'Home', HomeView(), { icon: '🏠' })
  .addTab('search', 'Search', SearchView(), { icon: '🔍' })
  .addTab('favorites', 'Favorites', FavoritesView(), { 
    icon: '❤️',
    badge: favoriteCount
  })
  .setSelection(selectedTab)
  .onSelectionChange(handleTabChange)
  .build()
```

## Performance Optimization

SimpleTabView is highly optimized:

- **Lazy Tab Loading**: Tab content loaded only when first accessed
- **Memory Management**: Inactive tabs can be unloaded to save memory
- **Bundle Size**: 59% smaller than previous TabView implementations

```typescript
const OptimizedTabApp = SimpleTabView([
  tabItem('home', 'Home', () => lazy(() => import('./HomeView'))),
  tabItem('heavy', 'Heavy', () => lazy(() => import('./HeavyView')))
], {
  lazyLoading: true,
  unloadInactiveTabs: true,
  preloadAdjacent: true
})
```

## Accessibility

SimpleTabView provides comprehensive accessibility support:

```typescript
const AccessibleTabApp = SimpleTabView([
  tabItem('home', 'Home', HomeView(), {
    accessibilityLabel: 'Home tab',
    accessibilityHint: 'Navigate to home screen'
  }),
  tabItem('settings', 'Settings', SettingsView(), {
    accessibilityLabel: 'Settings tab',
    accessibilityHint: 'Configure app settings'
  })
], {
  accessibilityRole: 'tablist',
  keyboardNavigation: true
})
```

## Testing SimpleTabView

SimpleTabView components are fully testable:

```typescript
import { render, fireEvent } from '@testing-library/dom'
import { SimpleTabView, tabItem } from '@tachui/navigation'

test('tab navigation', () => {
  const app = SimpleTabView([
    tabItem('home', 'Home', Text('Home Content')),
    tabItem('settings', 'Settings', Text('Settings Content'))
  ])
  
  const { getByText, getByRole } = render(app)
  
  // Verify initial tab
  expect(getByText('Home Content')).toBeInTheDocument()
  
  // Switch to settings tab
  fireEvent.click(getByText('Settings'))
  expect(getByText('Settings Content')).toBeInTheDocument()
  
  // Verify tab accessibility
  const tablist = getByRole('tablist')
  expect(tablist).toBeInTheDocument()
})
```

## Animation & Transitions

SimpleTabView supports smooth tab transitions:

```typescript
const AnimatedTabApp = SimpleTabView([
  tabItem('tab1', 'Tab 1', Tab1View()),
  tabItem('tab2', 'Tab 2', Tab2View())
], {
  transition: {
    type: 'fade',
    duration: 200,
    easing: 'ease-in-out'
  }
})
```

## Common Patterns

### Tab with Navigation State

```typescript
const StatefulTabApp = () => {
  const [homeNavigationState] = createNavigationState('home')
  const [settingsNavigationState] = createNavigationState('settings')
  
  return SimpleTabView([
    tabItem('home', 'Home', 
      NavigationStack(HomeView(), { 
        navigationState: homeNavigationState 
      })
    ),
    tabItem('settings', 'Settings',
      NavigationStack(SettingsView(), {
        navigationState: settingsNavigationState
      })
    )
  ])
}
```

### Tab with Authentication

```typescript
const AuthenticatedTabApp = () => {
  const [isLoggedIn] = createSignal(checkAuthStatus())
  
  return Show({
    when: isLoggedIn,
    children: () => SimpleTabView([
      tabItem('dashboard', 'Dashboard', DashboardView()),
      tabItem('profile', 'Profile', ProfileView()),
      tabItem('settings', 'Settings', SettingsView())
    ]),
    fallback: () => LoginView()
  })
}
```

## API Reference

### SimpleTabView Function Signature

```typescript
function SimpleTabView(
  tabs: SimpleTabItem[],
  options?: SimpleTabViewOptions
): ComponentInstance
```

### SimpleTabItem Interface

```typescript
interface SimpleTabItem {
  id: string
  title: string
  content: ComponentInstance | (() => ComponentInstance)
  icon?: string
  badge?: string | number
  disabled?: boolean
  accessibilityLabel?: string
}
```

### SimpleTabViewOptions Interface

```typescript
interface SimpleTabViewOptions {
  selection?: Binding<string>
  onSelectionChange?: (tabId: string) => void
  tabBarPosition?: 'top' | 'bottom'
  appearance?: TabAppearanceOptions
  lazyLoading?: boolean
  transition?: TabTransitionOptions
  accessibilityRole?: string
  keyboardNavigation?: boolean
}
```

## Migration from Complex TabView

If migrating from the old complex TabView with coordinators:

```typescript
// Before (complex coordinator pattern)
import { TabView, createTabCoordinator } from '@tachui/navigation'
const coordinator = createTabCoordinator(tabs)
TabView(tabs, { coordinator })

// After (simple declarative pattern)
import { SimpleTabView, tabItem } from '@tachui/navigation'
SimpleTabView([
  tabItem('home', 'Home', HomeView()),
  tabItem('settings', 'Settings', SettingsView())
])
```

For complete API documentation, see the [Navigation API Reference](/api/navigation).