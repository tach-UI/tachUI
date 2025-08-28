# @tachui/mobile-patterns

> Mobile UI patterns and components for tachUI framework

[![npm version](https://img.shields.io/npm/v/@tachui/mobile-patterns.svg)](https://www.npmjs.com/package/@tachui/mobile-patterns)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

The tachUI mobile-patterns package provides essential mobile UI components and interaction patterns including ActionSheet, Alert, pull-to-refresh, swipe actions, and mobile-optimized navigation components.

## Features

- 📱 **Mobile-first Components** - ActionSheet, Alert, and modal presentations
- 👆 **Touch Interactions** - Swipe actions, pull-to-refresh, and gesture handling
- 🎨 **Native Feel** - iOS and Android design system compatibility
- 🔄 **Smooth Animations** - 60fps transitions and micro-interactions
- 📐 **Responsive Design** - Adapts to different screen sizes and orientations
- 🔧 **TypeScript-first** - Complete type safety for mobile patterns

## Installation

```bash
npm install @tachui/core @tachui/mobile-patterns
# or
pnpm add @tachui/core @tachui/mobile-patterns
```

## Quick Start

### ActionSheet

```typescript
import { VStack, Button } from '@tachui/core'
import { ActionSheet, useActionSheet } from '@tachui/mobile-patterns'

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

  return Button('Show Options', showOptions).modifier.padding(16).build()
}
```

### Alert

```typescript
import { Alert, useAlert } from '@tachui/mobile-patterns'

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
    .build()
}
```

## Components

### ActionSheet

Bottom sheet with multiple action options:

```typescript
import { ActionSheet } from '@tachui/mobile-patterns'

ActionSheet({
  title: 'Photo Options',
  message: 'Choose how to add a photo',
  actions: [
    { title: 'Camera', icon: 'camera', action: () => openCamera() },
    { title: 'Photo Library', icon: 'photo', action: () => openLibrary() },
    { title: 'Cancel', style: 'cancel' },
  ],
  presentationStyle: 'sheet', // 'sheet' | 'popover' | 'fullscreen'
}).build()
```

### Alert

Modal alerts with customizable buttons:

```typescript
import { Alert } from '@tachui/mobile-patterns'

Alert({
  title: 'Network Error',
  message: 'Unable to connect to the server. Please check your connection.',
  actions: [
    { title: 'Retry', action: () => retryConnection() },
    { title: 'Cancel', style: 'cancel' },
  ],
  icon: 'wifi.slash',
}).build()
```

### SwipeActions

Swipe-to-reveal action buttons:

```typescript
import { SwipeActions, SwipeAction } from '@tachui/mobile-patterns'

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
}).build()
```

### PullToRefresh

Pull-down-to-refresh functionality:

```typescript
import { PullToRefresh } from '@tachui/mobile-patterns'
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
}).build()
```

## Advanced Patterns

### Modal Presentation

```typescript
import { presentModal, dismissModal } from '@tachui/mobile-patterns'

const presentSettings = () => {
  presentModal({
    content: SettingsView(),
    presentationStyle: 'sheet', // 'sheet' | 'fullscreen' | 'popover'
    detents: [.medium(), .large()], // iOS-style sheet sizing
    dismissible: true,
    onDismiss: () => console.log('Modal dismissed')
  })
}

const closeModal = () => {
  dismissModal()
}
```

### Haptic Feedback

```typescript
import { hapticFeedback } from '@tachui/mobile-patterns'

Button('Success Action', () => {
  // Perform action
  hapticFeedback('success') // 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy'
})
```

### SafeArea Support

```typescript
import { SafeAreaView } from '@tachui/mobile-patterns'

const app = SafeAreaView({
  children: [
    // Your app content
  ],
})
  .modifier.backgroundColor('#ffffff')
  .build()
```

### Gesture Handling

```typescript
import { GestureRecognizer } from '@tachui/mobile-patterns'

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
}).build()
```

## Platform Adaptations

### iOS-style Components

```typescript
import { IOSActionSheet, IOSAlert } from '@tachui/mobile-patterns'

// iOS-specific styling and behavior
IOSActionSheet({
  title: 'Options',
  actions: actions,
})
  .modifier.iosStyle(true)
  .build()
```

### Android-style Components

```typescript
import { MaterialActionSheet, MaterialAlert } from '@tachui/mobile-patterns'

// Material Design styling
MaterialActionSheet({
  title: 'Choose action',
  actions: actions,
})
  .modifier.materialStyle(true)
  .build()
```

## Animation and Transitions

```typescript
import { createMobileTransition } from '@tachui/mobile-patterns'

const slideUpTransition = createMobileTransition({
  type: 'slide',
  direction: 'up',
  duration: 0.3,
  easing: 'ease-out',
})

ActionSheet({ actions })
  .modifier.presentationTransition(slideUpTransition)
  .build()
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

- **[Mobile App Demo](https://github.com/tach-UI/tachUI/tree/main/apps/examples/mobile-patterns/app)**
- **[ActionSheet Gallery](https://github.com/tach-UI/tachUI/tree/main/apps/examples/mobile-patterns/actionsheet)**
- **[Swipe Actions List](https://github.com/tach-UI/tachUI/tree/main/apps/examples/mobile-patterns/swipe-actions)**

## API Reference

- **[ActionSheet API](https://github.com/tach-UI/tachUI/blob/main/docs/api/mobile-patterns/src/classes/ActionSheet.md)**
- **[Alert API](https://github.com/tach-UI/tachUI/blob/main/docs/api/mobile-patterns/src/classes/Alert.md)**
- **[SwipeActions API](https://github.com/tach-UI/tachUI/blob/main/docs/api/mobile-patterns/src/classes/SwipeActions.md)**

## Requirements

- **@tachui/core** ^0.1.0 or later
- **TypeScript** 5.0+ (recommended)

## Contributing

See the main [Contributing Guide](https://github.com/tach-UI/tachUI/blob/main/CONTRIBUTING.md) for information on contributing to tachUI mobile patterns.

## License

Mozilla Public License 2.0 - see [LICENSE](https://github.com/tach-UI/tachUI/blob/main/LICENSE) for details.
