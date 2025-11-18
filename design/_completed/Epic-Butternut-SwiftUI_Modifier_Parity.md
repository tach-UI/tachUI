---
cssclasses:
  - full-page
---

# Epic: Butternut - SwiftUI Modifier Parity

**Status:** Design Phase  
**Priority:** High  
**Estimated Duration:** 3-4 weeks  
**Target Release:** 1.3  

---

## Overview

Complete tachUI's SwiftUI modifier parity by implementing the remaining visual effects, transforms, and critically missing input/event modifiers. This epic addresses a significant discovery: many expected web-native events are missing from tachUI's modifier system, creating gaps in developer experience.

**Critical Finding**: tachUI has good SwiftUI visual modifier coverage but is missing fundamental web event handling that developers expect to work everywhere.

### Goals

- **Fix Critical Event Gaps**: Implement missing web-native event modifiers that should be universal
- **Complete Visual Effects**: Add all missing CSS filter-based modifiers  
- **Transform Completion**: Add remaining transform modifiers
- **Enhanced Input/Event Handling**: Expand gesture and input modifier support
- **Developer Experience**: Ensure consistent event handling across all components
- **Performance**: Leverage hardware acceleration where available

### Success Metrics

- 95%+ coverage of commonly used SwiftUI modifiers
- All fundamental web events available as modifiers
- Consistent event handling across component and modifier systems
- All visual effects use CSS filters for performance
- Zero performance regression
- Complete TypeScript coverage

---

## Technical Requirements

### Missing Core Modifiers (10 Priority)

#### Visual Effects (7) - CSS Filter Based
1. **`.blur(radius)`** - CSS `filter: blur()`
2. **`.brightness(amount)`** - CSS `filter: brightness()`
3. **`.contrast(amount)`** - CSS `filter: contrast()`
4. **`.saturation(amount)`** - CSS `filter: saturate()`
5. **`.hueRotation(angle)`** - CSS `filter: hue-rotate()`
6. **`.grayscale(amount)`** - CSS `filter: grayscale()`
7. **`.colorInvert()`** - CSS `filter: invert()`

#### Transform Modifiers (3)
8. **`.scaleEffect(x, y?, anchor?)`** - CSS `transform: scale()`
9. **`.position(x, y)`** - Absolute positioning
10. **`.alignmentGuide(alignment, computeValue)`** - Custom alignment logic

### Current Event Modifier Status

#### ✅ **CONFIRMED IMPLEMENTED IN TACHUI**
**Core Interaction Modifiers (via modifier builder):**
- ✅ `.onTap(handler: (event: MouseEvent) => void)` - Primary click/tap interaction
- ✅ `.onHover(handler: (isHovered: boolean) => void)` - Hover state changes  
- ✅ `.onMouseEnter/Leave/Down/Up(handler)` - Complete mouse event suite
- ✅ `.onDragStart/Over/Leave/Drop(handler)` - Complete drag & drop suite
- ✅ `.disabled(isDisabled)` - Disabled state control
- ✅ `.draggable(isDraggable)` - Draggable state control

**Lifecycle Modifiers (via modifier builder):**
- ✅ `.onAppear(handler)` - Component appears in viewport
- ✅ `.onDisappear(handler)` - Component leaves viewport
- ✅ `.task(operation, options)` - Async operations with cancellation
- ✅ `.refreshable(onRefresh, isRefreshing)` - Pull-to-refresh

**Component-Specific Events:**
- ✅ `onChange` - Available in BasicInput, TextField, forms components
- ✅ `onSubmit` - Available in BasicInput, Form components
- ✅ `onFocus/onBlur` - Available in BasicInput and form components (as component props, not modifiers)
- ✅ `onSelectionChange` - Picker, Select components
- ✅ `onToggle` - Toggle component

#### ❌ **MISSING FROM MODIFIER SYSTEM**

**Critical Missing Event Modifiers:**
- ❌ `.onFocus(handler)` - Missing from modifier builder (only in InteractionModifierProps types)
- ❌ `.onBlur(handler)` - Not implemented anywhere
- ❌ `.onKeyPress(key, action)` - Keyboard event handling
- ❌ `.onKeyDown/onKeyUp(handler)` - Individual key events
- ❌ `.onChange(handler)` - Missing as general modifier (only component-specific)

