# Navigation API Reference

Complete API reference for TachUI's SwiftUI-compatible navigation system.

## Overview

The `@tachui/navigation` package provides three core components with 100% SwiftUI API compatibility:

- **NavigationStack**: Modern stack-based navigation
- **NavigationLink**: Declarative navigation links
- **SimpleTabView**: Tab-based navigation interface

## NavigationStack

### Function Signature

```typescript
function NavigationStack(
  content: ComponentInstance,
  options?: NavigationStackOptions
): ComponentInstance
```

### NavigationStackOptions

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

### Navigation Modifiers

```typescript
// Chainable modifier methods
NavigationStack(content)
  .navigationTitle(title: string)
  .navigationBarTitleDisplayMode(mode: 'automatic' | 'inline' | 'large')
  .navigationBarHidden(hidden: boolean)
  .navigationBarBackButtonHidden(hidden: boolean)
  .navigationBarBackButtonTitle(title: string)
  .navigationBarItems(items: NavigationBarItems)
  .toolbarBackground(color: string)
  .toolbarForegroundColor(color: string)
```

### Example

```typescript
const app = NavigationStack(ContentView())
  .navigationTitle('My App')
  .navigationBarTitleDisplayMode('large')
  .toolbarBackground('#007AFF')
```

## NavigationLink

### Function Signature

```typescript
function NavigationLink(
  label: string | ComponentInstance,
  destination: NavigationDestination,
  options?: NavigationLinkOptions
): ComponentInstance
```

### NavigationDestination

```typescript
type NavigationDestination = ComponentInstance | (() => ComponentInstance)
```

### NavigationLinkOptions

```typescript
interface NavigationLinkOptions {
  isActive?: boolean | Binding<boolean>
  tag?: string
  onTap?: () => void
  disabled?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: string
}
```

### Examples

```typescript
// Basic navigation link
NavigationLink('Settings', () => SettingsView())

// With custom component label
NavigationLink(
  Button('Go to Profile'),
  () => ProfileView()
)

// With options
NavigationLink(
  'Admin Panel',
  () => AdminView(),
  {
    disabled: !isAdmin(),
    onTap: () => analytics.track('admin_access')
  }
)
```

## SimpleTabView

### Function Signature

```typescript
function SimpleTabView(
  tabs: SimpleTabItem[],
  options?: SimpleTabViewOptions
): ComponentInstance
```

### SimpleTabItem

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

### SimpleTabViewOptions

```typescript
interface SimpleTabViewOptions {
  selection?: Binding<string>
  onSelectionChange?: (tabId: string) => void
  tabBarPosition?: 'top' | 'bottom'
  appearance?: TabAppearanceOptions
  lazyLoading?: boolean
  transition?: TabTransitionOptions
}
```

### tabItem Helper

```typescript
function tabItem(
  id: string,
  title: string,
  content: ComponentInstance | (() => ComponentInstance),
  options?: SimpleTabItemOptions
): SimpleTabItem
```

### Example

```typescript
const app = SimpleTabView([
  tabItem('home', 'Home', HomeView(), { icon: '🏠' }),
  tabItem('settings', 'Settings', SettingsView(), { icon: '⚙️' })
], {
  selection: selectedTab,
  onSelectionChange: handleTabChange
})
```

## Navigation Utilities

### navigationDestination

```typescript
function navigationDestination(
  path: string,
  destination: NavigationDestination
): void
```

Register a navigation destination for programmatic navigation.

```typescript
navigationDestination('userProfile', (userId: string) => 
  UserProfileView({ userId })
)
```

### navigateToDestination

```typescript
function navigateToDestination(
  path: string,
  ...params: any[]
): void
```

Navigate programmatically to a registered destination.

```typescript
navigateToDestination('userProfile', '123')
```

### NavigationPath

```typescript
interface NavigationPath {
  readonly segments: readonly string[]
  readonly count: number
  readonly isEmpty: boolean
  append(segment: string): void
  appendAll(segments: string[]): void
  removeLast(count?: number): void
  clear(): void
  contains(segment: string): boolean
  at(index: number): string | undefined
  readonly last: string | undefined
}
```

### createNavigationPath

```typescript
function createNavigationPath(): [NavigationPath, (path: NavigationPath) => void]
```

Create a reactive navigation path for programmatic navigation.

```typescript
const [navPath, setNavPath] = createNavigationPath()

// Programmatic navigation
navPath.append('userProfile')
navPath.append('settings')
navPath.removeLast() // Go back
```

## Environment & Context

### useNavigationEnvironmentContext

```typescript
function useNavigationEnvironmentContext(): NavigationContext
```

Access the current navigation context within a NavigationStack.

