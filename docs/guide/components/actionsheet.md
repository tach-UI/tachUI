# ActionSheet

A SwiftUI-inspired action sheet component for presenting contextual choices in response to user actions. Automatically adapts between mobile (bottom sheet) and desktop (popover) presentations.

## Overview

The `ActionSheet` component provides a mobile-first approach to presenting multiple related actions to users. It follows SwiftUI patterns with support for different button roles, responsive presentation styles, and comprehensive accessibility features.

## Basic Usage

```typescript
import { ActionSheet } from '@tachui/mobile-patterns'
import { createSignal } from '@tachui/core'

function BasicExample() {
  const [showSheet, setShowSheet] = createSignal(false)

  return ActionSheet({
    title: "Choose an action",
    isPresented: showSheet,
    onDismiss: () => setShowSheet(false),
    buttons: [
      {
        label: "Edit",
        onPress: () => {
          console.log("Edit selected")
          setShowSheet(false)
        }
      },
      {
        label: "Delete",
        role: "destructive",
        onPress: () => {
          console.log("Delete selected")
          setShowSheet(false)
        }
      },
      {
        label: "Cancel",
        role: "cancel",
        onPress: () => setShowSheet(false)
      }
    ]
  }).build()
}
```

## API Reference

### ActionSheetProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isPresented` | `boolean \\| Signal<boolean>` | **Required** | Controls sheet visibility |
| `buttons` | `ActionSheetButton[]` | **Required** | Array of action buttons |
| `title` | `string` | `undefined` | Sheet title text |
| `message` | `string` | `undefined` | Optional description text |
| `presentationStyle` | `'sheet' \\| 'popover' \\| 'adaptive'` | `'adaptive'` | Presentation style |
| `allowsBackdropDismissal` | `boolean \\| Signal<boolean>` | `true` | Allow tap-outside-to-dismiss |
| `onDismiss` | `() => void` | `undefined` | Callback when sheet is dismissed |
| `anchorElement` | `HTMLElement` | `undefined` | Anchor for popover positioning |
| `accessibilityLabel` | `string` | `undefined` | ARIA label for accessibility |
| `accessibilityHint` | `string` | `undefined` | ARIA description for accessibility |

### ActionSheetButton

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | **Required** | Button text |
| `onPress` | `() => void` | **Required** | Button action callback |
| `id` | `string` | `undefined` | Optional button identifier |
| `role` | `'default' \\| 'destructive' \\| 'cancel'` | `'default'` | Button role and styling |
| `disabled` | `boolean \\| Signal<boolean>` | `false` | Whether button is disabled |

## Button Roles

### Default Role
Standard action buttons with normal styling:

```typescript
ActionSheet({
  title: "Actions",
  isPresented: showSheet,
  buttons: [
    {
      label: "Share",
      role: "default", // Optional - this is the default
      onPress: () => shareItem()
    }
  ]
}).build()
```

### Destructive Role
For dangerous actions like deletion. Styled with red text and positioned first:

```typescript
ActionSheet({
  title: "Delete Item?",
  message: "This action cannot be undone.",
  isPresented: showSheet,
  buttons: [
    {
      label: "Delete",
      role: "destructive",
      onPress: () => deleteItem()
    },
    {
      label: "Cancel",
      role: "cancel",
      onPress: () => setShowSheet(false)
    }
  ]
}).build()
```

### Cancel Role
For dismissal actions. Styled with bold text and positioned last:

```typescript
ActionSheet({
  title: "Options",
  isPresented: showSheet,
  buttons: [
    {
      label: "Option 1",
      onPress: () => selectOption1()
    },
    {
      label: "Cancel",
      role: "cancel",
      onPress: () => setShowSheet(false)
    }
  ]
}).build()
```

## Presentation Styles

### Adaptive Style (Default)
Automatically chooses the best presentation for the screen size:
- **Mobile (≤768px)**: Bottom sheet that slides up
- **Desktop (>768px)**: Centered popover with backdrop

```typescript
ActionSheet({
  title: "Adaptive Presentation",
  isPresented: showSheet,
  presentationStyle: "adaptive", // Default
  buttons: [/* ... */]
}).build()
```

### Sheet Style
Always presents as a bottom sheet, regardless of screen size:

```typescript
ActionSheet({
  title: "Bottom Sheet",
  isPresented: showSheet,
  presentationStyle: "sheet",
  buttons: [/* ... */]
}).build()
```

### Popover Style
Always presents as a centered popover:

```typescript
ActionSheet({
  title: "Popover Style",
  isPresented: showSheet,
  presentationStyle: "popover",
  buttons: [/* ... */]
}).build()
```

## Responsive Behavior

The ActionSheet automatically adapts its presentation based on screen size when using adaptive style:

