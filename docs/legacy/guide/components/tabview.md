# TabView Component

> **⚠️ DEPRECATED**: TabView has been replaced by [SimpleTabView](/components/simple-tab-view) as part of Navigation System Updates. Please use SimpleTabView for new projects, which provides SwiftUI-compatible `.tabItem()` modifier patterns without complex coordinator systems.

The TabView component provides tab-based navigation with SwiftUI-inspired patterns and behavior.

## Overview

> **Migration Note**: For new projects, use [SimpleTabView](/components/simple-tab-view) which provides cleaner APIs and better SwiftUI compatibility.

The TabView component is part of TachUI's core component library, providing consistent tabbed interfaces for applications.

```typescript
import { TabView } from '@tachui/core'

TabView({
  selection: selectedTab,
  onChange: setSelectedTab,
  children: [
    // Tab content
  ]
})
```

## Props

- `selection` - Currently selected tab index or key
- `onChange` - Tab selection change handler
- `children` - Tab content views
- `tabPlacement` - Tab bar placement ('top' | 'bottom')
- `variant` - Tab style variant

## Usage Examples

```typescript
// Basic tab view
TabView({
  selection: activeTab,
  onChange: setActiveTab,
  children: [
    Tab('Home', HomeView),
    Tab('Search', SearchView),
    Tab('Profile', ProfileView)
  ]
})

// Tab view with icons
TabView({
  selection: currentTab,
  onChange: setCurrentTab,
  tabPlacement: 'bottom',
  children: [
    Tab({ title: 'Home', icon: 'house' }, HomeView),
    Tab({ title: 'Search', icon: 'magnifyingglass' }, SearchView),
    Tab({ title: 'Profile', icon: 'person' }, ProfileView)
  ]
})

// Programmatic tab selection
TabView({
  selection: tabIndex,
  onChange: handleTabChange,
  children: tabs.map((tab, index) => 
    Tab(tab.title, tab.content, { key: index })
  )
})
```

## Tab Configuration

Individual tabs can be configured with:

```typescript
Tab('Title', ContentView, {
  icon: 'icon-name',
  badge: badgeCount,
  disabled: isDisabled,
  key: 'unique-key'
})
```

For complete API documentation, see the TypeScript definitions in `@tachui/core`.