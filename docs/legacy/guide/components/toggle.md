# Toggle Component

The Toggle component provides a switch interface with SwiftUI-inspired styling and behavior.

## Overview

The Toggle component is part of TachUI's core component library, providing consistent toggle switches for boolean values.

```typescript
import { Toggle } from '@tachui/core'

Toggle('Enable notifications', isEnabled, {
  onChange: setEnabled
})
```

## Props

- `label` - Toggle label text
- `isOn` - Current toggle state
- `onChange` - State change handler
- `disabled` - Disable the toggle
- `variant` - Toggle style variant

## Usage Examples

```typescript
// Basic toggle
Toggle('Dark mode', darkMode, {
  onChange: setDarkMode
})

// Toggle with custom styling
Toggle('Advanced features', advanced, {
  onChange: setAdvanced,
  variant: 'success'
})

// Disabled toggle
Toggle('Premium feature', false, {
  disabled: true
})
```

For complete API documentation, see the TypeScript definitions in `@tachui/core`.