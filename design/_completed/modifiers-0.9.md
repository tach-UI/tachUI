# tachUI Modifiers v0.9.0 - Complete Reference

This document provides a comprehensive reference of all modifiers available in tachUI v0.9.0, organized by category and package.

## Modifier Statistics
- **Total Modifiers:** 200+ individual modifiers
- **Categories:** 8 major categories
- **Architecture:** Auto-registration, chainable design

## Import Structure
Modifiers are automatically registered with components, but can be imported from specific package paths:

```typescript
// Core modifiers (automatically available)
import { padding, backgroundColor, fontSize } from '@tachui/core'
import { alignment, frame } from '@tachui/core/modifiers'

// Comprehensive styling modifiers
import { margin, border, clipShape } from '@tachui/modifiers'
import { aspectRatio, flexGrow } from '@tachui/modifiers/layout'
import { onHover, onKeyDown } from '@tachui/modifiers/interaction'
import { typography, textAlign } from '@tachui/modifiers/typography'
import { backgroundColor, clipShape } from '@tachui/modifiers/appearance'
import { css, transition } from '@tachui/modifiers/utility'

// Specialized modifier packages
import { blur, shadow, scale } from '@tachui/effects'
import { gridColumnSpan, gridArea } from '@tachui/grid'
import { navigationTitle, toolbarBackground } from '@tachui/navigation'
import { responsiveWidth, containerQuery } from '@tachui/responsive'

// Form-specific modifiers
import { placeholder, validation } from '@tachui/forms/modifiers'
import { refreshable, onLongPress } from '@tachui/mobile'
import { onAppear, onDisappear } from '@tachui/viewport'
import { symbolConfiguration, symbolScale } from '@tachui/symbols'
```

---

## Core Infrastructure Modifiers

### @tachui/core
**Package:** `@tachui/core` | **Modifiers:** 13 core modifiers

| Modifier | Category | Description | Usage | Package |
|----------|----------|-------------|-------|---------|
| padding | Layout | Internal spacing (directional variants) | `.padding(20).padding(.top, 10)` | @tachui/core/modifiers |
| margin | Layout | External spacing (directional variants) | `.margin(15).margin(.horizontal, 20)` | @tachui/core/modifiers |
| frame | Layout | Component dimensions and alignment | `.frame(width: 200, height: 100)` | @tachui/core/modifiers |
| alignment | Layout | Content alignment within component | `.alignment(.center).alignment(.leading)` | @tachui/core/modifiers |
| layoutPriority | Layout | Layout priority for flexible containers | `.layoutPriority(1)` | @tachui/core/modifiers |
| foregroundColor | Styling | Text and content color | `.foregroundColor(.blue).foregroundColor("#FF0000")` | @tachui/core/modifiers |
| backgroundColor | Styling | Background color with gradients | `.backgroundColor(.red).backgroundColor(.linearGradient)` | @tachui/core/modifiers |
| background | Styling | Advanced background styling | `.background(.ultraThinMaterial)` | @tachui/core/modifiers |
| fontSize | Typography | Font size with responsive scaling | `.fontSize(16).fontSize(.title)` | @tachui/core/modifiers |
| fontWeight | Typography | Font weight (thin to black) | `.fontWeight(.bold).fontWeight(300)` | @tachui/core/modifiers |
| fontFamily | Typography | Custom font family | `.fontFamily("Inter").fontFamily(.system)` | @tachui/core/modifiers |
| opacity | Styling | Element transparency | `.opacity(0.5).opacity(.disabled)` | @tachui/core/modifiers |
| cornerRadius | Styling | Border corner radius | `.cornerRadius(8).cornerRadius(.large)` | @tachui/core/modifiers |
| border | Styling | Border styling (width, style, color) | `.border(2, .solid, .blue)` | @tachui/core/modifiers |

---

## Comprehensive Styling Modifiers

### @tachui/modifiers
**Package:** `@tachui/modifiers` | **Modifiers:** 100+ styling modifiers