**Missing Gesture Modifiers:**
- ❌ `.onLongPressGesture(minimumDuration, maximumDistance, perform, onPressingChanged)`
- ❌ `.highPriorityGesture(gesture, including)` - Gesture precedence
- ❌ `.simultaneousGesture(gesture, including)` - Concurrent gestures
- ❌ `.gesture(gesture, including)` - Advanced gesture support

**Missing Keyboard Modifiers:**
- ❌ `.keyboardShortcut(key, modifiers)` - Keyboard shortcuts
- ❌ `.onModifierKeysChanged` - Modifier key tracking

**Missing Focus Modifiers:**
- ❌ `.focused(binding)` - Focus state binding
- ❌ `.focusable(isFocusable, interactions)` - Focus control
- ❌ `.prefersDefaultFocus(binding, in)` - Default focus

**Missing Advanced Interaction:**
- ❌ `.onContinuousHover(coordinateSpace, perform)` - Hover tracking with coordinates
- ❌ `.hoverEffect(effect)` - Hover visual effects
- ❌ `.allowsHitTesting(enabled)` - Hit test control (beyond disabled)

**Missing Web-Native Events:**
- ❌ `.onScroll(handler)` - Scroll events
- ❌ `.onWheel(handler)` - Mouse wheel events  
- ❌ `.onResize(handler)` - Element resize events
- ❌ `.onDoubleClick(handler)` - Double-click events
- ❌ `.onContextMenu(handler)` - Right-click context menu
- ❌ `.onInput(handler)` - Input events (different from onChange)
- ❌ `.onSelect(handler)` - Text selection events
- ❌ `.onCopy/onCut/onPaste(handler)` - Clipboard events

---

## API Design

### Phase 1: Critical Event Modifiers

```typescript
// Fix missing focus/blur events
TextField("Username")
  .modifier
  .onFocus(() => console.log('Focus gained')) // MISSING - type exists but no builder
  .onBlur(() => console.log('Focus lost'))     // MISSING - completely absent
  .build()

// Essential keyboard events
VStack({ children })
  .modifier
  .onKeyPress('Enter', (event) => handleSubmit())
  .onKeyDown((event) => handleKeyDown(event))
  .onKeyUp((event) => handleKeyUp(event))
  .build()

// Critical web events missing everywhere
ScrollView({ children })
  .modifier
  .onScroll((event) => handleScroll(event))
  .onWheel((event) => handleWheel(event))
  .build()

// Basic interaction events
Button("Right Click Me", action)
  .modifier
  .onDoubleClick(() => handleDoubleClick())
  .onContextMenu((event) => handleRightClick(event))
  .build()

// Real-time input tracking
BasicInput({ text, setText })
  .modifier
  .onInput((event) => handleRealTimeInput(event)) // Different from onChange
  .onChange((value) => handleChangeEvent(value))  // General modifier version
  .build()

// Enhanced clipboard events
Text("Copy this text")
  .modifier
  .onCopy((event) => handleCopy(event))
  .onCut((event) => handleCut(event))  
  .onPaste((event) => handlePaste(event))
  .build()
```

### Visual Effects Modifiers

```typescript
// Blur effect
Image("background")
  .modifier
  .blur(10) // 10px blur radius
  .build()

// Brightness and contrast adjustments
Text("Enhanced")
  .modifier
  .brightness(1.2) // 120% brightness
  .contrast(1.1) // 110% contrast
  .build()

// Color effects
VStack({ children })
  .modifier
  .saturation(0.5) // 50% saturation
  .hueRotation(45) // 45 degree hue shift
  .build()

// Grayscale and invert
Button("Action", handler)
  .modifier
  .grayscale(0.8) // 80% grayscale
  .hover(
    grayscale: 0, // Full color on hover
    transition: { duration: 200 }
  )
  .build()

// Combined effects
Image("hero")
  .modifier
  .blur(5)
  .brightness(0.9)
  .contrast(1.2)
  .saturation(1.5)
  .build()
```

### Transform Modifiers

