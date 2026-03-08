# NavigationView Component

> **⚠️ DEPRECATED**: NavigationView has been replaced by [NavigationStack](/components/navigation-stack) as part of Navigation System Updates. Please use NavigationStack for new projects and consider migrating existing code for better SwiftUI compatibility.

The NavigationView component provides stack-based navigation with SwiftUI-inspired patterns and behavior.

## Overview

> **Migration Note**: For new projects, use [NavigationStack](/components/navigation-stack) which provides 100% SwiftUI compatibility and better performance.

The NavigationView component is part of TachUI's core component library, providing consistent navigation patterns for applications.

```typescript
import { NavigationView } from '@tachui/core'

NavigationView({
  children: [
    // Navigation content
  ]
})
```

## Props

- `children` - Navigation content and views
- `title` - Navigation title
- `backButton` - Show back navigation button
- `onBack` - Back navigation handler
- `navigationBarHidden` - Hide navigation bar

## Usage Examples

```typescript
// Basic navigation view
NavigationView({
  title: 'Home',
  children: [
    Text('Welcome to the app'),
    NavigationLink('Settings', SettingsView)
  ]
})

// Navigation with custom back action
NavigationView({
  title: 'Details',
  backButton: true,
  onBack: handleBack,
  children: [
    Text('Detail content here')
  ]
})

// Hidden navigation bar
NavigationView({
  navigationBarHidden: true,
  children: [
    // Full-screen content
  ]
})
```

## Navigation Stack

NavigationView manages a navigation stack automatically:

```typescript
// Push new view
navigationController.push(NewView)

// Pop current view
navigationController.pop()

// Pop to root
navigationController.popToRoot()
```

For complete API documentation, see the TypeScript definitions in `@tachui/core`.