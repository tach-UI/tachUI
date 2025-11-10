# Slider Component

The Slider component provides value selection within a range with SwiftUI-inspired styling and behavior.

## Overview

The Slider component is part of TachUI's advanced-forms plugin, providing consistent range selection interfaces for advanced form controls.

```typescript
import { Slider } from '@tachui/advanced-forms'

Slider(value, {
  min: 0,
  max: 100,
  step: 1,
  onChange: setValue
})
```

## Props

- `value` - Current slider value
- `min` - Minimum value (default: 0)
- `max` - Maximum value (default: 100)
- `step` - Step increment (default: 1)
- `onChange` - Value change handler
- `disabled` - Disable the slider
- `showValue` - Display current value

## Usage Examples

```typescript
// Basic slider
Slider(volume, {
  min: 0,
  max: 10,
  onChange: setVolume
})

// Slider with steps and marks
Slider(quality, {
  min: 1,
  max: 5,
  step: 1,
  marks: ['Low', 'Medium', 'High', 'Ultra', 'Max'],
  onChange: setQuality
})

// Range slider
Slider([minPrice, maxPrice], {
  min: 0,
  max: 1000,
  range: true,
  onChange: setPriceRange
})
```

For complete API documentation, see the TypeScript definitions in `@tachui/core`.