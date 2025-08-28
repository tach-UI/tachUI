---
cssclasses:
  - full-page
---

# TachUI Modifiers Reference

Complete list of all modifiers available in TachUI, organized by category with descriptions and usage examples.

[[toc]]

## 📐 Layout Modifiers

### Frame & Sizing

**`.frame(width?, height?)`** - Sets component dimensions with support for constraints and Infinity values
```typescript
.frame(200, 100)  // Fixed size
.frame({ width: 300, maxHeight: 500 })  // With constraints
.frame({ width: Infinity, height: 50 })  // Full width
```

**`.width(value)`** - Set element width
**`.height(value)`** - Set element height
**`.maxWidth(value)`** - Set maximum width constraint
**`.minWidth(value)`** - Set minimum width constraint
**`.maxHeight(value)`** - Set maximum height constraint
**`.minHeight(value)`** - Set minimum height constraint

**`.size(options)`** - Set multiple size properties at once
```typescript
.size({ width: 200, height: 100, maxWidth: 300 })
```

### Padding

**`.padding(value)`** - Apply padding with flexible syntax
```typescript
.padding(16)                    // All sides
.padding(16, 24)               // Vertical, horizontal
.padding(8, 16, 12, 20)        // Top, right, bottom, left
.padding({ horizontal: 20, vertical: 12 })
```

**Directional Padding**:
- `.paddingTop(value)` - Top padding only
- `.paddingBottom(value)` - Bottom padding only
- `.paddingLeft(value)` - Left padding only
- `.paddingRight(value)` - Right padding only
- `.paddingLeading(value)` - Leading padding (LTR-aware)
- `.paddingTrailing(value)` - Trailing padding (LTR-aware)
- `.paddingHorizontal(value)` - Left + right padding
- `.paddingVertical(value)` - Top + bottom padding

### Margin

**`.margin(value)`** - Apply margin spacing
```typescript
.margin(16)                    // All sides
.margin({ vertical: 12, horizontal: 8 })
```

**Directional Margin**:
- `.marginTop(value)` - Top margin only
- `.marginBottom(value)` - Bottom margin only
- `.marginHorizontal(value)` - Left + right margin
- `.marginVertical(value)` - Top + bottom margin

### Positioning & Transforms

**`.offset(x, y?)`** - SwiftUI-style position offset with reactive support
```typescript
.offset(10, -5)  // Static offset
.offset(() => isActive() ? 20 : 0, 0)  // Reactive
```

**`.absolutePosition(x, y)`** - Absolute positioning (different from offset)
```typescript
.absolutePosition(100, 50)  // Fixed position
```

**`.position(value)`** - CSS position property
```typescript
.position('relative')  // Options: static, relative, absolute, fixed, sticky
```

**`.scaleEffect(x, y?, anchor?)`** - Element scaling transforms
```typescript
.scaleEffect(1.2)  // Uniform scale
.scaleEffect(1.5, 0.8, 'topLeading')  // Non-uniform with anchor
```

**`.rotationEffect(angle, anchor?)`** - Element rotation with 9 anchor points
```typescript
.rotationEffect(45)  // 45 degrees, center anchor
.rotationEffect(30, 'topTrailing')  // With specific anchor
```

### Layout Properties

**`.layoutPriority(priority)`** - Set layout priority for ZStack sizing calculations
**`.aspectRatio(ratio?, contentMode?)`** - Maintain aspect ratio
```typescript
.aspectRatio(16/9, 'fit')  // 16:9 ratio, fit within bounds
.aspectRatio(1, 'fill')    // Square, fill bounds
```

**`.fixedSize(horizontal?, vertical?)`** - Prevent element shrinking in layout
```typescript
.fixedSize()              // Both axes
.fixedSize(true, false)   // Horizontal only
```

**`.zIndex(value)`** - Control z-order layering

### Flexbox

**`.flexGrow(value)`** - Flex grow factor
**`.flexShrink(value)`** - Flex shrink factor
**`.justifyContent(value)`** - Main axis alignment
```typescript
.justifyContent('center')  // Options: flex-start, flex-end, center, space-between, space-around, space-evenly
```

