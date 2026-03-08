# NavigationLink Component

NavigationLink provides SwiftUI-compatible declarative navigation that automatically manages navigation stack state and transitions.

## Overview

NavigationLink matches SwiftUI's NavigationLink API exactly, providing intuitive navigation with automatic back button handling and seamless integration with NavigationStack.

```typescript
import { NavigationLink } from '@tachui/navigation'

// Basic NavigationLink - SwiftUI compatible
NavigationLink('Settings', () => SettingsView())
```

## SwiftUI Compatibility

NavigationLink provides 100% API compatibility with SwiftUI's NavigationLink:

```typescript
// This SwiftUI code...
NavigationLink("Profile", destination: ProfileView())

// ...works identically in TachUI
NavigationLink('Profile', () => ProfileView())
```

## Basic Usage

### Simple Text Navigation

```typescript
import { NavigationLink } from '@tachui/navigation'
import { VStack } from '@tachui/core'

const HomeView = () => VStack([
  NavigationLink('Settings', () => SettingsView()),
  NavigationLink('Profile', () => ProfileView()),
  NavigationLink('About', () => AboutView())
])
```

### Custom Label Navigation

```typescript
import { Button, HStack, Text, Image } from '@tachui/core'

const HomeView = () => VStack([
  // Button as navigation label
  NavigationLink(
    Button('Go to Settings', { variant: 'outlined' }),
    () => SettingsView()
  ),
  
  // Custom component as label
  NavigationLink(
    HStack([
      Image({ src: 'profile.jpg', width: 40, height: 40 }),
      VStack([
        Text('John Doe'),
        Text('View Profile')
      ])
    ]),
    () => ProfileView()
  )
])
```

## Advanced Navigation

### Conditional Navigation

```typescript
import { createSignal } from '@tachui/core'

const ConditionalNavigationView = () => {
  const [isLoggedIn] = createSignal(true)
  
  return VStack([
    NavigationLink(
      'Profile',
      () => isLoggedIn() ? ProfileView() : LoginView()
    ),
    
    NavigationLink(
      'Settings',
      () => SettingsView(),
      {
        disabled: !isLoggedIn()
      }
    )
  ])
}
```

### Programmatic Navigation Control

```typescript
import { createBinding } from '@tachui/core'

const ProgrammaticNavigationView = () => {
  const [isActive, setIsActive] = createBinding(false)
  
  const handleNavigate = () => {
    setIsActive(true)
  }
  
  return VStack([
    Button('Navigate Programmatically', handleNavigate),
    
    NavigationLink(
      'Hidden Navigation',
      () => DestinationView(),
      {
        isActive,
        onTap: () => console.log('Navigation link tapped')
      }
    )
  ])
}
```

## Navigation Link Options

### Basic Options

```typescript
interface NavigationLinkOptions {
  isActive?: boolean | Binding<boolean>
  tag?: string
  onTap?: () => void
  disabled?: boolean
}

NavigationLink(
  'Settings',
  () => SettingsView(),
  {
    isActive: false,
    tag: 'settings-link',
    onTap: () => analytics.track('settings_navigation'),
    disabled: false
  }
)
```

### Accessibility Options

```typescript
NavigationLink(
  'User Profile',
  () => ProfileView(),
  {
    accessibilityLabel: 'Navigate to user profile',
    accessibilityHint: 'Opens your profile settings and information',
    accessibilityRole: 'link'
  }
)
```

## Navigation Link Variants

### NavigationIconLink

```typescript
import { NavigationIconLink } from '@tachui/navigation'

NavigationIconLink(
  '⚙️',          // Icon
  'Settings',    // Label
  () => SettingsView()
)
```

### NavigationListLink

For use in List components:

```typescript
import { NavigationListLink, List } from '@tachui/navigation'

const MenuView = () => List({
  data: menuItems,
  renderItem: (item) => NavigationListLink(
    item.title,
    item.icon,
    () => item.destination()
  )
})
```

### StyledNavigationLink

Pre-styled navigation links:

```typescript
import { StyledNavigationLink } from '@tachui/navigation'

StyledNavigationLink(
  'Premium Features',
  () => PremiumView(),
  {
    style: 'card',      // 'default' | 'card' | 'button' | 'minimal'
    variant: 'primary', // 'primary' | 'secondary' | 'accent'
    showChevron: true
  }
)
```

## Integration with Navigation Stack

NavigationLink automatically integrates with the containing NavigationStack:

