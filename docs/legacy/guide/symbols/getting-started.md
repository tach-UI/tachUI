# Getting Started with TachUI Symbols

A step-by-step guide to adding icons to your TachUI application.

## Installation

Add the symbols package to your project:

```bash
npm install @tachui/symbols @tachui/core
```

## Your First Symbol

Create a simple heart icon:

```typescript
import { Symbol } from '@tachui/symbols'

const heartIcon = Symbol('heart')
```

## Adding Style

Apply TachUI modifiers to customize appearance:

```typescript
const styledIcon = Symbol('heart')
  .modifier
  .foregroundColor('#ff0000')
  .frame(32, 32)
  .padding(8)
  .build()
```

## Making it Interactive

Add user interaction with modifiers:

```typescript
import { createSignal } from '@tachui/core'

const [isFavorited, setIsFavorited] = createSignal(false)

const interactiveHeart = Symbol('heart', {
  variant: () => isFavorited() ? 'filled' : 'none'
})
.modifier
.foregroundColor(() => isFavorited() ? '#ff0000' : '#999')
.onTap(() => setIsFavorited(!isFavorited()))
.build()
```

## Animation Effects

Add visual feedback with built-in animations:

```typescript
const animatedStar = Symbol('star', {
  effect: 'bounce'
})
.modifier
.foregroundColor('#FFD700')
.scaleLarge()
.build()
```

## Building a Component

Combine symbols with other TachUI components:

```typescript
import { VStack, Text } from '@tachui/core'

const favoriteButton = VStack([
  Symbol('heart', { 
    variant: () => isFavorited() ? 'filled' : 'none',
    effect: 'pulse'
  })
  .modifier
  .foregroundColor(() => isFavorited() ? '#ff0000' : '#666')
  .scaleLarge()
  .build(),
  
  Text(() => isFavorited() ? 'Favorited' : 'Favorite')
    .modifier
    .fontSize(12)
    .foregroundColor('#666')
    .build()
])
.modifier
.padding(16)
.onTap(() => setIsFavorited(!isFavorited()))
.build()
```

## Accessibility

Make your icons accessible to all users:

```typescript
const accessibleIcon = Symbol('heart', {
  accessibilityLabel: 'Add to favorites',
  accessibilityDescription: 'Click to add this item to your favorites list'
})
.modifier
.foregroundColor('#ff0000')
.build()
```

## Performance Tips

### Preload Critical Icons

For icons that appear immediately when your app loads:

```typescript
import { IconLoader } from '@tachui/symbols'

// Preload critical icons
await IconLoader.preloadCriticalIcons()

// Or preload specific icons
await IconLoader.preloadIcons(['heart', 'star', 'user'])
```

### Use Fallbacks

Provide fallback icons for better reliability:

```typescript
const iconWithFallback = Symbol('custom-icon', {
  fallback: 'heart'
})
```

## Common Patterns

### Toggle States

```typescript
const [isPlaying, setIsPlaying] = createSignal(false)

const playButton = Symbol(() => isPlaying() ? 'pause' : 'play')
  .modifier
  .onTap(() => setIsPlaying(!isPlaying()))
  .build()
```

### Loading Indicators

```typescript
const [isLoading, setIsLoading] = createSignal(false)

const refreshButton = Symbol(() => isLoading() ? 'loader' : 'refresh-cw', {
  effect: () => isLoading() ? 'rotate' : 'none'
})
.modifier
.onTap(async () => {
  setIsLoading(true)
  await performAction()
  setIsLoading(false)
})
.build()
```

### Navigation Icons

```typescript
const navbar = HStack([
  Symbol('home')
    .modifier
    .onTap(() => navigate('/'))
    .build(),
    
  Symbol('search')
    .modifier
    .onTap(() => navigate('/search'))
    .build(),
    
  Symbol('user')
    .modifier
    .onTap(() => navigate('/profile'))
    .build()
])
.modifier
.justifyContent('space-around')
.build()
```

## Next Steps

- Explore the [complete API reference](./api-reference.md)
- Learn about [Phase 2 advanced features](./phase-2-features.md)
- Check out the [Symbol index guide](./index.md) for more examples
- Read the [Phase 2 completion summary](./phase-2-completion-summary.md) for performance details