**`.alignItems(value)`** - Cross axis alignment
```typescript
.alignItems('center')  // Options: flex-start, flex-end, center, stretch, baseline
```

**`.gap(value)`** - Gap between flex items

## 🎨 Appearance Modifiers

### Colors

**`.foregroundColor(color)`** - Set text/foreground color
```typescript
.foregroundColor('#007AFF')        // Hex
.foregroundColor('rgb(0,122,255)') // RGB
.foregroundColor(Assets.primary)   // Asset reference
.foregroundColor(() => isDark() ? '#FFF' : '#000')  // Reactive
```

**`.backgroundColor(color)`** - Set background color with same flexibility as foregroundColor
**`.opacity(value)`** - Set element opacity (0-1)

### Typography

**`.font(options | size)`** - Configure font properties
```typescript
.font(18)  // Size shorthand
.font({
  family: 'Inter, sans-serif',
  size: 18,
  weight: '600',
  style: 'italic'
})
```

**Individual Typography Properties**:
- `.fontSize(size)` - Font size only
- `.fontWeight(weight)` - Font weight (100-900, 'normal', 'bold')
- `.fontFamily(family)` - Font family
- `.textAlign(value)` - Text alignment (left, center, right, justify)
- `.textTransform(value)` / `.textCase(value)` - Text transformation (uppercase, lowercase, capitalize)
- `.letterSpacing(value)` - Letter spacing
- `.lineHeight(value)` - Line height
- `.textOverflow(value)` - Text overflow handling
- `.whiteSpace(value)` - White space handling

**`.typography(options)`** - Set multiple typography properties at once

### Borders & Shapes

**`.border(options)` / `.border(width, color?, style?)`** - Comprehensive border styling with advanced features
```typescript
// Simple usage
.border(1)                          // 1px solid border
.border(2, '#007AFF')              // Colored border  
.border('2px', '#007AFF', 'dashed') // String width support

// Advanced object configuration
.border({
  top: { width: 2, color: '#007AFF', style: 'solid' },
  horizontal: { width: 1, color: '#ddd' },        // Left + right
  vertical: { width: 2, color: '#e0e0e0' },       // Top + bottom
  leading: { width: 3, color: '#34C759' },        // SwiftUI terminology (LTR-aware)
  image: 'linear-gradient(45deg, #007AFF, #FF3B30)', // Border images
  radius: { topLeft: 8, topRight: 8 }             // Integrated corner radius
})

// Reactive values with Signals
.border({
  width: () => isActive() ? 2 : 1,
  color: () => theme().borderColor,
  style: 'dashed'
})
```

**Border Direction Functions**:
- `.borderTop(width, color, style?)` - Top border only
- `.borderRight(width, color, style?)` - Right border only  
- `.borderBottom(width, color, style?)` - Bottom border only
- `.borderLeft(width, color, style?)` - Left border only
- `.borderLeading(width, color, style?)` - Leading border (SwiftUI, LTR-aware)
- `.borderTrailing(width, color, style?)` - Trailing border (SwiftUI, LTR-aware)
- `.borderHorizontal(width, color, style?)` - Left + right borders
- `.borderVertical(width, color, style?)` - Top + bottom borders

**`.cornerRadius(radius)`** - Apply rounded corners

### Visual Effects

**`.shadow(options)`** - Add drop shadow
```typescript
.shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
```

**Standard Filter Effects**:
- `.blur(radius)` - Gaussian blur filter
- `.brightness(amount)` - Brightness adjustment (0-2, 1 = normal)
- `.contrast(amount)` - Contrast adjustment (0-2, 1 = normal)
- `.saturation(amount)` - Saturation adjustment (0-2, 1 = normal)
- `.hueRotation(angle)` - Hue rotation in degrees (0-360)
- `.grayscale(amount)` - Grayscale conversion (0-1, 0 = color, 1 = grayscale)
- `.colorInvert(amount?)` - Color inversion (0-1, 0 = normal, 1 = inverted)

