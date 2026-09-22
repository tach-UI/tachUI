# CSS Modifier Examples

`.css()`, `.cssProperty()` and `.cssVariable()` are the escape hatch for CSS that has no dedicated TachUI modifier: newer properties, vendor-prefixed ones, and custom properties.

## What the CSS modifiers do

They set **inline styles** on the component's element. That determines what they can and can't express:

- **Property names** can be camelCase (`backdropFilter`) or kebab-case (`'backdrop-filter'`). Custom properties keep their `--` prefix.
- **Numbers** become pixels (`marginTop: 4` is `4px`), except on unitless properties such as `opacity`, `z-index`, `line-height` and `flex`.
- **Any value can be a signal or memo.** The property updates in place when it changes.
- **Only declarations, never rules.** An inline style can't hold at-rules (`@media`, `@supports`, `@container`), pseudo-classes (`:hover`, `:focus-visible`), pseudo-elements (`::before`) or nested selectors. Such keys are not applied. For those, see [Beyond inline styles](#beyond-inline-styles).

All examples assume the basic modifiers are loaded:

```typescript
import '@tachui/modifiers/preload/basic'
import { Text, VStack } from '@tachui/primitives'
import { createMemo, createSignal } from '@tachui/core'
```

## Basic usage

### Single properties

```typescript
const scrollingText = Text('Smooth scrolling')
  .cssProperty('scroll-behavior', 'smooth')
  .cssProperty('containerType', 'inline-size')
  .padding(16)
```

### Several properties at once

```typescript
const glassCard = VStack({ children: [] })
  .css({
    backdropFilter: 'blur(10px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.1)',
  })
```

## Modern layout properties

### Container setup

A component can declare itself a query container inline. The queries that respond to it are rules, so they belong in a stylesheet (see [Beyond inline styles](#beyond-inline-styles)).

```typescript
const cardContainer = VStack({ children: [] })
  .css({
    containerType: 'inline-size',
    containerName: 'card',
  })
```

### Grid

```typescript
const autoGrid = VStack({ children: [] })
  .css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 30vw, 300px), 1fr))',
    gap: 'clamp(1rem, 3vw, 2rem)',
    gridAutoFlow: 'dense',
  })

const wideItem = VStack({ children: [] })
  .css({
    gridColumn: 'span 2',
    aspectRatio: '16 / 9',
    placeSelf: 'center',
  })
```

### Scroll snapping

```typescript
const snapContainer = VStack({ children: [] })
  .css({
    scrollSnapType: 'y mandatory',
    scrollBehavior: 'smooth',
    scrollPadding: '2rem',
    overscrollBehavior: 'contain',
    scrollbarWidth: 'thin',
    scrollbarColor: '#007AFF #f0f0f0',
  })

const snapItem = VStack({ children: [] })
  .css({
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
    scrollMargin: '1rem',
  })
```

## Custom properties and theming

### Design tokens

`.cssVariable()` adds the `--` prefix if it is missing. Descendants read the variables with `var()`.

```typescript
const tokens = VStack({ children: [] })
  .cssVariable('color-primary', '#007AFF')
  .cssVariable('space-md', '16px')
  .cssVariable('radius-lg', '12px')

const tokenCard = VStack({ children: [] })
  .css({
    color: 'var(--color-primary)',
    padding: 'var(--space-md)',
    borderRadius: 'var(--radius-lg)',
  })
```

### Theme-aware values

Pass a memo, and the variable or property follows it.

```typescript
function ThemedPanel() {
  const [scheme, setScheme] = createSignal<'light' | 'dark'>('light')

  const background = createMemo(() =>
    scheme() === 'dark' ? '#1a1a1a' : '#ffffff'
  )
  const text = createMemo(() =>
    scheme() === 'dark' ? '#ffffff' : '#1a1a1a'
  )

  return VStack({ children: [] })
    .cssVariable('bg-primary', background)
    .cssVariable('text-primary', text)
    .css({
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    })
}
```

A layered background is a good fit for `.css()`, since gradients are not valid in `backgroundColor`:

```typescript
const [dark, setDark] = createSignal(false)

const layered = createMemo(() =>
  dark()
    ? 'linear-gradient(#1a1a1a, #2d2d2d), #000'
    : 'linear-gradient(#ffffff, #f0f0f0), #fff'
)

const hero = VStack({ children: [] }).css({ background: layered })
```

## Vendor prefixes

A camelCase name starting with a capital gets a leading dash, so `WebkitBackdropFilter` becomes `-webkit-backdrop-filter`. The kebab-case form works too.

```typescript
const frosted = VStack({ children: [] })
  .css({
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    '-webkit-mask-image': 'linear-gradient(black, transparent)',
    maskImage: 'linear-gradient(black, transparent)',
  })
```

## Rendering hints

```typescript
const offscreenSection = VStack({ children: [] })
  .css({
    contain: 'layout style paint',
    contentVisibility: 'auto',
    containIntrinsicSize: 'auto 500px',
  })

const animatedLayer = VStack({ children: [] })
  .css({
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
  })
```

## Beyond inline styles

Media queries, feature queries, container queries, pseudo-classes and pseudo-elements are rules, not declarations, so no inline style can hold them. Put them in a stylesheet and give the component a class with the `css` prop:

```typescript
const card = VStack({ children: [], css: 'card' })
```

```css
.card:focus-visible {
  outline: 2px solid #007aff;
  outline-offset: 2px;
}

@container card (min-width: 500px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

For breakpoint-driven values without a stylesheet, see `@tachui/responsive`.