```typescript
import { NavigationStack, NavigationLink } from '@tachui/navigation'

const App = NavigationStack(
  VStack([
    Text('Home Screen'),
    
    // These navigation links automatically work with the stack
    NavigationLink('Page 1', () => Page1View()),
    NavigationLink('Page 2', () => Page2View()),
    NavigationLink('Page 3', () => Page3View())
  ])
).navigationTitle('My App')

const Page1View = () => VStack([
  Text('Page 1'),
  NavigationLink('Go to Page 2', () => Page2View()),
  NavigationLink('Back to Home', () => HomeView())
])
```

## Performance Optimization

NavigationLink is optimized for performance:

- **Lazy Loading**: Destination views loaded only when navigated to
- **Memoization**: Navigation state cached to prevent unnecessary re-renders
- **Tree Shaking**: Only imports components that are actually used

```typescript
// Efficient destination loading
NavigationLink(
  'Heavy View',
  () => lazy(() => import('./HeavyView'))()
)
```

## Navigation Link Builder Pattern

For complex navigation link construction:

```typescript
import { NavigationLinkBuilder } from '@tachui/navigation'

const complexNavigationLink = NavigationLinkBuilder()
  .label('Advanced Settings')
  .destination(() => AdvancedSettingsView())
  .icon('⚙️')
  .badge('New')
  .accessibilityLabel('Open advanced settings')
  .onTap(() => analytics.track('advanced_settings'))
  .build()
```

## Testing NavigationLink

NavigationLink components are fully testable:

```typescript
import { render, fireEvent } from '@testing-library/dom'
import { NavigationStack, NavigationLink } from '@tachui/navigation'

test('navigation link navigation', () => {
  const app = NavigationStack(
    VStack([
      Text('Home'),
      NavigationLink('Detail', () => Text('Detail View'))
    ])
  )
  
  const { getByText } = render(app)
  
  // Click navigation link
  fireEvent.click(getByText('Detail'))
  
  // Verify navigation occurred
  expect(getByText('Detail View')).toBeInTheDocument()
  
  // Verify back button works
  const backButton = getByText('Back')
  fireEvent.click(backButton)
  expect(getByText('Home')).toBeInTheDocument()
})
```

## Accessibility Features

NavigationLink provides comprehensive accessibility support:

```typescript
NavigationLink(
  'Accessible Navigation',
  () => AccessibleView(),
  {
    // Screen reader support
    accessibilityLabel: 'Navigate to accessible features',
    accessibilityHint: 'Opens accessibility configuration options',
    accessibilityRole: 'link',
    
    // Keyboard navigation
    tabIndex: 0,
    
    // Focus management
    autoFocus: false
  }
)
```

## Animation & Transitions

NavigationLink supports custom animations:

```typescript
NavigationLink(
  'Animated Navigation',
  () => AnimatedView(),
  {
    transition: {
      type: 'slide',
      direction: 'left',
      duration: 300,
      easing: 'ease-out'
    }
  }
)
```

## Common Patterns

### Navigation with Data Passing

```typescript
const UserListView = () => {
  const [users] = createSignal(userList)
  
  return List({
    data: users,
    renderItem: (user) => NavigationLink(
      user.name,
      () => UserDetailView({ user }) // Pass data to destination
    )
  })
}
```

### Conditional Navigation

```typescript
const ConditionalNavigation = () => {
  const [hasPermission] = createSignal(checkPermission())
  
  return VStack([
    Show({
      when: hasPermission,
      children: () => NavigationLink('Admin Panel', () => AdminView()),
      fallback: () => Text('Access Denied')
    })
  ])
}
```

### Navigation with Side Effects

```typescript
const NavigationWithSideEffects = () => {
  const handleNavigationTap = () => {
    // Analytics
    analytics.track('feature_accessed')
    
    // Cache data
    preloadFeatureData()
    
    // User feedback
    showLoadingIndicator()
  }
  
  return NavigationLink(
    'Feature',
    () => FeatureView(),
    { onTap: handleNavigationTap }
  )
}
```

## API Reference

### NavigationLink Function Signature

```typescript
function NavigationLink(
  label: string | ComponentInstance,
  destination: NavigationDestination,
  options?: NavigationLinkOptions
): ComponentInstance
```

### NavigationDestination Type

```typescript
type NavigationDestination = ComponentInstance | (() => ComponentInstance)
```

### NavigationLinkOptions Interface

```typescript
interface NavigationLinkOptions {
  isActive?: boolean | Binding<boolean>
  tag?: string
  onTap?: () => void
  disabled?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: string
  transition?: NavigationTransition
}
```

## Migration from Previous APIs

If migrating from old navigation APIs:

```typescript
// Before (old parameter order)
NavigationLink(destination, label, options)

// After (SwiftUI-compatible)
NavigationLink(label, destination, options)
```

For complete API documentation, see the [Navigation API Reference](/api/navigation).