#### Basic Layout Modifiers
| Modifier | Category | Description | Variants | Package |
|----------|----------|-------------|----------|---------|
| padding | Layout | Internal spacing | `.padding()`, `.padding(.top)`, `.padding(.all, 10)` | @tachui/modifiers/basic |
| margin | Layout | External spacing | `.margin()`, `.margin(.horizontal)`, `.margin(.vertical, 20)` | @tachui/modifiers/basic |
| size | Layout | Component dimensions | `.size(width: 100, height: 50)` | @tachui/modifiers/basic |
| width | Layout | Component width | `.width(200).width(.available)`, `.width(.flexible)` | @tachui/modifiers/basic |
| height | Layout | Component height | `.height(100).height(.intrinsic)`, `.height(.flexible)` | @tachui/modifiers/basic |
| maxWidth | Layout | Maximum width constraint | `.maxWidth(300).maxWidth(.container)` | @tachui/modifiers/basic |
| maxHeight | Layout | Maximum height constraint | `.maxHeight(500).maxHeight(.screen)` | @tachui/modifiers/basic |
| minWidth | Layout | Minimum width constraint | `.minWidth(100).minWidth(.content)` | @tachui/modifiers/basic |
| minHeight | Layout | Minimum height constraint | `.minHeight(50).minHeight(.content)` | @tachui/modifiers/basic |

#### Advanced Layout Modifiers
| Modifier | Category | Description | SwiftUI Equivalent |
|----------|----------|-------------|-------------------|
| aspectRatio | Layout | Maintain aspect ratio | `.aspectRatio(contentMode: .fit)` |
| fixedSize | Layout | Fixed size regardless of parent | `.fixedSize(horizontal: true, vertical: false)` |
| offset | Layout | Offset positioning | `.offset(x: 10, y: 20)` |
| overlay | Layout | Overlay another component | `.overlay(Text("Overlay"))` |
| flexGrow | Layout | Flex grow factor | `.flexGrow(1)` |
| flexShrink | Layout | Flex shrink factor | `.flexShrink(1)` |
| alignItems | Layout | Flexbox align items | `.alignItems(.center)` |
| justifyContent | Layout | Flexbox justify content | `.justifyContent(.spaceBetween)` |
| gap | Layout | Grid/flex gaps | `.gap(10).gap(.row, 15).gap(.column, 20)` |

#### Appearance Modifiers
| Modifier | Category | Description | CSS Equivalent |
|----------|----------|-------------|----------------|
| backgroundColor | Appearance | Background color | `background-color` |
| border | Appearance | Border styling | `border: width style color` |
| clipShape | Appearance | Shape clipping | `clip-path` |
| clipped | Appearance | Content clipping | `overflow: hidden` |
| foregroundColor | Appearance | Text/foreground color | `color` |
| gradientText | Appearance | Text gradient | `background-clip: text` |

#### Typography Modifiers
| Modifier | Category | Description | CSS Equivalent |
|----------|----------|-------------|----------------|
| typography | Typography | Comprehensive typography | Font shorthand |
| textAlign | Typography | Text alignment | `text-align` |
| font | Typography | Font family and weight | `font-family`, `font-weight` |
| lineClamp | Typography | Limit text lines | `display: -webkit-box` |
| wordBreak | Typography | Word breaking behavior | `word-break` |
| letterSpacing | Typography | Character spacing | `letter-spacing` |
| textDecoration | Typography | Text decoration | `text-decoration` |
| textTransform | Typography | Text transformation | `text-transform` |
| whiteSpace | Typography | Whitespace handling | `white-space` |

#### Interaction Modifiers
| Modifier | Category | Description | Event Handling | Package |
|----------|----------|-------------|----------------|---------|
| allowsHitTesting | Interaction | Enable/disable hit testing | Pointer events | @tachui/modifiers/interaction |
| focusable | Interaction | Make focusable | Keyboard navigation | @tachui/modifiers/interaction |
| activatable | Interaction | Enable activation | Click/tap events | @tachui/modifiers/interaction |
| focused | Interaction | Focus state management | Focus/blur events | @tachui/modifiers/interaction |
| onHover | Interaction | Hover state handling | `mouseenter`/`mouseleave` | @tachui/modifiers/interaction |
| onMouseEnter | Interaction | Mouse enter event | `mouseenter` | @tachui/modifiers/interaction |
| onMouseLeave | Interaction | Mouse leave event | `mouseleave` | @tachui/modifiers/interaction |
| onKeyDown | Interaction | Keyboard down event | `keydown` | @tachui/modifiers/interaction |
| onKeyUp | Interaction | Keyboard up event | `keyup` | @tachui/modifiers/interaction |
| onFocus | Interaction | Focus event | `focus` | @tachui/modifiers/interaction |
| onBlur | Interaction | Blur event | `blur` | @tachui/modifiers/interaction |
| scroll | Interaction | Scroll behavior | `scroll` events | @tachui/modifiers/interaction |
| overscrollBehavior | Interaction | Overscroll handling | `overscroll-behavior` | @tachui/modifiers/interaction |