**Backdrop Filter Effects** 🌟 **NEW**:
- **`.backdropFilter(config, fallbackColor?)`** - Advanced backdrop filtering with browser fallbacks
- **`.glassmorphism(intensity?, customFallback?)`** - Glassmorphism presets with automatic fallbacks

```typescript
// Standard visual effects
.blur(5)              // 5px blur
.brightness(1.2)      // 20% brighter
.contrast(0.8)        // Reduced contrast
.saturation(1.5)      // More saturated
.hueRotation(180)     // Rotate hue 180 degrees
.grayscale(0.5)       // 50% grayscale
.colorInvert()        // Full invert (default 1.0)

// Backdrop filter effects  
.backdropFilter({ blur: 16, saturate: 1.3, brightness: 1.1 })
.backdropFilter(
  { blur: 12, saturate: 1.2 },
  'rgba(255, 255, 255, 0.85)' // Fallback for unsupported browsers
)
.backdropFilter('blur(20px) saturate(1.5) hue-rotate(90deg)')

// Glassmorphism presets
.glassmorphism('subtle')   // Light glass effect
.glassmorphism('light')    // Balanced glass effect
.glassmorphism('medium')   // Standard glass effect (default)
.glassmorphism('heavy')    // Strong glass effect

// With ColorAsset fallback
import { Colors } from './assets'
.glassmorphism('medium', Colors.glass.fallback)
```

### Clipping & Overlays

**`.clipped()`** - Clip content overflow (sets overflow: hidden)

**`.clipShape(shape, parameters?)`** - Clip to custom shapes
```typescript
.clipShape('circle')
.clipShape('ellipse', { radiusX: '50%', radiusY: '30%' })
.clipShape('rect', { inset: 10 })
.clipShape('polygon', { points: '50% 0%, 0% 100%, 100% 100%' })
```

**`.overlay(content, alignment?)`** - Layer content on top
```typescript
.overlay(
  Text("Caption").modifier.foregroundColor('white').build(),
  'bottomTrailing'
)
```

### Display & Overflow

**`.display(value)`** - CSS display property
**`.overflow(value)`** - General overflow control
**`.overflowX(value)`** - Horizontal overflow
**`.overflowY(value)`** - Vertical overflow

## 👆 Interaction Modifiers

### Mouse Events

**`.onTap(handler)`** - Click/tap event handler
**`.onHover(handler)`** - Hover state handler (enter/leave combined)
```typescript
.onHover((isHovered) => setHovered(isHovered))
```

**Individual Mouse Events**:
- `.onMouseEnter(handler)`
- `.onMouseLeave(handler)`
- `.onMouseDown(handler)`
- `.onMouseUp(handler)`
- `.onDoubleClick(handler)`
- `.onContextMenu(handler)` - Right click

### Advanced Gestures

**`.onLongPressGesture(options)`** - Long press with configurable constraints
```typescript
.onLongPressGesture({
  minimumDuration: 800,  // milliseconds
  maximumDistance: 15,   // pixels
  perform: () => console.log('Long press!'),
  onPressingChanged: (pressing) => setIsPressing(pressing)
})
```

**`.onContinuousHover(coordinateSpace, perform)`** - Real-time mouse tracking
```typescript
.onContinuousHover('local', (location) => {
  if (location) console.log(`Mouse at: ${location.x}, ${location.y}`)
})
```

**`.allowsHitTesting(enabled)`** - Control pointer-events
**`.highPriorityGesture(gesture, including?)`** - Gesture priority (placeholder)
**`.simultaneousGesture(gesture, including?)`** - Simultaneous gestures (placeholder)

### Drag & Drop

**`.draggable(isDraggable)`** - Enable dragging
**`.onDragStart(handler)`** - Drag start event
**`.onDragOver(handler)`** - Drag over event
**`.onDragLeave(handler)`** - Drag leave event
**`.onDrop(handler)`** - Drop event

### Keyboard Events

**`.onKeyPress(handler)`** - Key press event
**`.onKeyDown(handler)`** - Key down event
**`.onKeyUp(handler)`** - Key up event

