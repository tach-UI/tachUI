# Menu Component

The Menu component provides SwiftUI-style dropdown menus, context menus, and action sheets with intelligent positioning, keyboard navigation, and comprehensive customization options.

## Overview

Menu displays a dropdown menu when triggered, with support for keyboard navigation, nested submenus, reactive content, and accessibility features. It automatically handles positioning, animations, and user interactions.

## Basic Usage

```typescript
import { Menu, Button, createSignal } from '@tachui/core'

function BasicMenu() {
  const [isOpen, setIsOpen] = createSignal(false)
  
  const menuItems = [
    {
      title: "New File",
      systemImage: "📄",
      shortcut: "Cmd+N",
      action: () => createNewFile()
    },
    {
      title: "Open",
      systemImage: "📁", 
      shortcut: "Cmd+O",
      action: () => openFile()
    },
    {
      title: "---" // Separator
    },
    {
      title: "Delete",
      role: "destructive",
      systemImage: "🗑️",
      action: () => deleteFile()
    }
  ]
  
  return Menu({
    trigger: Button("File Menu")
      .modifier
      .backgroundColor('#007AFF')
      .foregroundColor('#FFFFFF')
      .padding(12)
      .cornerRadius(8)
      .build(),
    items: menuItems,
    isOpen
  })
}
```

## Menu Items

### Basic Menu Items

```typescript
const basicItems = [
  {
    title: "Copy",
    action: () => copy()
  },
  {
    title: "Paste", 
    action: () => paste()
  }
]
```

### Items with Icons and Shortcuts

```typescript
const enhancedItems = [
  {
    title: "Cut",
    systemImage: "✂️",
    shortcut: "Cmd+X",
    action: () => cut()
  },
  {
    title: "Copy",
    systemImage: "📋",
    shortcut: "Cmd+C", 
    action: () => copy()
  },
  {
    title: "Paste",
    systemImage: "📄",
    shortcut: "Cmd+V",
    action: () => paste()
  }
]
```

### Separators and Roles

```typescript
const organizedItems = [
  {
    title: "Edit",
    role: "default",
    action: () => edit()
  },
  {
    title: "---" // Separator line
  },
  {
    title: "Cancel", 
    role: "cancel",
    action: () => cancel()
  },
  {
    title: "Delete",
    role: "destructive",
    systemImage: "🗑️",
    action: () => deleteItem()
  }
]
```

### Disabled Items

```typescript
function DisabledItemsMenu() {
  const [hasSelection, setHasSelection] = createSignal(false)
  
  const items = [
    {
      title: "Cut",
      disabled: createComputed(() => !hasSelection()), // Reactive disabled state
      action: () => cut()
    },
    {
      title: "Copy",
      disabled: false, // Always enabled
      action: () => copy()
    },
    {
      title: "Paste",
      disabled: true, // Always disabled
      action: () => paste()
    }
  ]
  
  return Menu({
    trigger: Button("Edit"),
    items
  })
}
```

## Reactive Menu Content

```typescript
function ReactiveMenu() {
  const [itemCount, setItemCount] = createSignal(5)
  const [isMultipleSelected, setIsMultipleSelected] = createSignal(false)
  
  const dynamicTitle = createComputed(() => 
    isMultipleSelected() 
      ? `Delete ${itemCount()} Items`
      : "Delete Item"
  )
  
  const items = [
    {
      title: "Select All",
      action: () => selectAll()
    },
    {
      title: dynamicTitle, // Reactive title
      role: "destructive",
      disabled: createComputed(() => itemCount() === 0),
      action: () => deleteSelected()
    }
  ]
  
  return Menu({
    trigger: Button("Actions"),
    items
  })
}
```

## Menu Positioning

### Placement Options

```typescript
function PositionedMenu() {
  const items = [
    { title: "Option 1", action: () => {} },
    { title: "Option 2", action: () => {} }
  ]
  
  return VStack({
    children: [
      // Bottom placement (default)
      Menu({
        trigger: Button("Bottom Menu"),
        items,
        placement: "bottom"
      }),
      
      // Top placement
      Menu({
        trigger: Button("Top Menu"), 
        items,
        placement: "top-end"
      }),
      
      // Right placement
      Menu({
        trigger: Button("Right Menu"),
        items, 
        placement: "right-start"
      })
    ]
  })
}
```