#### Utility Modifiers
| Modifier | Category | Description | Purpose |
|----------|----------|-------------|---------|
| css | Utility | Apply custom CSS | Custom styling |
| cssProperty | Utility | Set CSS property | Property assignment |
| cssVariable | Utility | CSS custom property | CSS variable |
| cursor | Utility | Cursor style | `cursor` |
| display | Utility | Display property | `display` |
| outline | Utility | Outline styling | `outline` |
| transition | Utility | Transition effects | `transition` |

#### Attribute Modifiers
| Modifier | Category | Description | HTML Attribute |
|----------|----------|-------------|----------------|
| aria | Attributes | ARIA accessibility | `aria-*` attributes |
| customProperties | Attributes | Custom HTML properties | `data-*` attributes |
| id | Attributes | Element ID | `id` attribute |
| data | Attributes | Data attributes | `data-*` attributes |
| tabIndex | Attributes | Tab navigation order | `tabindex` |

#### Element Modifiers
| Modifier | Category | Description | Pseudo-elements |
|----------|----------|-------------|-----------------|
| before | Elements | Before pseudo-element | `::before` |
| after | Elements | After pseudo-element | `::after` |
| pseudoElements | Elements | Custom pseudo-elements | Custom `::before/::after` |
| iconBefore | Elements | Icon before text | Content addition |
| iconAfter | Elements | Icon after text | Content addition |
| underline | Elements | Underline decoration | Text decoration |
| badge | Elements | Badge/notification indicator | Content overlay |
| tooltip | Elements | Tooltip display | Hover content |

---

## Visual Effects Modifiers

### @tachui/effects
**Package:** `@tachui/effects` | **Modifiers:** 75+ effect modifiers

#### Shadow Modifiers
| Modifier | Category | Description | Visual Effect |
|----------|----------|-------------|---------------|
| textShadow | Shadow | Text shadow effects | Text elevation |
| shadow | Shadow | Box shadow | Element elevation |
| shadows | Shadow | Multiple shadows | Complex elevation |
| insetShadow | Shadow | Inset shadow effect | Indented appearance |
| shadowPreset | Shadow | Predefined shadow sets | Material Design shadows |
| glowEffect | Shadow | Glow around element | Neon/glow effect |
| neonEffect | Shadow | Neon glow effect | Cyber/gaming aesthetic |
| neumorphism | Shadow | Neumorphic shadows | Soft UI effect |

#### Filter Modifiers
| Modifier | Category | Description | CSS Filter |
|----------|----------|-------------|------------|
| blur | Filter | Blur effect | `blur()` |
| brightness | Filter | Brightness adjustment | `brightness()` |
| contrast | Filter | Contrast adjustment | `contrast()` |
| saturate | Filter | Color saturation | `saturate()` |
| grayscale | Filter | Convert to grayscale | `grayscale()` |
| sepia | Filter | Sepia tone effect | `sepia()` |
| hueRotate | Filter | Hue rotation | `hue-rotate()` |
| invert | Filter | Color inversion | `invert()` |
| vintagePhoto | Filter | Vintage photo effect | Preset combination |
| blackAndWhite | Filter | B&W with contrast | B&W processing |
| vibrant | Filter | Color vibrance boost | Saturation boost |

#### Transform Modifiers
| Modifier | Category | Description | CSS Transform |
|----------|----------|-------------|---------------|
| scale | Transform | Uniform scaling | `scale()` |
| rotate | Transform | 2D rotation | `rotate()` |
| translate | Transform | 2D translation | `translate()` |
| skew | Transform | 2D skew | `skew()` |
| rotateX | Transform | 3D rotation X-axis | `rotateX()` |
| rotateY | Transform | 3D rotation Y-axis | `rotateY()` |
| rotateZ | Transform | 3D rotation Z-axis | `rotateZ()` |
| scale3d | Transform | 3D scaling | `scale3d()` |
| translate3d | Transform | 3D translation | `translate3d()` |
| perspective | Transform | 3D perspective | `perspective()` |
| transformStyle | Transform | 3D transform style | `transform-style` |
| backfaceVisibility | Transform | Backface visibility | `backface-visibility` |

