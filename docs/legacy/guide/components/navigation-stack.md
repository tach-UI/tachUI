# NavigationStack Component

NavigationStack provides SwiftUI-compatible stack-based navigation with automatic path management and seamless integration with TachUI's reactive system.

## Overview

NavigationStack is TachUI's modern navigation component that matches SwiftUI's NavigationStack API exactly, providing declarative navigation with type-safe routing and automatic back button handling.

```typescript
import { NavigationStack, NavigationLink } from '@tachui/navigation'

// Basic NavigationStack
NavigationStack(
  NavigationLink('Home', () => HomeView()),
  {
    navigationTitle: 'My App'
  }
)
```

## SwiftUI Compatibility

NavigationStack provides 100% API compatibility with SwiftUI's NavigationStack:

```typescript
// This SwiftUI code...
NavigationStack {
  NavigationLink("Home", destination: HomeView())
}
.navigationTitle("My App")

// ...works identically in TachUI
NavigationStack(
  NavigationLink('Home', () => HomeView())
).navigationTitle('My App')
```

## Basic Usage

### Simple Navigation Stack

```typescript
import { NavigationStack, NavigationLink } from '@tachui/navigation'
import { VStack, Text } from '@tachui/core'

const ContentView = () => VStack([
  Text('Welcome to the app'),
  NavigationLink('Settings', () => SettingsView()),
  NavigationLink('Profile', () => ProfileView())
])

const App = NavigationStack(ContentView())
```

### Navigation with Modifiers

```typescript
const App = NavigationStack(ContentView(), {
  navigationTitle: 'My App',
  navigationBarHidden: false,
  toolbarBackground: '#007AFF'
})

// Or using modifier syntax
const App = NavigationStack(ContentView())
  .navigationTitle('My App')
  .navigationBarHidden(false)
  .toolbarBackground('#007AFF')
```

## Navigation Destinations

### Programmatic Navigation

```typescript
import { navigationDestination, navigateToDestination } from '@tachui/navigation'

// Register navigation destinations
navigationDestination('userProfile', (userId: string) => 
  UserProfileView({ userId })
)

navigationDestination('settings', () => SettingsView())

// Navigate programmatically
const handleShowProfile = (userId: string) => {
  navigateToDestination('userProfile', userId)
}

const handleShowSettings = () => {
  navigateToDestination('settings')
}
```

### Type-Safe Navigation

```typescript
// Define typed navigation destinations
interface AppDestinations {
  userProfile: { userId: string }
  productDetail: { productId: number }
  settings: {}
}

// Register with type safety
navigationDestination<AppDestinations['userProfile']>(
  'userProfile', 
  ({ userId }) => UserProfileView({ userId })
)

// Navigate with autocomplete and type checking
navigateToDestination('userProfile', { userId: '123' })
```

## Navigation Modifiers

NavigationStack supports all SwiftUI navigation modifiers:

### Title Configuration

```typescript
NavigationStack(content)
  .navigationTitle('App Title')
  .navigationBarTitleDisplayMode('large') // 'automatic' | 'inline' | 'large'
```

### Navigation Bar Customization

```typescript
NavigationStack(content)
  .navigationBarHidden(false)
  .navigationBarBackButtonHidden(false)
  .navigationBarBackButtonTitle('Back')
  .toolbarBackground('#FFFFFF')
  .toolbarForegroundColor('#000000')
```

### Navigation Bar Items

```typescript
import { Button } from '@tachui/core'

NavigationStack(content)
  .navigationBarItems({
    leading: Button('Cancel', handleCancel),
    trailing: Button('Done', handleDone)
  })
```

## Advanced Features

### Navigation Environment

NavigationStack automatically provides navigation context to child components:

```typescript
import { useNavigationEnvironmentContext } from '@tachui/navigation'

const ChildComponent = () => {
  const navigation = useNavigationEnvironmentContext()
  
  const handleNavigate = () => {
    navigation.push(() => NextView())
  }
  
  const handleGoBack = () => {
    navigation.pop()
  }
  
  return VStack([
    Button('Navigate', handleNavigate),
    Button('Go Back', handleGoBack, {
      disabled: !navigation.canGoBack
    })
  ])
}
```

