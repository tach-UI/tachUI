# @tachui/mobile

> Mobile UI components for tachUI framework

[![npm version](https://img.shields.io/npm/v/@tachui/mobile.svg)](https://www.npmjs.com/package/@tachui/mobile)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

The tachUI mobile package provides essential mobile UI components and interaction patterns. Currently focused on core modal components with plans for expanded mobile functionality in future releases.

## Current Features (v0.8.8-alpha)

- 📱 **Core Modal Components** - ActionSheet and Alert with full modal system
- 🎨 **Native Feel** - iOS and Android design system compatibility
- 🔄 **Smooth Animations** - 60fps transitions and micro-interactions
- 📐 **Responsive Design** - Adapts to different screen sizes and orientations
- 🔧 **TypeScript-first** - Complete type safety for mobile patterns
- ♿ **Accessibility** - Full ARIA support and keyboard navigation

## Roadmap (Future Releases)

- 👆 **Touch Interactions** - Swipe actions, pull-to-refresh, and gesture handling
- 📱 **Advanced Components** - Modal presentations, SafeArea support
- 🎯 **Platform Adaptations** - iOS/Android specific variants
- 📳 **Haptic Feedback** - Native-like touch feedback
- 🎭 **Gesture System** - Advanced gesture recognition

## Installation

```bash
npm install @tachui/core @tachui/mobile
# or
pnpm add @tachui/core @tachui/mobile
```

## Quick Start

### ActionSheet

```typescript
import { VStack, Button } from '@tachui/primitives'
import { ActionSheet, useActionSheet } from '@tachui/mobile'

const MyComponent = () => {
  const actionSheet = useActionSheet()

  const showOptions = () => {
    actionSheet.present({
      title: 'Choose an action',
      message: 'What would you like to do?',
      actions: [
        {
          title: 'Share',
          style: 'default',
          action: () => console.log('Share tapped'),
        },
        {
          title: 'Edit',
          style: 'default',
          action: () => console.log('Edit tapped'),
        },
        {
          title: 'Delete',
          style: 'destructive',
          action: () => console.log('Delete tapped'),
        },
        {
          title: 'Cancel',
          style: 'cancel',
        },
      ],
    })
  }

  return Button('Show Options', showOptions).modifier.padding(16)
}
```

### Alert

```typescript
import { Alert, useAlert } from '@tachui/mobile'

const MyComponent = () => {
  const alert = useAlert()

  const showAlert = () => {
    alert.present({
      title: 'Confirm Action',
      message: 'Are you sure you want to delete this item?',
      actions: [
        {
          title: 'Cancel',
          style: 'cancel',
        },
        {
          title: 'Delete',
          style: 'destructive',
          action: () => {
            console.log('Item deleted')
          },
        },
      ],
    })
  }

  return Button('Delete Item', showAlert)
    .modifier.backgroundColor('#ff3b30')
    .foregroundColor('white')
    
}
```

## Implemented Components

### ✅ ActionSheet

Bottom sheet with multiple action options:

```typescript
import { ActionSheet } from '@tachui/mobile'

ActionSheet({
  title: 'Photo Options',
  message: 'Choose how to add a photo',
  actions: [
    { title: 'Camera', role: 'default', onPress: () => openCamera() },
    { title: 'Photo Library', role: 'default', onPress: () => openLibrary() },
    { title: 'Cancel', role: 'cancel' },
  ],
  presentationStyle: 'sheet', // 'sheet' | 'popover' | 'adaptive'
})
```

### ✅ Alert

Modal alerts with customizable buttons:

```typescript
import { Alert } from '@tachui/mobile'

Alert({
  title: 'Network Error',
  message: 'Unable to connect to the server. Please check your connection.',
  buttons: [
    { title: 'Retry', role: 'default', action: () => retryConnection() },
    { title: 'Cancel', role: 'cancel' },
  ],
  isPresented: createSignal(true),
})
```

## Planned Components (Future Releases)

### 🚧 SwipeActions

Swipe-to-reveal action buttons:

```typescript
// Planned for v0.2.0
import { SwipeActions, SwipeAction } from '@tachui/mobile'

SwipeActions({
  content: ListRow({ title: 'John Doe', subtitle: 'john@example.com' }),
  leadingActions: [
    SwipeAction({
      title: 'Mark Read',
      backgroundColor: '#007AFF',
      icon: 'envelope.open.fill',
      action: () => markAsRead(),
    }),
  ],
  trailingActions: [
    SwipeAction({
      title: 'Archive',
      backgroundColor: '#FF9500',
      icon: 'archivebox.fill',
      action: () => archive(),
    }),
    SwipeAction({
      title: 'Delete',
      backgroundColor: '#FF3B30',
      icon: 'trash.fill',
      action: () => deleteItem(),
    }),
  ],
})
```

### 🚧 PullToRefresh

Pull-down-to-refresh functionality:

```typescript
// Planned for v0.2.0
import { PullToRefresh } from '@tachui/mobile'
import { ScrollView } from '@tachui/core'

PullToRefresh({
  onRefresh: async () => {
    await loadNewData()
  },
  content: ScrollView({
    children: [
      // Your content here
    ],
  }),
})
```

## Advanced Patterns (Implemented)

### ✅ Modal System

Both ActionSheet and Alert provide full modal systems with:

- Backdrop dismissal
- Keyboard navigation
- Focus management
- Animation coordination
- Accessibility support

### ✅ Utility Functions

```typescript
import { ActionSheetUtils, AlertUtils } from '@tachui/mobile'

// Pre-configured action sheets
const deleteConfirmation = ActionSheetUtils.deleteConfirmation(
  'Delete Item',
  () => deleteItem(),
  () => console.log('Cancelled')
)

// Pre-configured alerts
const confirmAlert = AlertUtils.confirm(
  'Confirm Action',
  'Are you sure?',
  () => performAction(),
  () => console.log('Cancelled')
)
```

## Advanced Patterns (Planned for Future Releases)

### 🚧 Modal Presentation System

```typescript
// Planned for v0.2.0
import { presentModal, dismissModal } from '@tachui/mobile'

const presentSettings = () => {
  presentModal({
    content: SettingsView(),
    presentationStyle: 'sheet', // 'sheet' | 'fullscreen' | 'popover'
    detents: [.medium(), .large()], // iOS-style sheet sizing
    dismissible: true,
    onDismiss: () => console.log('Modal dismissed')
  })
}
```

### 🚧 Haptic Feedback

```typescript
// Planned for v0.2.0
import { hapticFeedback } from '@tachui/mobile'

Button('Success Action', () => {
  // Perform action
  hapticFeedback('success') // 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy'
})
```

### 🚧 SafeArea Support

```typescript
// Planned for v0.2.0
import { SafeAreaView } from '@tachui/mobile'

const app = SafeAreaView({
  children: [
    // Your app content
  ],
})
  .modifier.backgroundColor('#ffffff')
  
```

### 🚧 Gesture Handling

```typescript
// Planned for v0.2.0
import { GestureRecognizer } from '@tachui/mobile'

GestureRecognizer({
  content: MyView(),
  gestures: {
    tap: {
      action: () => console.log('Tapped'),
      numberOfTapsRequired: 1,
    },
    longPress: {
      action: () => console.log('Long pressed'),
      minimumPressDuration: 0.5,
    },
    swipe: {
      direction: 'left',
      action: () => console.log('Swiped left'),
    },
  },
})
```

## Platform Adaptations (Planned for Future Releases)

### 🚧 iOS-style Components

```typescript
// Planned for v0.3.0
import { IOSActionSheet, IOSAlert } from '@tachui/mobile'

// iOS-specific styling and behavior
IOSActionSheet({
  title: 'Options',
  actions: actions,
})
  .modifier.iosStyle(true)
  
```

### 🚧 Android-style Components

```typescript
// Planned for v0.3.0
import { MaterialActionSheet, MaterialAlert } from '@tachui/mobile'

// Material Design styling
MaterialActionSheet({
  title: 'Choose action',
  actions: actions,
})
  .modifier.materialStyle(true)
  
```

## Animation and Transitions

```typescript
import { createMobileTransition } from '@tachui/mobile'

const slideUpTransition = createMobileTransition({
  type: 'slide',
  direction: 'up',
  duration: 0.3,
  easing: 'ease-out',
})

ActionSheet({ actions })
  .modifier.presentationTransition(slideUpTransition)
  
```

## Touch and Gesture Optimization

Built-in mobile optimizations:

- **Touch targets** - Minimum 44pt touch areas
- **Scroll momentum** - Native-like scrolling behavior
- **Bounce effects** - Elastic scrolling boundaries
- **Gesture conflicts** - Automatic gesture precedence handling
- **Performance** - 60fps animations on mobile devices

## Accessibility

Mobile accessibility features:

- **VoiceOver/TalkBack** support
- **Dynamic Type** scaling for text
- **Reduce Motion** preference handling
- **High Contrast** mode support
- **Voice Control** compatibility

## Examples

Check out complete examples:

- **[Mobile App Demo](https://github.com/tach-UI/tachUI/tree/main/apps/examples/mobile/app)**
- **[ActionSheet Gallery](https://github.com/tach-UI/tachUI/tree/main/apps/examples/mobile/actionsheet)**
- **[Swipe Actions List](https://github.com/tach-UI/tachUI/tree/main/apps/examples/mobile/swipe-actions)**

## API Reference

- **[ActionSheet API](https://github.com/tach-UI/tachUI/blob/main/docs/api/mobile/src/classes/ActionSheet.md)**
- **[Alert API](https://github.com/tach-UI/tachUI/blob/main/docs/api/mobile/src/classes/Alert.md)**
- **[SwipeActions API](https://github.com/tach-UI/tachUI/blob/main/docs/api/mobile/src/classes/SwipeActions.md)**

## Current Status

**Version 0.8.8-alpha** - Core modal components (ActionSheet, Alert)

- ✅ **ActionSheet**: Full implementation with animations, accessibility, responsive design
- ✅ **Alert**: Complete modal system with reactive support and keyboard navigation
- 🚧 **Future Releases**: SwipeActions, PullToRefresh, Modal system, Haptic feedback, Gesture handling

## Requirements

- **@tachui/core** ^0.8.8-alpha or later
- **TypeScript** 5.0+ (recommended)

## Contributing

See the main [Contributing Guide](https://github.com/tach-UI/tachUI/blob/main/CONTRIBUTING.md) for information on contributing to tachUI mobile patterns.

## License

Mozilla Public License 2.0 - see [LICENSE](https://github.com/tach-UI/tachUI/blob/main/LICENSE) for details.