Available placement options:
- `bottom`, `bottom-start`, `bottom-end`
- `top`, `top-start`, `top-end`  
- `left`, `left-start`, `left-end`
- `right`, `right-start`, `right-end`

### Custom Positioning

```typescript
Menu({
  trigger: Button("Custom Position"),
  items,
  placement: "bottom-start",
  offset: { x: 10, y: 5 }, // Custom offset
  flip: true, // Auto-flip when near viewport edge
  shift: true // Auto-shift to stay in viewport
})
```

## Submenus and Nested Content

```typescript
function NestedMenu() {
  const items = [
    {
      title: "File",
      submenu: [
        {
          title: "New",
          submenu: [
            { title: "Document", action: () => newDocument() },
            { title: "Folder", action: () => newFolder() },
            { title: "Project", action: () => newProject() }
          ]
        },
        { title: "Open", action: () => openFile() },
        { title: "Save", action: () => saveFile() }
      ]
    },
    {
      title: "Edit", 
      submenu: [
        { title: "Cut", shortcut: "Cmd+X", action: () => cut() },
        { title: "Copy", shortcut: "Cmd+C", action: () => copy() },
        { title: "Paste", shortcut: "Cmd+V", action: () => paste() }
      ]
    }
  ]
  
  return Menu({
    trigger: Button("Main Menu"),
    items
  })
}
```

## Behavioral Customization

```typescript
function CustomBehaviorMenu() {
  const items = [
    { title: "Option 1", action: () => console.log("Option 1") },
    { title: "Option 2", action: () => console.log("Option 2") }
  ]
  
  return Menu({
    trigger: Button("Custom Menu"),
    items,
    
    // Behavior options
    closeOnSelect: false, // Keep menu open after selection
    closeOnClickOutside: true, // Close when clicking outside
    escapeKeyCloses: true, // Allow Escape key to close
    
    // Animation
    animationDuration: 250,
    
    // Accessibility 
    accessibilityLabel: "Action menu with file operations"
  })
}
```

## Keyboard Navigation

Menus automatically support full keyboard navigation:

- **Arrow Keys**: Navigate through menu items
- **Enter/Space**: Activate selected item  
- **Escape**: Close menu
- **Home/End**: Jump to first/last item
- **Tab**: Move focus (with proper focus trapping)

```typescript
// Keyboard navigation is automatic, but you can customize
Menu({
  trigger: Button("Keyboard Menu"),
  items: [
    { title: "First Item", action: () => {} },
    { title: "Second Item", action: () => {} },
    { title: "Third Item", action: () => {} }
  ],
  escapeKeyCloses: true // Enable Escape key
})
```

## Context Menus

```typescript
function ContextMenuExample() {
  const [contextMenuOpen, setContextMenuOpen] = createSignal(false)
  const [contextPosition, setContextPosition] = createSignal({ x: 0, y: 0 })
  
  const contextItems = [
    { title: "Copy", systemImage: "📋", action: () => copy() },
    { title: "Cut", systemImage: "✂️", action: () => cut() },
    { title: "---" },
    { title: "Delete", role: "destructive", action: () => deleteItem() }
  ]
  
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    setContextPosition({ x: e.clientX, y: e.clientY })
    setContextMenuOpen(true)
  }
  
  return VStack({
    children: [
      Text("Right-click me for context menu")
        .modifier
        .padding(20)
        .backgroundColor('#F0F0F0')
        .cornerRadius(8)
        .onMouseDown((e) => {
          if (e.button === 2) { // Right click
            handleContextMenu(e)
          }
        })
        .build(),
        
      // Position context menu manually
      Menu({
        trigger: Text(""), // Hidden trigger
        items: contextItems,
        isOpen: contextMenuOpen,
        placement: "bottom-start",
        offset: contextPosition()
      })
    ]
  })
}
```

## Utility Functions

### MenuUtils.separator()

```typescript
const items = [
  { title: "Copy", action: () => copy() },
  MenuUtils.separator(), // Creates { title: "---" }
  { title: "Delete", action: () => deleteItem() }
]
```