### Navigation State Management

```typescript
import { createNavigationPath } from '@tachui/navigation'

const [navigationPath] = createNavigationPath()

const App = NavigationStack(ContentView(), {
  path: navigationPath
})

// Programmatic navigation with path
navigationPath.append('userProfile')
navigationPath.append('settings')
navigationPath.removeLast() // Go back
navigationPath.clear()      // Return to root
```

## Navigation Patterns

### Master-Detail Interface

```typescript
const MasterDetailView = () => {
  const [selectedItem, setSelectedItem] = createSignal(null)
  
  return NavigationStack(
    VStack([
      List({
        data: items,
        renderItem: (item) => NavigationLink(
          item.title,
          () => DetailView(item)
        )
      })
    ])
  ).navigationTitle('Items')
}
```

### Conditional Navigation

```typescript
import { Show } from '@tachui/core'

const ConditionalNavigationView = () => {
  const [isLoggedIn] = createSignal(false)
  
  return NavigationStack(
    Show({
      when: isLoggedIn,
      children: () => MainAppView(),
      fallback: () => LoginView()
    })
  )
}
```

## Performance Optimization

NavigationStack is highly optimized with a 59% smaller bundle size compared to previous navigation implementations:

- **Bundle Size**: 82KB (down from 201KB)
- **Gzipped**: 18KB
- **Tree Shakable**: Import only what you need
- **Lazy Loading**: Navigation destinations loaded on demand

```typescript
// Efficient imports
import { NavigationStack } from '@tachui/navigation/navigation-stack'
import { NavigationLink } from '@tachui/navigation/navigation-link'
```

## Accessibility

NavigationStack provides comprehensive accessibility support:

```typescript
NavigationStack(content, {
  navigationTitle: 'Accessible Navigation',
  accessibilityLabel: 'Main application navigation',
  accessibilityHint: 'Navigate between app sections'
})
```

## Animation & Transitions

NavigationStack supports smooth animations matching platform conventions:

```typescript
NavigationStack(content, {
  navigationTransition: {
    push: { type: 'slide', direction: 'left', duration: 300 },
    pop: { type: 'slide', direction: 'right', duration: 300 }
  }
})
```

## Testing

NavigationStack is fully testable with comprehensive test utilities:

```typescript
import { render, fireEvent } from '@testing-library/dom'
import { NavigationStack, NavigationLink } from '@tachui/navigation'

test('navigation stack navigation', () => {
  const app = NavigationStack(
    VStack([
      Text('Home'),
      NavigationLink('Detail', () => Text('Detail View'))
    ])
  )
  
  const { getByText } = render(app)
  
  fireEvent.click(getByText('Detail'))
  expect(getByText('Detail View')).toBeInTheDocument()
})
```

## Migration from NavigationView

If migrating from the deprecated NavigationView component:

```typescript
// Before (deprecated)
import { NavigationView } from '@tachui/navigation'
NavigationView(content, { title: 'App' })

// After (SwiftUI-compatible)
import { NavigationStack } from '@tachui/navigation'
NavigationStack(content).navigationTitle('App')
```

## API Reference

### NavigationStack Options

```typescript
interface NavigationStackOptions {
  navigationTitle?: string
  navigationBarHidden?: boolean
  navigationBarBackButtonHidden?: boolean
  navigationBarBackButtonTitle?: string
  toolbarBackground?: string
  toolbarForegroundColor?: string
  path?: NavigationPath
}
```

### NavigationStack Methods

```typescript
interface NavigationStackContext {
  push(destination: NavigationDestination): void
  pop(): void
  popToRoot(): void
  canGoBack: boolean
  currentPath: string
}
```

For complete API documentation, see the [Navigation API Reference](/api/navigation).