**`.keyboardShortcut(key, modifiers, action)`** - Global keyboard shortcuts
```typescript
.keyboardShortcut('s', ['cmd', 'shift'], () => save())
.keyboardShortcut('Escape', [], () => cancel())
```

### Focus Management

**`.onFocus(handler)`** - Focus event handler
**`.onBlur(handler)`** - Blur event handler

**`.focused(binding)`** - Programmatic focus control with reactive binding
```typescript
.focused(() => focusTarget() === 'myButton')
```

**`.focusable(enabled, interactions?)`** - Configure focus behavior
```typescript
.focusable(true, ['activate', 'edit'])
```

### Form Events

**`.onInput(handler)`** - Input event
**`.onChange(handler)`** - Change event with value
**`.onSelect(handler)`** - Text selection event

### Clipboard Events

**`.onCopy(handler)`** - Copy event
**`.onCut(handler)`** - Cut event
**`.onPaste(handler)`** - Paste event

### Other Events

**`.onScroll(handler)`** - Scroll event
**`.onWheel(handler)`** - Mouse wheel event

### State & Accessibility

**`.disabled(isDisabled?)`** - Set disabled state
```typescript
.disabled(true)               // Always disabled
.disabled(() => !isValid())   // Reactive
```

**`.accessibilityLabel(label)`** - Screen reader label

## 🎬 Animation Modifiers

### Transitions

**`.transition(options)`** - CSS transition configuration
```typescript
.transition({ property: 'all', duration: 300, easing: 'ease-out' })
```

**`.transform(value)`** - CSS transform property
```typescript
.transform('scale(1.1) rotate(5deg)')
.transform(() => isActive() ? 'translateX(20px)' : 'none')
```

### Animations

**`.animation(options)`** - CSS animation configuration
```typescript
.animation({
  name: 'fadeIn',
  duration: 1000,
  iterationCount: 1,
  fillMode: 'forwards'
})
```

## 🔄 Lifecycle Modifiers

**`.onAppear(handler)`** - Execute when component appears in viewport
**`.onDisappear(handler)`** - Execute when component leaves viewport

**`.task(operation, options?)`** - Async task with auto-cancellation
```typescript
.task(async () => {
  const data = await fetchData()
  setData(data)
})
```

**`.refreshable(onRefresh, isRefreshing?)`** - Pull-to-refresh functionality
```typescript
.refreshable(
  async () => await refreshData(),
  isRefreshing
)
```

## 🧭 Navigation Modifiers (@tachui/navigation)

**`.navigationTitle(title)`** - Set navigation bar title
**`.navigationBarTitleDisplayMode(mode)`** - Title display mode ('large', 'inline')
**`.navigationBarHidden(hidden?)`** - Show/hide navigation bar
**`.navigationBarItems(options)`** - Navigation bar buttons
**`.navigationBarBackButtonHidden(hidden?)`** - Hide back button
**`.navigationBarBackButtonTitle(title)`** - Custom back button title
**`.toolbarBackground(background)`** - Toolbar background color
**`.toolbarForegroundColor(color)`** - Toolbar text color

## 🛠️ Utility Modifiers

**`.cursor(value)`** - Mouse cursor style
```typescript
.cursor('pointer')  // Options: auto, default, pointer, text, wait, help, not-allowed, grab, grabbing
```

**`.setAttribute(name, value)`** - Set arbitrary HTML attribute
**`.css(properties)`** - Apply raw CSS properties
```typescript
.css({
  backdropFilter: 'blur(10px)',
  clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)'
})
```

**`.cssProperty(property, value)`** - Set individual CSS property
**`.cssVariable(name, value)`** - Set CSS custom property

## 🎯 Special Modifiers

**`.resizable()`** - Make images resizable (Image component only)
**`.modifier(modifier)`** - Apply a custom modifier instance

## 📊 Modifier Statistics

### Total Count
- **Core Framework**: ~130 modifiers
- **Navigation Plugin**: 8 modifiers
- **Total Available**: 138+ modifiers