### MenuUtils.destructive()

```typescript
const deleteItem = MenuUtils.destructive(
  "Delete File",
  () => deleteFile(),
  "🗑️"
)

// Equivalent to:
// {
//   title: "Delete File",
//   destructive: true,
//   systemImage: "🗑️", 
//   action: () => deleteFile()
// }
```

### MenuUtils.withShortcut()

```typescript
const copyItem = MenuUtils.withShortcut(
  "Copy",
  "Cmd+C",
  () => copy(),
  "📋"
)

// Equivalent to:
// {
//   title: "Copy",
//   shortcut: "Cmd+C",
//   systemImage: "📋",
//   action: () => copy()
// }
```

## Custom Themes

```typescript
import { MenuStyles } from '@tachui/core'

// Create custom theme
const customTheme = MenuStyles.createTheme({
  colors: {
    background: '#1F2937',
    text: '#F9FAFB', 
    textDestructive: '#FCA5A5',
    hover: '#374151',
    border: '#4B5563'
  },
  borderRadius: 12,
  itemHeight: 40
})

// Use dark theme preset
const darkTheme = MenuStyles.darkTheme()
```

## Advanced Examples

### Multi-Level Navigation Menu

```typescript
function NavigationMenu() {
  const menuStructure = [
    {
      title: "Products",
      submenu: [
        {
          title: "Web Apps",
          submenu: [
            { title: "Dashboard", action: () => navigate('/dashboard') },
            { title: "Analytics", action: () => navigate('/analytics') },
            { title: "Settings", action: () => navigate('/settings') }
          ]
        },
        {
          title: "Mobile Apps", 
          submenu: [
            { title: "iOS App", action: () => openApp('ios') },
            { title: "Android App", action: () => openApp('android') }
          ]
        }
      ]
    },
    {
      title: "Documentation",
      action: () => navigate('/docs')
    },
    {
      title: "Support",
      action: () => navigate('/support')
    }
  ]
  
  return Menu({
    trigger: Button("Navigation")
      .modifier
      .backgroundColor('#007AFF')
      .foregroundColor('#FFFFFF')
      .build(),
    items: menuStructure,
    placement: "bottom-start"
  })
}
```

### Dynamic Menu with State

```typescript
function StatefulMenu() {
  const [user, setUser] = createSignal<User | null>(null)
  const [isAdmin, setIsAdmin] = createSignal(false)
  
  const menuItems = createComputed(() => {
    const baseItems = [
      { title: "Profile", action: () => showProfile() },
      { title: "Settings", action: () => showSettings() }
    ]
    
    if (isAdmin()) {
      baseItems.push(
        MenuUtils.separator(),
        { 
          title: "Admin Panel", 
          systemImage: "⚙️",
          action: () => showAdminPanel() 
        }
      )
    }
    
    baseItems.push(
      MenuUtils.separator(),
      MenuUtils.destructive("Sign Out", () => signOut(), "🚪")
    )
    
    return baseItems
  })
  
  return Menu({
    trigger: Button(`Welcome, ${user()?.name || 'Guest'}`),
    items: menuItems(),
    placement: "bottom-end"
  })
}
```

### Async Menu Actions

```typescript
function AsyncMenu() {
  const [isUploading, setIsUploading] = createSignal(false)
  
  const items = [
    {
      title: "Upload File",
      systemImage: "📁",
      disabled: isUploading,
      action: async () => {
        setIsUploading(true)
        try {
          await uploadFile()
          showSuccess("File uploaded!")
        } catch (error) {
          showError("Upload failed")
        } finally {
          setIsUploading(false)
        }
      }
    },
    {
      title: "Sync Data",
      systemImage: "🔄",
      action: async () => {
        await syncData()
        showSuccess("Data synced!")
      }
    }
  ]
  
  return Menu({
    trigger: Button("File Actions"),
    items
  })
}
```

## Best Practices

### 1. Logical Item Grouping