```typescript
// Scale effect with anchor
Button("Scale Me", handler)
  .modifier
  .scaleEffect(1.2) // Uniform scale
  .scaleEffect(1.5, 0.8) // X and Y scale
  .scaleEffect(2, 2, 'topLeading') // With anchor
  .build()

// Absolute positioning
Text("Positioned")
  .modifier
  .position(100, 50) // x: 100px, y: 50px
  .build()

// Custom alignment guide
VStack({ children })
  .modifier
  .alignmentGuide('leading', (dimensions) => {
    return dimensions.width * 0.25 // 25% from leading edge
  })
  .build()
```

### Enhanced Input/Event Modifiers

```typescript
// Long press gesture
Button("Long Press", handler)
  .modifier
  .onLongPressGesture({
    minimumDuration: 500, // ms
    maximumDistance: 10, // px
    perform: () => console.log('Long pressed!'),
    onPressingChanged: (isPressing) => {
      console.log('Pressing:', isPressing)
    }
  })
  .build()

// Keyboard shortcuts
TextField("Search")
  .modifier
  .keyboardShortcut('/', ['cmd']) // Cmd+/
  .onKeyPress('Enter', () => {
    performSearch()
  })
  .build()

// Focus management
const [isFocused, setIsFocused] = createSignal(false)

TextField("Username")
  .modifier
  .focused(isFocused)
  .onSubmit('text', () => {
    // Move to next field
    setIsFocused(false)
  })
  .build()

// Continuous hover tracking
VStack({ children })
  .modifier
  .frame({ width: 800, height: 600 })
  .onContinuousHover('local', (location) => {
    if (location) {
      handleHoverTracking(location.x, location.y)
    }
  })
  .hoverEffect('highlight')
  .build()
```

---

## Implementation Architecture

### Phase 1: Critical Event Modifier System

#### 1. Enhanced Interaction Modifier Types
```typescript
// packages/core/src/modifiers/types.ts - UPDATE InteractionModifierProps
export interface InteractionModifierProps {
  // Existing modifiers
  onTap?: (event: MouseEvent) => void
  onHover?: (isHovered: boolean) => void
  onMouseEnter?: (event: MouseEvent) => void
  onMouseLeave?: (event: MouseEvent) => void
  onMouseDown?: (event: MouseEvent) => void
  onMouseUp?: (event: MouseEvent) => void
  onDragStart?: (event: DragEvent) => void
  onDragOver?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void
  
  // MISSING - Fix onFocus implementation gap
  onFocus?: (isFocused: boolean) => void // EXISTS IN TYPE, MISSING IN BUILDER
  
  // NEW - Critical missing web events
  onBlur?: (isFocused: boolean) => void
  onKeyPress?: (event: KeyboardEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  onKeyUp?: (event: KeyboardEvent) => void
  onScroll?: (event: Event) => void
  onWheel?: (event: WheelEvent) => void
  onDoubleClick?: (event: MouseEvent) => void
  onContextMenu?: (event: MouseEvent) => void
  onInput?: (event: InputEvent) => void
  onChange?: (value: any, event?: Event) => void
  onCopy?: (event: ClipboardEvent) => void
  onCut?: (event: ClipboardEvent) => void
  onPaste?: (event: ClipboardEvent) => void
  onResize?: (entry: ResizeObserverEntry) => void
  onSelect?: (event: Event) => void
  
  // Existing
  disabled?: boolean
  draggable?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
}
```

