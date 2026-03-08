# Picker Component

The Picker component provides selection from a list of options with SwiftUI-inspired styling and behavior.

## Overview

The Picker component is part of TachUI's core component library, providing consistent selection interfaces for users.

```typescript
import { Picker } from '@tachui/core'

Picker('Select option', selectedValue, options, {
  onChange: handleChange
})
```

## Props

- `label` - Picker label text
- `selection` - Currently selected value
- `options` - Array of selectable options
- `onChange` - Selection change handler
- `disabled` - Disable the picker

## Usage Examples

```typescript
// Basic picker
Picker('Choose size', size, ['Small', 'Medium', 'Large'], {
  onChange: setSize
})

// Picker with object options
Picker('Select user', user, users, {
  onChange: setUser,
  keyPath: 'id',
  displayPath: 'name'
})
```

For complete API documentation, see the TypeScript definitions in `@tachui/core`.