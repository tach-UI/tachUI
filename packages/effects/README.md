# @tachui/effects

Visual effects and advanced modifiers for the tachUI framework.

## Overview

This package provides comprehensive visual effects including:

- **Filters**: Blur, brightness, contrast, saturation, and photo effects
- **Transforms**: 2D/3D transforms, scale, rotate, translate, skew, perspective
- **Backdrop Effects**: Glassmorphism, backdrop-filters, and advanced visual effects
- **Interactive Effects**: Hover effects, cursor styling, and interaction patterns

## Installation

```bash
npm install @tachui/effects
```

## Usage

### Basic Filters

```typescript
import { blur, brightness, contrast, vintagePhoto } from '@tachui/effects'

// Apply filters to components
VStack().apply(blur(5)).apply(brightness(1.2)).apply(contrast(1.1))

// Use preset filter combinations
Text('Vintage Style').apply(vintagePhoto())
```

### 2D/3D Transforms

```typescript
import { scale, rotate, translate3d, matrix3d } from '@tachui/effects'

// Basic transforms
VStack()
  .apply(scale(1.1))
  .apply(rotate('45deg'))
  .apply(translate3d(10, 20, 0))

// Advanced 3D transforms
VStack().apply(matrix3d([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 50, 100, 0, 1]))
```

### Glassmorphism Effects

```typescript
import { glassmorphism, backdropFilter } from '@tachui/effects'

// Preset glassmorphism
VStack().apply(glassmorphism('medium'))

// Custom backdrop filter
VStack().apply(
  backdropFilter({
    blur: 10,
    saturate: 1.2,
    brightness: 1.1,
  })
)
```

### Interactive Effects

```typescript
import { hoverEffect, cursor, buttonHover } from '@tachui/effects'

// SwiftUI-style hover effects
Button('Click Me').apply(hoverEffect('lift')).apply(cursor('pointer'))

// Custom hover styles
VStack().apply(
  hover({
    transform: 'scale(1.05)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  })
)
```

## Migration from @tachui/core

If you were previously importing visual effects from `@tachui/core`, update your imports:

```typescript
// Before (deprecated)
import { blur, glassmorphism, scale, hoverEffect } from '@tachui/core'

// After
import { blur, glassmorphism, scale, hoverEffect } from '@tachui/effects'
```

## Bundle Impact

This package is designed to be tree-shakeable. Only import the effects you use:

```typescript
// Tree-shakeable imports
import { blur, scale } from '@tachui/effects' // ~5KB
import { glassmorphism } from '@tachui/effects/backdrop' // ~8KB
import { hoverEffect } from '@tachui/effects/effects' // ~6KB
```

## License

MPL-2.0