#### 2. Enhanced InteractionModifier Implementation
```typescript
// packages/core/src/modifiers/base.ts - UPDATE InteractionModifier
export class InteractionModifier extends BaseModifier<InteractionModifierProps> {
  readonly type = 'interaction'
  readonly priority = 75
  
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    
    const element = context.element
    const props = this.properties
    
    // EXISTING: onTap, onHover, onMouse*, onDrag*, disabled, draggable
    
    // FIX: Focus events (onFocus exists in type but missing implementation)
    if (props.onFocus) {
      element.addEventListener('focus', () => props.onFocus!(true))
      element.addEventListener('blur', () => props.onFocus!(false))
    }
    
    // NEW: Critical missing web events
    if (props.onBlur) element.addEventListener('blur', () => props.onBlur!(false))
    if (props.onKeyPress) element.addEventListener('keypress', props.onKeyPress)
    if (props.onKeyDown) element.addEventListener('keydown', props.onKeyDown)
    if (props.onKeyUp) element.addEventListener('keyup', props.onKeyUp)
    if (props.onScroll) element.addEventListener('scroll', props.onScroll, { passive: true })
    if (props.onWheel) element.addEventListener('wheel', props.onWheel, { passive: false })
    if (props.onDoubleClick) element.addEventListener('dblclick', props.onDoubleClick)
    if (props.onContextMenu) element.addEventListener('contextmenu', props.onContextMenu)
    if (props.onInput) element.addEventListener('input', props.onInput)
    if (props.onChange) {
      element.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement
        props.onChange!(target.value || target.textContent || '', event)
      })
    }
    if (props.onCopy) element.addEventListener('copy', props.onCopy)
    if (props.onCut) element.addEventListener('cut', props.onCut)
    if (props.onPaste) element.addEventListener('paste', props.onPaste)
    
    return undefined
  }
}
```

#### 3. Modifier Builder Implementation Updates
```typescript
// packages/core/src/modifiers/builder.ts - ADD MISSING METHODS
export class ModifierBuilderImpl<T extends ComponentInstance = ComponentInstance> {
  // EXISTING: onTap, onHover, onMouseEnter/Leave/Down/Up, onDrag*, disabled, draggable
  
  // FIX MISSING: onFocus exists in types but not in builder
  onFocus(handler: (isFocused: boolean) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onFocus: handler }))
    return this
  }
  
  // NEW: Critical missing web events
  onBlur(handler: (isFocused: boolean) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onBlur: handler }))
    return this
  }
  
  onKeyPress(handler: (event: KeyboardEvent) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onKeyPress: handler }))
    return this
  }
  
  onKeyDown(handler: (event: KeyboardEvent) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onKeyDown: handler }))
    return this
  }
  
  onKeyUp(handler: (event: KeyboardEvent) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onKeyUp: handler }))
    return this
  }
  
  onScroll(handler: (event: Event) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onScroll: handler }))
    return this
  }
  
  onWheel(handler: (event: WheelEvent) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onWheel: handler }))
    return this
  }
  
  onDoubleClick(handler: (event: MouseEvent) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onDoubleClick: handler }))
    return this
  }
  
  onContextMenu(handler: (event: MouseEvent) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onContextMenu: handler }))
    return this
  }
  
  onInput(handler: (event: InputEvent) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onInput: handler }))
    return this
  }
  
  onChange(handler: (value: any, event?: Event) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onChange: handler }))
    return this
  }
  
  onCopy(handler: (event: ClipboardEvent) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onCopy: handler }))
    return this
  }
  
  onCut(handler: (event: ClipboardEvent) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onCut: handler }))
    return this
  }
  
  onPaste(handler: (event: ClipboardEvent) => void): ModifierBuilder<T> {
    this.modifiers.push(new InteractionModifier({ onPaste: handler }))
    return this
  }
}
```

### Phase 2: Visual Effects System

```typescript
// packages/core/src/modifiers/visual-effects.ts
export abstract class VisualEffectModifier<T> extends BaseModifier<T> {
  protected combineFilters(filters: string[]): string {
    return filters.filter(Boolean).join(' ')
  }
  
  protected updateFilter(element: HTMLElement, filterValue: string) {
    const existing = element.style.filter || ''
    const filters = this.parseFilters(existing)
    filters[this.filterType] = filterValue
    element.style.filter = this.combineFilters(Object.values(filters))
  }
}

export class BlurModifier extends VisualEffectModifier<number> {
  readonly type = 'blur'
  readonly filterType = 'blur'
  
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    
    const radius = this.properties
    this.updateFilter(context.element, `blur(${radius}px)`)
    
    return undefined
  }
}

// Similar implementations for other visual effects
export class BrightnessModifier extends VisualEffectModifier<number> { ... }
export class ContrastModifier extends VisualEffectModifier<number> { ... }
export class SaturationModifier extends VisualEffectModifier<number> { ... }
export class HueRotationModifier extends VisualEffectModifier<number> { ... }
export class GrayscaleModifier extends VisualEffectModifier<number> { ... }
export class ColorInvertModifier extends VisualEffectModifier<boolean> { ... }
```

