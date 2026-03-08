# Alert Component

The Alert component provides critical user feedback, confirmations, and error handling with SwiftUI-style modal dialogs, backdrop, and smooth animations.

## Overview

Alert displays a modal dialog that appears above all other content, requiring user interaction to dismiss. It supports multiple buttons, reactive content, and comprehensive customization options.

## Basic Usage

```typescript
import { Alert } from '@tachui/mobile-patterns'
import { createSignal } from '@tachui/core'

function BasicAlert() {
  const [showAlert, setShowAlert] = createSignal(false)
  
  return VStack({
    children: [
      Button("Show Alert")
        .modifier
        .onTap(() => setShowAlert(true))
        .build(),
        
      Alert({
        title: "Confirmation",
        message: "Are you sure you want to continue?",
        isPresented: showAlert,
        buttons: [
          {
            title: "Cancel",
            role: "cancel"
          },
          {
            title: "Continue",
            role: "default",
            action: () => {
              console.log("User confirmed!")
            }
          }
        ]
      })
    ]
  })
}
```

## Alert Types

### Information Alert

```typescript
function InfoAlert() {
  const [showInfo, setShowInfo] = createSignal(false)
  
  return Alert({
    title: "Welcome!",
    message: "Thanks for using TachUI framework.",
    isPresented: showInfo,
    buttons: [
      {
        title: "OK",
        role: "default"
      }
    ]
  })
}
```

### Confirmation Alert

```typescript
function ConfirmationAlert() {
  const [showConfirm, setShowConfirm] = createSignal(false)
  
  return Alert({
    title: "Save Changes?",
    message: "You have unsaved changes. Would you like to save them?",
    isPresented: showConfirm,
    buttons: [
      {
        title: "Don't Save",
        role: "cancel"
      },
      {
        title: "Cancel",
        role: "default"
      },
      {
        title: "Save",
        role: "default",
        action: async () => {
          await saveChanges()
        }
      }
    ]
  })
}
```

### Destructive Alert

```typescript
function DestructiveAlert() {
  const [showDelete, setShowDelete] = createSignal(false)
  
  return Alert({
    title: "Delete Item",
    message: "This action cannot be undone. Are you sure?",
    isPresented: showDelete,
    buttons: [
      {
        title: "Cancel",
        role: "cancel"
      },
      {
        title: "Delete",
        role: "destructive",
        action: async () => {
          await deleteItem()
        }
      }
    ]
  })
}
```

## Reactive Content

```typescript
function ReactiveAlert() {
  const [isPresented, setIsPresented] = createSignal(false)
  const [itemCount, setItemCount] = createSignal(5)
  const [title] = createComputed(() => `Delete ${itemCount()} Items`)
  const [message] = createComputed(() => 
    `Are you sure you want to delete ${itemCount()} selected items?`
  )
  
  return Alert({
    title, // Reactive title
    message, // Reactive message
    isPresented,
    buttons: [
      {
        title: "Cancel",
        role: "cancel"
      },
      {
        title: "Delete All",
        role: "destructive",
        action: () => deleteSelectedItems()
      }
    ]
  })
}
```

## Button Configuration

### Button Roles

```typescript
// Default button (primary action)
{
  title: "OK",
  role: "default"
}

// Cancel button (secondary action)
{
  title: "Cancel", 
  role: "cancel"
}

// Destructive button (dangerous action)
{
  title: "Delete",
  role: "destructive"
}
```

### Async Button Actions

```typescript
{
  title: "Save to Cloud",
  role: "default",
  action: async () => {
    try {
      await uploadToCloud()
      showSuccess("Saved successfully!")
    } catch (error) {
      showError("Failed to save")
    }
  }
}
```

## Customization

### Behavior Options

```typescript
Alert({
  title: "Custom Alert",
  message: "Customized behavior example",
  isPresented: showAlert,
  buttons: [{ title: "OK" }],
  
  // Backdrop behavior
  dismissOnBackdrop: false, // Don't dismiss when clicking backdrop
  escapeKeyDismisses: true,  // Allow Escape key to dismiss
  
  // Animation
  animationDuration: 300, // Custom animation duration
  
  // Accessibility
  accessibilityLabel: "Important confirmation dialog"
})
```

### Custom Theme

```typescript
import { AlertStyles } from '@tachui/core'

const customTheme = AlertStyles.createTheme({
  colors: {
    background: '#1F2937',
    text: '#F9FAFB',
    buttonDefault: '#3B82F6',
    buttonDestructive: '#EF4444'
  },
  borderRadius: 12,
  maxWidth: 400
})

// Apply theme globally or to specific alerts
AlertStyles.theme = customTheme
```

## Utility Functions

### AlertUtils.confirm()

Quick confirmation dialog:

```typescript
import { AlertUtils } from '@tachui/core'

function handleDelete() {
  const alertProps = AlertUtils.confirm(
    "Delete File",
    "This will permanently delete the file.",
    () => performDelete(),
    () => console.log("Cancelled")
  )
  
  // Use with Alert component
  return Alert(alertProps)
}
```

### AlertUtils.destructive()

Destructive action dialog:

```typescript
const alertProps = AlertUtils.destructive(
  "Clear All Data",
  "This will remove all your data permanently.",
  "Clear All",
  () => clearAllData(),
  () => console.log("Cancelled")
)
```

### AlertUtils.info()

Simple information dialog:

```typescript
const alertProps = AlertUtils.info(
  "Update Available",
  "A new version is available for download."
)
```

## Accessibility Features

The Alert component includes comprehensive accessibility support:

- **ARIA Roles**: Proper `alertdialog` role and modal attributes
- **Keyboard Navigation**: Escape key support and focus management
- **Screen Reader Support**: Proper labeling and descriptions
- **Focus Trapping**: Keeps focus within the alert dialog

```typescript
Alert({
  title: "Accessible Alert",
  message: "This alert is fully accessible",
  isPresented: showAlert,
  buttons: [{ title: "OK" }],
  accessibilityLabel: "Important system notification"
})
```

## Animation and Transitions

Alerts support smooth animations with customizable duration:

```typescript
Alert({
  title: "Animated Alert",
  isPresented: showAlert,
  buttons: [{ title: "OK" }],
  animationDuration: 250, // Custom animation timing
})
```

The alert animates with:
- **Backdrop fade-in**: Smooth background overlay
- **Scale and opacity**: Content scales from 0.9 to 1.0 with opacity fade
- **Cubic bezier easing**: Natural, bouncy animation curve

## Best Practices

### 1. Clear and Concise Messaging

```typescript
// ✅ Good - Clear and actionable
Alert({
  title: "Save Changes?",
  message: "Your document has unsaved changes.",
  buttons: [
    { title: "Don't Save", role: "cancel" },
    { title: "Save", role: "default" }
  ]
})

// ❌ Avoid - Vague or technical
Alert({
  title: "Error",
  message: "Operation failed with code 0x8004002",
  buttons: [{ title: "OK" }]
})
```

### 2. Appropriate Button Roles

```typescript
// ✅ Good - Proper role usage
buttons: [
  { title: "Cancel", role: "cancel" },      // Secondary action
  { title: "Delete", role: "destructive" }  // Dangerous action
]

// ❌ Avoid - Misusing destructive role
buttons: [
  { title: "OK", role: "destructive" }  // OK is not destructive
]
```

### 3. Limit Button Count

```typescript
// ✅ Good - 2-3 buttons maximum
buttons: [
  { title: "Cancel", role: "cancel" },
  { title: "Save", role: "default" }
]

// ❌ Avoid - Too many options
buttons: [
  { title: "Cancel" },
  { title: "Save" },
  { title: "Save As" },
  { title: "Export" },
  { title: "Share" }
]
```

### 4. Handle Async Actions

```typescript
// ✅ Good - Proper error handling
{
  title: "Upload",
  action: async () => {
    try {
      await uploadFile()
      showSuccess("File uploaded!")
    } catch (error) {
      showError("Upload failed")
    }
  }
}
```

## Common Patterns

### Progressive Disclosure

```typescript
function ProgressiveAlert() {
  const [step, setStep] = createSignal(1)
  const [showAlert, setShowAlert] = createSignal(false)
  
  const alertTitle = createComputed(() => {
    return step() === 1 ? "Confirm Action" : "Final Confirmation"
  })
  
  const alertMessage = createComputed(() => {
    return step() === 1 
      ? "This will affect multiple items. Continue?"
      : "This action cannot be undone. Are you absolutely sure?"
  })
  
  const buttons = createComputed(() => {
    if (step() === 1) {
      return [
        { title: "Cancel", role: "cancel" as const },
        { 
          title: "Continue", 
          role: "default" as const,
          action: () => setStep(2)
        }
      ]
    } else {
      return [
        { 
          title: "Go Back", 
          role: "cancel" as const,
          action: () => setStep(1)
        },
        { 
          title: "Delete", 
          role: "destructive" as const,
          action: () => performDeletion()
        }
      ]
    }
  })
  
  return Alert({
    title: alertTitle,
    message: alertMessage,
    isPresented: showAlert,
    buttons: buttons()
  })
}
```

### Context-Aware Alerts

```typescript
function ContextAlert({ context }: { context: 'file' | 'folder' | 'multiple' }) {
  const [showAlert, setShowAlert] = createSignal(false)
  
  const contextMessages = {
    file: "This will delete the selected file.",
    folder: "This will delete the folder and all its contents.",
    multiple: "This will delete all selected items."
  }
  
  return Alert({
    title: "Delete Items",
    message: contextMessages[context],
    isPresented: showAlert,
    buttons: [
      { title: "Cancel", role: "cancel" },
      { title: "Delete", role: "destructive", action: () => deleteItems() }
    ]
  })
}
```

## API Reference

### AlertProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string \| Signal<string>` | - | Alert title (required) |
| `message` | `string \| Signal<string>` | - | Alert message (optional) |
| `buttons` | `AlertButton[]` | - | Array of button configurations (required) |
| `isPresented` | `Signal<boolean>` | - | Controls alert visibility (required) |
| `dismissOnBackdrop` | `boolean` | `true` | Allow dismissing by clicking backdrop |
| `escapeKeyDismisses` | `boolean` | `true` | Allow dismissing with Escape key |
| `animationDuration` | `number` | `200` | Animation duration in milliseconds |
| `accessibilityLabel` | `string` | - | Accessibility label for screen readers |

### AlertButton

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | - | Button text (required) |
| `role` | `'default' \| 'cancel' \| 'destructive'` | `'default'` | Button semantic role |
| `action` | `() => void \| Promise<void>` | - | Button action handler (optional) |

### AlertUtils Methods

- `AlertUtils.confirm(title, message, onConfirm, onCancel?)` - Create confirmation alert
- `AlertUtils.destructive(title, message, buttonTitle, onDestructive, onCancel?)` - Create destructive action alert  
- `AlertUtils.info(title, message?)` - Create informational alert

### AlertStyles

- `AlertStyles.theme` - Default alert theme
- `AlertStyles.createTheme(overrides)` - Create custom theme