#### Interactive Effects
| Modifier | Category | Description | User Interaction |
|----------|----------|-------------|------------------|
| hover | Interactive | Hover state effects | Mouse hover |
| cursor | Interactive | Cursor style changes | Pointer interaction |
| hoverEffect | Interactive | Custom hover effects | Animated hover |
| buttonHover | Interactive | Button-specific hover | Button interactions |
| cardHover | Interactive | Card lift effect | Card interactions |
| linkHover | Interactive | Link hover styling | Link interactions |

#### Backdrop Effects
| Modifier | Category | Description | Visual Effect |
|----------|----------|-------------|---------------|
| backdropFilter | Backdrop | Backdrop blur effect | `backdrop-filter` |
| glassmorphism | Backdrop | Glass morphism effect | Frosted glass |

---

## Grid Layout Modifiers

### @tachui/grid
**Package:** `@tachui/grid` | **Modifiers:** 8 grid modifiers

| Modifier | Category | Description | CSS Grid |
|----------|----------|-------------|----------|
| gridColumnSpan | Grid | Column span for grid items | `grid-column: span` |
| gridRowSpan | Grid | Row span for grid items | `grid-row: span` |
| gridArea | Grid | Named grid area assignment | `grid-area` |
| gridCellAlignment | Grid | Individual cell alignment | `align-self`, `justify-self` |
| gridItemConfig | Grid | Complete grid item configuration | Grid item properties |
| gridCellColumns | Grid | SwiftUI compatibility - columns | Column span wrapper |
| gridCellRows | Grid | SwiftUI compatibility - rows | Row span wrapper |
| gridCellAnchor | Grid | SwiftUI compatibility - alignment | Cell alignment wrapper |

---

## Navigation Modifiers

### @tachui/navigation
**Package:** `@tachui/navigation` | **Modifiers:** 10 navigation modifiers

| Modifier | Category | Description | Platform | Package |
|----------|----------|-------------|----------|---------|
| navigationTitle | Navigation | Navigation bar title | iOS | @tachui/navigation |
| navigationBarTitleDisplayMode | Navigation | Title display mode | iOS | @tachui/navigation |
| navigationBarHidden | Navigation | Hide/show navigation bar | iOS | @tachui/navigation |
| navigationBarBackButtonHidden | Navigation | Back button control | iOS | @tachui/navigation |
| navigationBarItems | Navigation | Custom navigation items | iOS | @tachui/navigation |
| toolbarBackground | Navigation | Toolbar background styling | iOS | @tachui/navigation |
| toolbarForegroundColor | Navigation | Toolbar text color | iOS | @tachui/navigation |

---

## Mobile-Specific Modifiers

### @tachui/mobile
**Package:** `@tachui/mobile` | **Modifiers:** 3 mobile modifiers

| Modifier | Category | Description | Mobile Pattern | Package |
|----------|----------|-------------|----------------|---------|
| refreshable | Mobile | Pull-to-refresh functionality | iOS scroll refresh | @tachui/mobile |
| onLongPress | Mobile | Long press gesture | iOS touch interaction | @tachui/mobile |
| onTapGesture | Mobile | Tap gesture | iOS touch interaction | @tachui/mobile |

---

## Viewport Modifiers

### @tachui/viewport
**Package:** `@tachui/viewport` | **Modifiers:** 2 viewport modifiers

| Modifier | Category | Description | Lifecycle | Package |
|----------|----------|-------------|-----------|---------|
| onAppear | Viewport | Viewport/window enter detection | Lifecycle hook | @tachui/viewport |
| onDisappear | Viewport | Viewport/window exit detection | Lifecycle hook | @tachui/viewport |

---

## Responsive Modifiers

### @tachui/responsive
**Package:** `@tachui/responsive` | **Modifiers:** 20+ responsive modifiers

| Modifier | Category | Description | Breakpoint |
|----------|----------|-------------|------------|
| responsiveWidth | Responsive | Width based on breakpoints | Container queries |
| responsiveHeight | Responsive | Height based on breakpoints | Container queries |
| responsivePadding | Responsive | Padding based on screen size | Mobile-first |
| responsiveMargin | Responsive | Margin based on screen size | Mobile-first |
| responsiveFontSize | Responsive | Font size scaling | Typography |
| responsiveVisibility | Responsive | Show/hide based on breakpoints | Responsive design |
| responsiveStack | Responsive | Stack direction based on size | Mobile/desktop |
| containerQuery | Responsive | Container query utilities | CSS Container Queries |
| adaptiveText | Responsive | Adaptive text sizing | Reading comfort |
| touchTarget | Responsive | Minimum touch target size | Accessibility |