### Transform System Enhancement

```typescript
// packages/core/src/modifiers/transforms.ts
export class ScaleEffectModifier extends BaseModifier<ScaleEffectOptions> {
  readonly type = 'scaleEffect'
  readonly priority = 85
  
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    
    const { x, y, anchor } = this.normalizeOptions(this.properties)
    const transform = this.buildTransform(x, y, anchor)
    
    // Preserve existing transforms
    const existing = this.getExistingTransforms(context.element)
    context.element.style.transform = `${existing} ${transform}`.trim()
    
    // Set transform origin based on anchor
    context.element.style.transformOrigin = this.getTransformOrigin(anchor)
    
    return undefined
  }
  
  private normalizeOptions(props: ScaleEffectOptions): NormalizedScale {
    if (typeof props === 'number') {
      return { x: props, y: props, anchor: 'center' }
    }
    // Handle other overloads
  }
}

export class PositionModifier extends BaseModifier<PositionOptions> {
  readonly type = 'position'
  readonly priority = 90
  
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    
    const { x, y } = this.properties
    Object.assign(context.element.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`
    })
    
    return undefined
  }
}
```

### Enhanced Gesture System

```typescript
// packages/core/src/modifiers/gestures.ts
export class LongPressGestureModifier extends BaseModifier<LongPressOptions> {
  private timeoutId?: number
  private startTime?: number
  private startPoint?: { x: number, y: number }
  
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    
    const element = context.element
    const options = this.normalizeOptions(this.properties)
    
    element.addEventListener('pointerdown', this.handlePointerDown)
    element.addEventListener('pointermove', this.handlePointerMove)
    element.addEventListener('pointerup', this.handlePointerUp)
    element.addEventListener('pointercancel', this.handlePointerCancel)
    
    return undefined
  }
  
  private handlePointerDown = (event: PointerEvent) => {
    this.startTime = Date.now()
    this.startPoint = { x: event.clientX, y: event.clientY }
    
    if (this.properties.onPressingChanged) {
      this.properties.onPressingChanged(true)
    }
    
    this.timeoutId = window.setTimeout(() => {
      if (this.isValidLongPress()) {
        this.properties.perform()
      }
    }, this.properties.minimumDuration || 500)
  }
  
  private handlePointerMove = (event: PointerEvent) => {
    if (!this.startPoint) return
    
    const distance = Math.sqrt(
      Math.pow(event.clientX - this.startPoint.x, 2) +
      Math.pow(event.clientY - this.startPoint.y, 2)
    )
    
    if (distance > (this.properties.maximumDistance || 10)) {
      this.cancel()
    }
  }
}
```

### Keyboard Modifier System

```typescript
// packages/core/src/modifiers/keyboard.ts
export class KeyboardShortcutModifier extends BaseModifier<KeyboardShortcutOptions> {
  readonly type = 'keyboardShortcut'
  
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    
    const { key, modifiers } = this.properties
    const handler = this.createShortcutHandler(key, modifiers)
    
    // Register globally for shortcuts
    document.addEventListener('keydown', handler)
    
    // Store for cleanup
    context.metadata.set('keyboardShortcut', handler)
    