```typescript
interface NavigationContext {
  readonly navigationId: string
  readonly stack: NavigationStackEntry[]
  readonly currentPath: string
  push(destination: NavigationDestination, path: string, title?: string): void
  pop(): void
  popToRoot(): void
  popTo(path: string): void
  canGoBack: boolean
  canGoForward: boolean
}
```

### Example

```typescript
const MyComponent = () => {
  const navigation = useNavigationEnvironmentContext()
  
  const handleNavigate = () => {
    navigation.push(() => NextView(), '/next')
  }
  
  return Button('Navigate', handleNavigate, {
    disabled: !navigation.canGoBack
  })
}
```

## Navigation Modifiers

### Available Modifiers

```typescript
// Title and display
.navigationTitle(title: string)
.navigationBarTitleDisplayMode(mode: 'automatic' | 'inline' | 'large')

// Visibility
.navigationBarHidden(hidden: boolean)
.navigationBarBackButtonHidden(hidden: boolean)

// Customization
.navigationBarBackButtonTitle(title: string)
.navigationBarItems(items: NavigationBarItems)
.toolbarBackground(color: string)
.toolbarForegroundColor(color: string)
```

### NavigationBarItems

```typescript
interface NavigationBarItems {
  leading?: ComponentInstance
  trailing?: ComponentInstance
}
```

### Example

```typescript
NavigationStack(content)
  .navigationTitle('Settings')
  .navigationBarItems({
    leading: Button('Cancel', handleCancel),
    trailing: Button('Done', handleDone)
  })
```

## Type Definitions

### Core Types

```typescript
// Component types
type ComponentInstance = any
type NavigationDestination = ComponentInstance | (() => ComponentInstance)

// Binding type for reactive values
interface Binding<T> {
  get(): T
  set(value: T): void
}

// Navigation transition types
interface NavigationTransition {
  type: 'slide' | 'fade' | 'scale' | 'push' | 'present' | 'none'
  direction?: 'left' | 'right' | 'up' | 'down'
  duration?: number
  easing?: string
}
```

### Tab-Specific Types

```typescript
interface TabAppearanceOptions {
  backgroundColor?: string
  selectedColor?: string
  unselectedColor?: string
  badgeColor?: string
}

interface TabTransitionOptions {
  type: 'fade' | 'slide' | 'none'
  duration?: number
  easing?: string
}
```

## Performance Considerations

### Bundle Size Impact

```typescript
// Core navigation components
import { NavigationStack } from '@tachui/navigation'           // ~25KB
import { NavigationLink } from '@tachui/navigation'            // ~15KB
import { SimpleTabView } from '@tachui/navigation'             // ~20KB

// Full navigation package
import * from '@tachui/navigation'                             // ~82KB total
```

### Lazy Loading

```typescript
// Lazy load tab content
SimpleTabView([
  tabItem('heavy', 'Heavy Tab', () => lazy(() => import('./HeavyView')))
])

// Lazy load navigation destinations
NavigationLink('Heavy View', () => lazy(() => import('./HeavyView')))
```

## Migration Guide

### From NavigationView to NavigationStack

```typescript
// Before (deprecated)
import { NavigationView } from '@tachui/navigation'
NavigationView(content, { title: 'App' })

// After (SwiftUI compatible)
import { NavigationStack } from '@tachui/navigation'
NavigationStack(content).navigationTitle('App')
```

### Parameter Order Changes

```typescript
// Before (TachUI-specific)
NavigationLink(destination, label, options)

// After (SwiftUI compatible)
NavigationLink(label, destination, options)
```

### TabView to SimpleTabView

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

## Error Handling

### Navigation Errors

```typescript
try {
  navigateToDestination('unknownRoute')
} catch (error) {
  if (error instanceof NavigationError) {
    console.log('Navigation failed:', error.message)
  }
}
```

### Fallback Navigation

```typescript
NavigationStack(content, {
  fallbackDestination: () => NotFoundView(),
  onNavigationError: (error) => {
    console.error('Navigation error:', error)
    analytics.track('navigation_error', { error: error.message })
  }
})
```

## Testing Support

### Navigation Testing Utilities

```typescript
import { 
  createMockNavigationContext,
  NavigationTestWrapper
} from '@tachui/navigation/testing'

// Mock navigation context for testing
const mockNavigation = createMockNavigationContext()

// Wrapper for testing navigation components
const TestComponent = NavigationTestWrapper(
  NavigationStack(MyComponent()),
  { initialPath: '/test' }
)
```

### Testing Examples

```typescript
import { render, fireEvent } from '@testing-library/dom'

test('navigation link functionality', () => {
  const app = NavigationStack(
    NavigationLink('Go to Detail', () => Text('Detail View'))
  )
  
  const { getByText } = render(app)
  
  fireEvent.click(getByText('Go to Detail'))
  expect(getByText('Detail View')).toBeInTheDocument()
})
```

For more detailed examples and patterns, see the [Navigation Guide](/guide/navigation).