```typescript
function ResponsiveActionSheet() {
  const [showSheet, setShowSheet] = createSignal(false)

  return VStack({
    children: [
      Button({
        title: "Show Actions",
        action: () => setShowSheet(true)
      }).build(),

      ActionSheet({
        title: "Responsive Actions",
        message: "This will appear as a bottom sheet on mobile and a popover on desktop",
        isPresented: showSheet,
        onDismiss: () => setShowSheet(false),
        buttons: [
          {
            label: "Primary Action",
            onPress: () => {
              console.log("Primary action")
              setShowSheet(false)
            }
          },
          {
            label: "Secondary Action",
            onPress: () => {
              console.log("Secondary action")
              setShowSheet(false)
            }
          },
          {
            label: "Cancel",
            role: "cancel",
            onPress: () => setShowSheet(false)
          }
        ]
      }).build()
    ]
  }).build()
}
```

## Event Handling

### Dismissal Handling
ActionSheets can be dismissed in multiple ways:

```typescript
function DismissalExample() {
  const [showSheet, setShowSheet] = createSignal(false)

  return ActionSheet({
    title: "Dismissal Options",
    isPresented: showSheet,
    
    // Called whenever the sheet is dismissed
    onDismiss: () => {
      console.log("Sheet was dismissed")
      setShowSheet(false)
    },
    
    // Allow/disallow backdrop dismissal
    allowsBackdropDismissal: true, // Default
    
    buttons: [
      {
        label: "Action",
        onPress: () => {
          // Explicitly dismiss after action
          setShowSheet(false)
        }
      },
      {
        label: "Cancel",
        role: "cancel",
        onPress: () => setShowSheet(false)
      }
    ]
  }).build()
}
```

### Preventing Backdrop Dismissal
For critical actions, disable backdrop dismissal:

```typescript
ActionSheet({
  title: "Important Choice",
  message: "Please select one of the options below.",
  isPresented: showSheet,
  allowsBackdropDismissal: false, // User must choose a button
  buttons: [
    {
      label: "Proceed",
      onPress: () => handleProceed()
    },
    {
      label: "Cancel",
      role: "cancel", 
      onPress: () => setShowSheet(false)
    }
  ]
}).build()
```

## ActionSheetUtils

Pre-configured ActionSheet setups for common use cases:

### Confirmation Dialog
For simple yes/no confirmations:

```typescript
import { ActionSheetUtils } from '@tachui/core'

function ConfirmationExample() {
  const [showConfirm, setShowConfirm] = createSignal(false)

  const confirmProps = ActionSheetUtils.confirmation(
    "Save Changes?",
    "Your changes will be saved permanently.",
    () => {
      saveChanges()
      setShowConfirm(false)
    },
    () => setShowConfirm(false), // Cancel callback
    "Save", // Confirm button label
    false // Not destructive
  )

  return ActionSheet({
    ...confirmProps,
    isPresented: showConfirm,
    onDismiss: () => setShowConfirm(false)
  }).build()
}
```

### Delete Confirmation
Pre-configured for deletion actions:

```typescript
function DeleteExample() {
  const [showDelete, setShowDelete] = createSignal(false)

  const deleteProps = ActionSheetUtils.deleteConfirmation(
    "Photo", // Item name
    () => {
      deletePhoto()
      setShowDelete(false)
    },
    () => setShowDelete(false) // Cancel callback
  )

  return ActionSheet({
    ...deleteProps,
    isPresented: showDelete,
    onDismiss: () => setShowDelete(false)
  }).build()
}
```

### Share Actions
For social sharing and export options:

```typescript
function ShareExample() {
  const [showShare, setShowShare] = createSignal(false)

  const shareProps = ActionSheetUtils.shareActions(
    [
      {
        label: "Copy Link",
        onPress: () => {
          copyToClipboard(itemUrl)
          setShowShare(false)
        }
      },
      {
        label: "Share to Twitter", 
        onPress: () => {
          shareToTwitter(item)
          setShowShare(false)
        }
      },
      {
        label: "Send via Email",
        onPress: () => {
          shareViaEmail(item)
          setShowShare(false)
        }
      }
    ],
    () => setShowShare(false) // Cancel callback
  )

  return ActionSheet({
    ...shareProps,
    isPresented: showShare,
    onDismiss: () => setShowShare(false)
  }).build()
}
```

## Accessibility

### ARIA Labels
Provide proper accessibility information:

```typescript
ActionSheet({
  title: "Document Actions",
  isPresented: showSheet,
  accessibilityLabel: "Document action menu",
  accessibilityHint: "Choose an action to perform on the selected document",
  buttons: [
    {
      label: "Delete Document",
      role: "destructive",
      onPress: () => deleteDocument()
    }
  ]
}).build()
```