    return undefined
  }
  
  private createShortcutHandler(key: string, modifiers: string[]) {
    return (event: KeyboardEvent) => {
      if (this.matchesShortcut(event, key, modifiers)) {
        event.preventDefault()
        // Trigger associated action
      }
    }
  }
}
```

---

## Development Phases

### Phase 1: Critical Event Modifier Gaps (1 week)
**Priority**: **CRITICAL** - Fixes fundamental developer experience issues

**Deliverables:**
- Fix missing `.onFocus(handler)` in modifier builder (type exists but implementation missing)
- Add `.onBlur(handler)` to complete focus event pair
- Implement keyboard event modifiers: `.onKeyPress()`, `.onKeyDown()`, `.onKeyUp()`
- Add essential web events: `.onScroll()`, `.onWheel()`, `.onDoubleClick()`, `.onContextMenu()`
- Implement `.onInput(handler)` for real-time input tracking
- Add general `.onChange(handler)` modifier (beyond component-specific)

**Acceptance Criteria:**
- All fundamental web events work as modifiers on any component
- Event handlers have proper TypeScript types and parameter passing
- Events work consistently across component and modifier systems
- No breaking changes to existing event handling
- Comprehensive test coverage for all new event modifiers

### Phase 2: Visual Effects (1 week)
**Deliverables:**
- All 7 visual effect modifiers implemented
- Filter combination system
- Transition support for filter changes
- Performance optimization for multiple filters

**Acceptance Criteria:**
- Each filter works independently and in combination
- Hardware acceleration enabled
- Smooth transitions between filter states
- No performance degradation with multiple effects

### Phase 3: Transform Modifiers (3 days)
**Deliverables:**
- ScaleEffect modifier with anchor support
- Position modifier for absolute positioning
- Transform combination system
- AlignmentGuide (basic implementation)

**Acceptance Criteria:**
- Transforms combine properly with existing transforms
- Anchor points work correctly for scale
- Position modifier switches to absolute positioning
- Basic alignment guide functionality

### Phase 4: Advanced Input/Gesture Modifiers (1 week)
**Deliverables:**
- LongPressGesture with all options
- Gesture priority system
- Keyboard shortcut system
- Focus state management
- Enhanced hover tracking with coordinates

**Acceptance Criteria:**
- Long press works with timing and distance constraints
- Gesture priorities resolve correctly
- Keyboard shortcuts work globally and locally
- Focus can be programmatically controlled
- Hover tracking provides continuous updates with location data

---

## Examples and Use Cases

### Photo Editor Component
```typescript
const PhotoEditor = ({ imageUrl }: { imageUrl: string }) => {
  const [brightness, setBrightness] = createSignal(1)
  const [contrast, setContrast] = createSignal(1)
  const [saturation, setSaturation] = createSignal(1)
  const [blur, setBlur] = createSignal(0)
  
  return VStack({
    children: [
      Image(imageUrl)
        .modifier
        .resizable()
        .aspectRatio(1, 'fit')
        .brightness(brightness())
        .contrast(contrast())
        .saturation(saturation())
        .blur(blur())
        .cornerRadius(8)
        .build(),
        
      HStack({
        children: [
          Slider({
            value: brightness,
            range: [0, 2],
            label: "Brightness"
          }),
          Slider({
            value: contrast,
            range: [0, 2],
            label: "Contrast"
          }),
          // More controls...
        ]
      })
    ]
  })
}
```

### Interactive Drawing Area with Gestures
```typescript
const DrawingArea = () => {
  const [isDrawing, setIsDrawing] = createSignal(false)
  const [scale, setScale] = createSignal(1)
  
  return VStack({
    children: [
      Text("Drawing Area - Canvas component planned in Epic: Catamount")
    ]
  })
    .modifier
    .frame({ width: 800, height: 600 })
    .backgroundColor('#f8f9fa')
    .border(2, '#dee2e6', 'dashed')
    .scaleEffect(scale())
    .onContinuousHover('local', (location) => {
      if (isDrawing() && location) {
        handleDrawing(location.x, location.y)
      }
    })
    .onLongPressGesture({
      minimumDuration: 1000,
      perform: () => clearDrawingArea(),
      onPressingChanged: (pressing) => {
        showClearIndicator(pressing)
      }
    })
    .keyboardShortcut('z', ['cmd'], undo)
    .keyboardShortcut('z', ['cmd', 'shift'], redo)
    .build()
}
```

### Advanced Form with Focus Management
```typescript
const LoginForm = () => {
  const [usernameFocused, setUsernameFocused] = createSignal(false)
  const [passwordFocused, setPasswordFocused] = createSignal(false)
  
  return Form({
    children: [
      TextField("Username")
        .modifier
        .focused(usernameFocused)
        .onSubmit('text', () => {
          setUsernameFocused(false)
          setPasswordFocused(true)
        })
        .build(),
        
      SecureField("Password")
        .modifier
        .focused(passwordFocused)
        .onSubmit('text', handleLogin)
        .keyboardShortcut('Enter', [], handleLogin)
        .build(),
        
      Button("Login", handleLogin)
        .modifier
        .keyboardShortcut('Enter', ['cmd'])
        .disabled(!isValid())
        .opacity(isValid() ? 1 : 0.6)
        .scaleEffect(isPressed() ? 0.95 : 1)
        .build()
    ]
  })
}
```

---

## Performance Considerations

### Visual Effects Optimization
- **GPU Acceleration**: Use `will-change: filter` for animated effects
- **Filter Caching**: Cache combined filter strings
- **Lazy Application**: Only apply filters when values change
- **Batch Updates**: Combine multiple filter changes

### Transform Performance
- **Transform Caching**: Preserve existing transforms
- **3D Acceleration**: Use `translateZ(0)` hack when needed
- **Batch Processing**: Combine transform updates

### Gesture Performance
- **Passive Listeners**: Use passive event listeners where possible
- **Throttling**: Throttle continuous events (hover tracking)
- **Cleanup**: Properly remove event listeners

---

## Testing Strategy

### Visual Regression Tests
- Capture screenshots with various filter combinations
- Test filter transitions and animations
- Verify GPU acceleration is active

### Gesture Testing
- Simulate long press with timing
- Test gesture conflicts and priorities
- Verify touch and mouse compatibility

### Keyboard Testing
- Test shortcut combinations
- Verify focus management
- Test submit event propagation

---

## Migration Guide

### For Existing tachUI Users
```typescript
// Old approach (CSS modifiers)
.modifier.css({ filter: 'blur(5px) brightness(1.2)' })