```typescript
// ✅ Good - Logical groups with separators
const items = [
  // File operations
  { title: "New File", action: () => {} },
  { title: "Open File", action: () => {} },
  { title: "Save File", action: () => {} },
  
  MenuUtils.separator(),
  
  // Edit operations  
  { title: "Cut", action: () => {} },
  { title: "Copy", action: () => {} },
  { title: "Paste", action: () => {} },
  
  MenuUtils.separator(),
  
  // Destructive actions
  { title: "Delete", role: "destructive", action: () => {} }
]
```

### 2. Appropriate Shortcuts

```typescript
// ✅ Good - Standard shortcuts
const items = [
  { title: "Copy", shortcut: "Cmd+C", action: () => {} },
  { title: "Paste", shortcut: "Cmd+V", action: () => {} },
  
  // ❌ Avoid - Non-standard or complex shortcuts
  // { title: "Action", shortcut: "Ctrl+Alt+Shift+X", action: () => {} }
]
```

### 3. Proper Role Usage

```typescript
// ✅ Good - Appropriate roles
const items = [
  { title: "Save", role: "default" }, // Primary action
  { title: "Cancel", role: "cancel" }, // Secondary/cancel action  
  { title: "Delete", role: "destructive" } // Dangerous action
]
```

### 4. Reasonable Item Counts

```typescript
// ✅ Good - Reasonable number of items
const items = [
  // 5-7 items maximum for good UX
  { title: "Action 1" },
  { title: "Action 2" }, 
  { title: "Action 3" },
  { title: "Action 4" },
  { title: "Action 5" }
]

// ❌ Avoid - Too many items
// const items = [...Array(20)].map((_, i) => ({ title: `Action ${i}` }))
```

## Accessibility Features

Menus include comprehensive accessibility support:

- **ARIA Roles**: Proper `menu` and `menuitem` roles
- **Keyboard Navigation**: Full arrow key and shortcut support  
- **Focus Management**: Focus trapping and restoration
- **Screen Reader Support**: Proper labeling and state announcements

```typescript
Menu({
  trigger: Button("Accessible Menu"),
  items: [
    { title: "Action 1", action: () => {} },
    { title: "Action 2", action: () => {} }
  ],
  accessibilityLabel: "File operations menu"
})
```

## API Reference

### MenuProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `MenuItem[]` | - | Menu items array (required) |
| `trigger` | `ComponentInstance \| HTMLElement \| (() => ComponentInstance \| HTMLElement)` | - | Menu trigger element (required) |
| `isOpen` | `Signal<boolean>` | - | Controls menu visibility (optional) |
| `placement` | `MenuPlacement` | `'bottom'` | Menu positioning |
| `closeOnSelect` | `boolean` | `true` | Close menu after item selection |
| `closeOnClickOutside` | `boolean` | `true` | Close menu when clicking outside |
| `escapeKeyCloses` | `boolean` | `true` | Allow Escape key to close |
| `offset` | `{ x: number; y: number }` | `{ x: 0, y: 4 }` | Positioning offset |
| `flip` | `boolean` | `true` | Auto-flip when near viewport edge |
| `shift` | `boolean` | `true` | Auto-shift to stay in viewport |
| `animationDuration` | `number` | `150` | Animation duration in milliseconds |
| `accessibilityLabel` | `string` | - | Accessibility label |

### MenuItem

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (optional) |
| `title` | `string \| Signal<string>` | Item text (required) |
| `systemImage` | `string` | Icon/emoji (optional) |
| `shortcut` | `string` | Keyboard shortcut display (optional) |
| `disabled` | `boolean \| Signal<boolean>` | Disabled state (optional) |
| `destructive` | `boolean` | Destructive styling (optional) |
| `role` | `'default' \| 'destructive' \| 'cancel'` | Semantic role (optional) |
| `action` | `() => void \| Promise<void>` | Click handler (optional) |
| `submenu` | `MenuItem[]` | Nested menu items (optional) |

### MenuUtils Methods

- `MenuUtils.separator()` - Create separator item
- `MenuUtils.destructive(title, action, systemImage?)` - Create destructive item
- `MenuUtils.withShortcut(title, shortcut, action, systemImage?)` - Create item with shortcut

### MenuStyles

- `MenuStyles.theme` - Default menu theme
- `MenuStyles.createTheme(overrides)` - Create custom theme  
- `MenuStyles.darkTheme()` - Dark theme preset