### Keyboard Navigation
ActionSheets support full keyboard navigation:
- **Tab/Shift+Tab**: Navigate between buttons
- **Enter/Space**: Activate focused button
- **Escape**: Dismiss sheet (if backdrop dismissal is enabled)
- **Arrow Keys**: Navigate between buttons

### Screen Reader Support
- Buttons are properly announced with their roles
- Destructive actions are identified as such
- Sheet title and message are read when opened
- Focus is managed automatically

## Styling with Modifiers

ActionSheets integrate with the TachUI modifier system:

```typescript
ActionSheet({
  title: "Styled ActionSheet",
  isPresented: showSheet,
  buttons: [/* ... */]
})
.modifier
.backgroundColor('rgba(0, 0, 0, 0.8)')
.borderRadius(16)
.shadow({ x: 0, y: 4, radius: 20, color: 'rgba(0,0,0,0.3)' })
.build()
```

## Custom Theming

Create custom ActionSheet themes:

```typescript
import { ActionSheetStyles } from '@tachui/core'

const customTheme = ActionSheetStyles.createTheme({
  colors: {
    ...ActionSheetStyles.theme.colors,
    destructiveText: '#FF6B6B',
    cancelText: '#4ECDC4',
    background: '#2C2C2E'
  },
  spacing: {
    ...ActionSheetStyles.theme.spacing,
    padding: 20,
    borderRadius: 16
  },
  typography: {
    ...ActionSheetStyles.theme.typography,
    buttonSize: 18,
    titleWeight: '700'
  }
})

// Apply theme in your app initialization
```

## Best Practices

### 1. Button Limit
Keep the number of actions reasonable (3-5 options max):

```typescript
// Good - Clear, focused choices
ActionSheet({
  title: "Photo Actions",
  buttons: [
    { label: "Edit", onPress: () => editPhoto() },
    { label: "Share", onPress: () => sharePhoto() },
    { label: "Delete", role: "destructive", onPress: () => deletePhoto() },
    { label: "Cancel", role: "cancel", onPress: () => dismiss() }
  ]
})

// Avoid - Too many options create decision paralysis
ActionSheet({
  buttons: [
    /* 8+ different actions */
  ]
})
```

### 2. Clear Action Labels
Use action-oriented, specific language:

```typescript
// Good - Specific and clear
{
  label: "Delete Photo",
  role: "destructive",
  onPress: () => deletePhoto()
}

// Avoid - Vague or unclear
{
  label: "Remove",
  onPress: () => deletePhoto()
}
```

### 3. Proper Role Assignment
Use button roles to communicate action importance:

```typescript
ActionSheet({
  title: "Unsaved Changes",
  buttons: [
    { 
      label: "Discard Changes", 
      role: "destructive", // Data loss is destructive
      onPress: () => discardChanges() 
    },
    { 
      label: "Save", 
      role: "default", // Primary action
      onPress: () => saveChanges() 
    },
    { 
      label: "Cancel", 
      role: "cancel", // Always cancel role for dismissal
      onPress: () => dismiss() 
    }
  ]
})
```

### 4. Context-Appropriate Triggering
Present ActionSheets in response to user actions, not automatically:

```typescript
// Good - User-initiated
Button({
  title: "More Options",
  action: () => setShowSheet(true)
})

// Avoid - Automatic/unexpected presentation
createEffect(() => {
  if (someCondition()) {
    setShowSheet(true) // Unexpected interruption
  }
})
```

### 5. Handle Edge Cases
Always provide fallbacks and handle errors gracefully:

```typescript
ActionSheet({
  title: "Export Data",
  buttons: [
    {
      label: "Export as PDF",
      onPress: async () => {
        try {
          await exportToPDF()
          setShowSheet(false)
        } catch (error) {
          // Handle export failure
          showErrorAlert(error)
          setShowSheet(false)
        }
      }
    }
  ]
})
```

## Performance Considerations

- ActionSheets are optimized for smooth animations
- Sheet content is rendered only when presented
- Backdrop dismissal uses efficient event delegation
- Responsive breakpoint detection is cached

## Browser Support

ActionSheet uses modern web standards:
- **Animations**: CSS transforms and transitions (IE10+)
- **Backdrop**: Uses fixed positioning and event delegation
- **Responsive**: Uses matchMedia API (IE10+)
- **Accessibility**: Full ARIA support (IE11+)

For maximum compatibility, the component gracefully degrades animation features on older browsers.

---

## Related Components

- [**Alert**](./alert.md) - Modal alerts for critical messages and simple confirmations
- [**Menu**](./menu.md) - Contextual menus for navigation and quick actions  
- [**Button**](./button.md) - Individual action buttons with similar styling patterns