// New approach (dedicated modifiers)
.modifier.blur(5).brightness(1.2)

// Old transform approach
.modifier.css({ transform: 'scale(1.5)' })

// New transform approach
.modifier.scaleEffect(1.5)
```

---

## Future Considerations

### Post-1.3 Enhancements
- **Advanced Gestures**: Pinch, rotate, swipe gestures
- **Custom Filters**: SVG filter support
- **3D Transforms**: Perspective and 3D rotation
- **Advanced Focus**: Focus groups and navigation
- **Accessibility**: Enhanced screen reader support

### Integration Opportunities
- **Animation System**: Combine with spring animations
- **State Machines**: Gesture state machines
- **Custom Shaders**: WebGL filter effects

---

## Dependencies and Risks

### Dependencies
- CSS Filter support (universal in modern browsers)
- Pointer Events API (good support)
- Keyboard API (standard)

### Risks and Mitigations
- **Browser Compatibility**: Provide fallbacks for older browsers
- **Performance**: Monitor filter performance on low-end devices
- **Complexity**: Phase implementation to manage complexity

---

## Conclusion

Epic: Butternut addresses a critical discovery: tachUI has significant gaps in fundamental web event handling that create inconsistent developer experiences. While tachUI has good SwiftUI visual modifier coverage, many expected web-native events are missing from the modifier system.

**Critical Findings:**
- `.onFocus()` exists in types but is missing from modifier builder implementation
- Essential web events (onBlur, onKeyPress, onScroll, onWheel, etc.) are completely absent
- Event handling is inconsistent between component props and modifier system
- Developers cannot rely on standard web events being available everywhere

**Epic Priority Reordering:**
1. **Phase 1 (CRITICAL)**: Fix missing web event modifiers - fundamental developer experience
2. **Phase 2**: Visual effects - enhance user experience  
3. **Phase 3**: Transform modifiers - complete SwiftUI parity
4. **Phase 4**: Advanced gestures - specialized use cases

**Success Definition**: 
- All fundamental web events work as modifiers on any component
- Consistent event handling across component and modifier systems  
- Developers can rely on standard web interactions being universally available
- 95%+ SwiftUI modifier parity achieved with excellent web performance

**Next Steps:**
1. Approve updated technical design and priority reordering
2. Begin Phase 1 (Critical Event Gaps) implementation - **HIGHEST PRIORITY**
3. Create comprehensive test suite for event modifier consistency
4. Gather developer feedback on improved event handling experience

This epic transforms from "nice-to-have visual effects" to "critical framework completion" - fixing fundamental gaps that impact every tachUI developer.