### SwiftUI Parity
- **Implemented**: 61 modifiers
- **Common SwiftUI**: 64 modifiers
- **Coverage**: 95%
- **Missing**: 3 modifiers (advanced gestures, environment modifiers)

### Categories
- **Layout**: 35 modifiers
- **Appearance**: 40 modifiers
- **Interaction**: 35 modifiers
- **Animation**: 4 modifiers
- **Lifecycle**: 4 modifiers
- **Navigation**: 8 modifiers
- **Utility**: 8 modifiers
- **Special**: 2 modifiers

### Implementation Status
- **✅ Implemented**: ~130 modifiers (95% of SwiftUI)
- **✅ Complete**: All visual effects and core transforms
- **🔄 In Progress**: Advanced gesture system (8+ modifiers)
- **🚀 Future**: Additional specialized modifiers

### Recent Additions
- ✅ `.offset(x, y)` - SwiftUI-style position offset
- ✅ `.rotationEffect(angle, anchor)` - Element rotation with anchors
- ✅ `.scaleEffect(x, y?, anchor)` - Element scaling transforms
- ✅ `.aspectRatio(ratio, contentMode)` - Responsive aspect ratios
- ✅ `.fixedSize(horizontal?, vertical?)` - Prevent element shrinking
- ✅ `.clipShape(shape, parameters)` - Custom shape clipping
- ✅ `.overlay(content, alignment)` - Content layering system
- ✅ All visual effects - blur, brightness, contrast, saturation, hueRotation, grayscale, colorInvert

## 🚀 Usage Examples

### Common Patterns

**Styled Button**:
```typescript
Button('Click Me', handleClick)
  .modifier
  .padding(16)
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .cornerRadius(8)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
  .onHover((hovered) => setIsHovered(hovered))
  .build()
```

**Responsive Card**:
```typescript
VStack({ children })
  .modifier
  .frame({ maxWidth: 600 })
  .padding(() => isMobile() ? 16 : 24)
  .backgroundColor('#FFFFFF')
  .cornerRadius(12)
  .shadow({ x: 0, y: 4, radius: 8, color: 'rgba(0,0,0,0.1)' })
  .build()
```

**Advanced Interactions**:
```typescript
Text('Interactive Element')
  .modifier
  .onLongPressGesture({
    minimumDuration: 500,
    perform: () => showContextMenu()
  })
  .keyboardShortcut('Enter', [], () => activate())
  .focused(isFocused)
  .allowsHitTesting(isEnabled)
  .build()
```

**Visual Effects & Transforms**:
```typescript
Image('/hero-image.jpg')
  .modifier
  .scaleEffect(() => isHovered() ? 1.05 : 1.0)
  .rotationEffect(() => isActive() ? 5 : 0, 'center')
  .blur(() => isLoading() ? 3 : 0)
  .brightness(() => isDarkMode() ? 0.8 : 1.0)
  .saturation(() => isDisabled() ? 0.3 : 1.0)
  .transition({ property: 'all', duration: 300, easing: 'ease-out' })
  .build()

// Glassmorphism effect
VStack({ children })
  .modifier
  .backgroundColor('rgba(255, 255, 255, 0.1)')
  .blur(10)
  .border(1, 'rgba(255, 255, 255, 0.2)')
  .cornerRadius(16)
  .build()
```

## 💡 Best Practices

### Performance
- Use reactive values (Signals) for dynamic properties
- Batch related modifiers together
- Avoid creating new objects in reactive callbacks

### Type Safety
- TypeScript validates all modifier parameters
- Use proper types for colors, sizes, and enums
- Leverage IDE autocomplete for discovery

### Readability
- Group related modifiers (typography, colors, layout)
- Use meaningful variable names for reactive values
- Comment complex modifier chains

### Reusability
- Create modifier presets for common patterns
- Use the Asset system for consistent theming
- Build custom modifiers for app-specific needs

## 🔗 Related Documentation

- [Modifiers API Reference](/api/modifiers.md)
- [Advanced Modifier System Documentation](/advanced-modifiers.md)
- [Component Examples](/components/)
- [Getting Started Guide](/guide/getting-started.md)

Last updated: 2025-08-15