---

## Form Modifiers

### @tachui/forms
**Package:** `@tachui/forms` | **Modifiers:** 3 form modifiers

| Modifier | Category | Description | Validation | Package |
|----------|----------|-------------|------------|---------|
| placeholder | Forms | Input placeholder text | UI guidance | @tachui/forms/modifiers |
| required | Forms | Required field validation | Form validation | @tachui/forms/modifiers |
| validation | Forms | Custom validation rules | Form validation | @tachui/forms/modifiers |

---

## Symbol Modifiers

### @tachui/symbols
**Package:** `@tachui/symbols` | **Modifiers:** 5 symbol modifiers

| Modifier | Category | Description | Icon System | Package |
|----------|----------|-------------|-------------|---------|
| symbolConfiguration | Symbols | Icon configuration | SF Symbols | @tachui/symbols |
| symbolRenderingMode | Symbols | Icon rendering mode | Symbol rendering | @tachui/symbols |
| symbolScale | Symbols | Icon scaling | Size adjustment | @tachui/symbols |
| symbolVariant | Symbols | Icon variant | Weight/variant | @tachui/symbols |
| symbolEffect | Symbols | Icon animation effects | SF Symbol animations | @tachui/symbols |

---

## Modifier Categories Summary

| Category | Modifier Count | Primary Package | Purpose |
|----------|----------------|-----------------|---------|
| **Layout** | 35+ | modifiers, core | Spacing, sizing, positioning |
| **Appearance** | 45+ | modifiers, effects | Visual styling, colors, effects |
| **Typography** | 25+ | modifiers | Text formatting, fonts, spacing |
| **Interaction** | 40+ | modifiers, mobile | Events, focus, hover, gestures |
| **Grid** | 8 | grid | CSS Grid layout control |
| **Navigation** | 10 | navigation | Navigation bar customization |
| **Responsive** | 20+ | responsive | Adaptive design, breakpoints |
| **Utility** | 30+ | modifiers | CSS integration, attributes |

---

## Modifier Usage Patterns

### Chaining Modifiers
```typescript
Component()
  .padding(20)
  .backgroundColor(.blue)
  .cornerRadius(8)
  .onHover { hover in
    hover ? .scale(1.05) : .scale(1.0)
  }
```

### Conditional Modifiers
```typescript
Component()
  .padding(isMobile ? 10 : 20)
  .visible(!isLoading)
  .disabled(isProcessing)
```

### Responsive Modifiers
```typescript
Component()
  .responsiveWidth()
  .responsivePadding()
  .containerQuery { container in
    container.width < 400 ? .columnStack : .rowStack
  }
```

### Effects Chain
```typescript
Image()
  .blur(5)
  .brightness(1.2)
  .contrast(1.1)
  .saturation(1.3)
```

---

## Development Notes

### Modifier Architecture
- **Chainable Design**: All modifiers return the component for chaining
- **Auto-Registration**: Modifiers automatically register with component system
- **Type Safety**: Full TypeScript support with generated types
- **Performance**: Optimized for minimal re-renders
- **Plugin System**: Modifiers can be provided by any package

### Best Practices
1. **Chain Modifiers**: Build complex styling through modifier chains
2. **Group Related**: Keep related modifiers together for readability
3. **Use Presets**: Leverage preset values for consistency
4. **Conditional Logic**: Use ternary operators for conditional modifiers
5. **Performance**: Consider modifier performance impact in large lists

### Import Guidelines
1. **Core modifiers are globally available**: Basic modifiers from `@tachui/core` work everywhere
2. **Import specialized modifiers as needed**: Use specific package imports for advanced features
3. **Auto-registration**: Most modifiers register automatically when packages are imported
4. **Tree-shaking friendly**: Import from specific subdirectories to reduce bundle size
5. **Modifier groups**: Related modifiers are co-located in package subdirectories
6. **TypeScript support**: All modifiers have full TypeScript support and generated types

### Advanced Patterns
- **Custom Modifiers**: Create application-specific modifiers
- **Modifier Combinations**: Combine multiple modifiers for complex effects
- **Responsive Design**: Use responsive modifiers for adaptive UIs
- **Animation**: Chain transition modifiers for smooth animations
- **Accessibility**: Apply ARIA and interaction modifiers for accessibility
