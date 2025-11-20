---
cssclasses:
  - full-page
---

# Button Interaction States Implementation Plan

## Current State Analysis

### ✅ Implemented Features

**State Infrastructure:**
- `ButtonState` type with 4 states: `'normal' | 'pressed' | 'disabled' | 'focused'`
- Reactive state signals using `createSignal<ButtonState>('normal')`
- State getter/setter methods (`stateSignal`, `setState`)

**Visual State System:**
- Complete `getButtonStyles()` method with state-based styling
- Press state visual feedback (darkened colors, scale transform)
- Focus state with box-shadow outline
- Disabled state with opacity and color changes
- Loading state support with opacity changes

**Basic Interaction:**
- `handlePress()` method with state management
- Automatic state reset after 150ms
- Error handling for action execution
- Loading state handling
- Haptic feedback support

**Styling System:**
- 5 button variants: `filled`, `outlined`, `plain`, `bordered`, `borderedProminent`
- 3 button sizes: `small`, `medium`, `large`
- 3 button roles: `destructive`, `cancel`, `none`
- Theme-based color system with proper contrast
- CSS transitions for smooth state changes

### ❌ Missing Implementation

**DOM Event Integration:**
- No actual DOM event listeners attached to buttons
- State changes only happen via programmatic `handlePress()` calls
- Missing hover state detection
- Missing focus/blur event handling
- Missing mouse down/up event handling

**Calculator Integration:**
- Calculator buttons don't use Button component state system
- No hover effects on calculator buttons
- No press state feedback during interactions

**Asset-Based State Styling:**
- No integration with ColorAsset system for state-specific colors
- Missing StateGradient asset support in Button component
- No theme-reactive state styling

## Implementation Plan

### Phase 0: Enhanced ColorAsset System (2-3 days)

**Objective:** Extend ColorAsset system to support default fallback mode and improve API ergonomics.

**New API Design:**
```typescript
// New signature - default and name required, light/dark optional
ColorAsset.init({
  default: "#cc3399",  // Required - fallback for any theme
  dark: "#333333",     // Optional - dark theme override
  light: "#CCCCCC",    // Optional - light theme override  
  name: "exampleColor" // Required - asset identifier
})

ImageAsset.init({
  default: "/logo.png",      // Required - fallback image
  dark: "/logo-dark.png",    // Optional - dark theme override  
  light: "/logo-light.png",  // Optional - light theme override
  name: "appLogo",           // Required - asset identifier
  options: { alt: "App Logo" } // Optional - same as before
})

// Fallback behavior examples:
ColorAsset.init({
  default: "#007AFF",
  name: "primaryBlue"
}) // Returns #007AFF for both light and dark themes

ColorAsset.init({
  default: "#007AFF",
  dark: "#0A84FF", 
  name: "primaryBlue"
}) // Returns #0A84FF in dark, #007AFF in light

ColorAsset.init({
  default: "#007AFF",
  light: "#0066CC",
  dark: "#0A84FF",
  name: "primaryBlue"  
}) // Returns specific colors for each theme

// Resolve priority: theme-specific → default
// Dark mode: asset.dark || asset.default
// Light mode: asset.light || asset.default
```

**File Changes:**
- `packages/core/src/assets/ColorAsset.ts` - Remove old signature, implement new object-based API
- `packages/core/src/assets/ImageAsset.ts` - Add default mode support with same object pattern
- `packages/core/src/assets/index.ts` - Remove `createColorAsset()` function entirely
- Update all existing ColorAsset/ImageAsset usage across codebase:
  - `apps/calculator/src/assets/calculator-assets.ts`
  - Built-in system assets in `packages/core/src/assets/index.ts`
  - Any tests or documentation examples

**Implementation Details:**
1. **Replace old ColorAsset.init()** signature entirely
2. **Remove createColorAsset()** function - no deprecation, clean break
3. **Add ImageAsset default mode** with same object pattern
4. **Update all existing usages** immediately during this phase
5. **Validate `default` is required** - throw error if missing
6. **Resolve priority:** `theme-specific || default` (dark mode uses `dark || default`)

**Breaking Changes:**
- All existing `ColorAsset.init(light, dark, name)` calls must be updated
- All existing `createColorAsset(light, dark, name)` calls must be updated  
- All existing `ImageAsset.init(light, dark, name)` calls must be updated
- This is a breaking change requiring codebase-wide updates

### Phase 1: DOM Event Integration (1-2 days)

**File:** `packages/core/src/components/Button.ts`

**Tasks:**
1. Add lifecycle hook integration using `useLifecycle`
2. Implement `onDOMReady` to attach event listeners
3. Add mouse/pointer event handlers:
   - `mousedown`/`pointerdown` → `pressed` state
   - `mouseup`/`pointerup` → `normal` state  
   - `mouseenter` → future hover state support
   - `mouseleave` → `normal` state
   - `focus` → `focused` state
   - `blur` → `normal` state

**Implementation:**
```typescript
useLifecycle(this, {
  onDOMReady: (_elements, primaryElement) => {
    if (primaryElement instanceof HTMLButtonElement) {
      this.attachInteractionEvents(primaryElement)
    }
  }
})

private attachInteractionEvents(button: HTMLButtonElement): void {
  // Mouse/pointer events for press states
  const handleMouseDown = () => {
    if (this.isEnabled()) this.setState('pressed')
  }
  
  const handleMouseUp = () => {
    if (this.isEnabled()) this.setState('normal')
  }
  
  // Focus events
  const handleFocus = () => {
    if (this.isEnabled()) this.setState('focused')
  }
  
  const handleBlur = () => {
    if (this.isEnabled()) this.setState('normal')
  }
  
  button.addEventListener('mousedown', handleMouseDown)
  button.addEventListener('mouseup', handleMouseUp)
  button.addEventListener('focus', handleFocus)
  button.addEventListener('blur', handleBlur)
  
  // Store cleanup functions
  this.cleanup.push(() => {
    button.removeEventListener('mousedown', handleMouseDown)
    button.removeEventListener('mouseup', handleMouseUp)
    button.removeEventListener('focus', handleFocus)
    button.removeEventListener('blur', handleBlur)
  })
}
```

### Phase 2: Dynamic Style Application (1 day)

**File:** `packages/core/src/components/Button.ts`

**Tasks:**
1. Create reactive style application system
2. Connect `getButtonStyles()` to DOM element updates
3. Ensure styles update when state changes

**Implementation:**
```typescript
private setupReactiveStyles(button: HTMLButtonElement): void {
  createEffect(() => {
    const styles = this.getButtonStyles()
    Object.assign(button.style, styles)
  })
}
```

### Phase 3: Asset Integration (2-3 days)

**File:** `packages/core/src/components/Button.ts`

**Tasks:**
1. Add support for ColorAsset-based button colors
2. Integrate StateGradient assets for hover effects
3. Update ButtonProps interface for asset-based styling

**Implementation:**
```typescript
export interface ButtonProps extends ComponentProps {
  // ... existing props
  
  // Asset-based styling
  backgroundColor?: ColorAsset | string | Signal<string>
  borderColor?: ColorAsset | string | Signal<string>
  textColor?: ColorAsset | string | Signal<string>
  overlayGradient?: StateGradient
}

private resolveAssetColor(asset: ColorAsset | string | Signal<string>): string {
  if (asset instanceof ColorAsset) {
    return asset.resolve()
  }
  if (typeof asset === 'string') {
    return asset
  }
  return asset() // Signal
}
```

### Phase 4: Calculator Integration (1 day)

**File:** `apps/calculator/src/components/CalculatorButton.ts`

**Tasks:**
1. Update calculator to use tachUI Button component
2. Apply calculator-specific ColorAssets to buttons
3. Add StateGradient overlay effects

**Implementation:**
```typescript
// Update calculator buttons to use Button component with assets
Button(digit.toString(), () => handleDigit(digit), {
  backgroundColor: Assets.numberButtonBackground,
  textColor: Assets.numberButtonForeground,
  overlayGradient: Assets.buttonGradientOverlay
})
```

### Phase 5: Hover State Support (1-2 days)

**Files:** 
- `packages/core/src/components/Button.ts`
- `packages/core/src/assets/StateGradient.ts` (if needed)

**Tasks:**
1. Add `hover` to ButtonState type
2. Implement hover event listeners
3. Update styling system for hover states
4. Ensure proper state transitions

**Implementation:**
```typescript
export type ButtonState = 'normal' | 'pressed' | 'disabled' | 'focused' | 'hover'

// In event handlers:
const handleMouseEnter = () => {
  if (this.isEnabled() && this.stateSignal() !== 'pressed') {
    this.setState('hover')
  }
}

const handleMouseLeave = () => {
  if (this.isEnabled() && this.stateSignal() === 'hover') {
    this.setState('normal')
  }
}
```

### Phase 6: Testing & Documentation (1 day)

**Tasks:**
1. Add comprehensive tests for button state interactions
2. Update Button component documentation
3. Create example usage with ColorAssets
4. Test calculator button interactions

## Success Criteria

### Functional Requirements
- [ ] Button states change in response to DOM events
- [ ] Visual feedback immediate and smooth
- [ ] Calculator buttons show hover/press effects
- [ ] Asset-based styling works with state changes
- [ ] No performance regression

### Technical Requirements  
- [ ] All existing tests pass
- [ ] New interaction tests added
- [ ] TypeScript compilation without errors
- [ ] Memory leaks prevented (event cleanup)
- [ ] Accessibility preserved (ARIA states)

## Timeline: 8-12 days

**Week 1:**
- Days 1-3: Enhanced ColorAsset System
- Days 4-5: DOM Event Integration  
- Day 6: Dynamic Style Application

**Week 2:**
- Days 7-9: Asset Integration with new ColorAsset API
- Day 10: Calculator Integration
- Days 11-12: Hover Support + Testing

## Risk Mitigation

**Event Listener Memory Leaks:**
- Ensure all event listeners stored in `cleanup` array
- Test component unmounting behavior

**State Conflicts:**
- Implement proper state precedence (disabled > pressed > focused > hover > normal)
- Prevent rapid state changes causing visual glitches

**Performance Impact:**
- Use `createEffect` sparingly
- Batch style updates where possible
- Test with large numbers of buttons

## Example Usage After Implementation

### Basic Button with Asset-Based State Styling

```typescript
import { Button, Assets, ColorAsset } from '@tachui/core'

// Create state-aware color assets using new API
const buttonBackground = ColorAsset.init({
  default: '#007AFF',
  light: '#007AFF',
  dark: '#0A84FF',
  name: 'primaryButton'
})

const buttonText = ColorAsset.init({
  default: '#FFFFFF',
  name: 'primaryButtonText'
}) // Same color for all themes

// Button with full state support using modifier pattern
const primaryButton = Button('Save Changes', handleSave, { variant: 'filled', size: 'medium' })
  .modifier
  .backgroundColor(buttonBackground)
  .textColor(buttonText)
  .overlayGradient(Assets.buttonGradientOverlay)
  .build()
```

### Calculator Button Implementation

```typescript
import { Button, Assets } from '@tachui/core'

// Number buttons with state feedback
const numberButton = Button('7', () => handleDigit(7), { size: 'large' })
  .modifier
  .backgroundColor(Assets.numberButtonBackground)
  .textColor(Assets.numberButtonForeground)
  .borderColor(Assets.numberButtonBorder)
  .overlayGradient(Assets.buttonGradientOverlay)
  .build()

// Operator buttons with active state
const operatorButton = Button('+', () => handleOperator('+'), { variant: 'filled', size: 'large' })
  .modifier
  .backgroundColor(Assets.operatorButtonBackground)
  .textColor(Assets.operatorButtonForeground)
  .overlayGradient(Assets.buttonGradientOverlay)
  .build()
```

### Advanced Button with Custom State Colors

```typescript
import { Button, ColorAsset, StateGradient, LinearGradient } from '@tachui/core'

// Custom state-specific colors
const customButton = Button('Interactive Button', handleClick, { hapticFeedback: true })
  .modifier
  .backgroundColor(ColorAsset.init({
    default: '#FF6B6B',
    dark: '#FF5252',
    name: 'customButtonBg'
  }))
  .textColor(ColorAsset.init({
    default: '#FFFFFF',
    name: 'customButtonText'
  }))
  .overlayGradient(StateGradient('customOverlay', {
    default: LinearGradient({
      colors: ['rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.1)'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    }),
    hover: LinearGradient({
      colors: ['rgba(255, 255, 255, 0.2)', 'rgba(0, 0, 0, 0.05)'],
      startPoint: 'topLeading', 
      endPoint: 'bottomTrailing'
    }),
    pressed: LinearGradient({
      colors: ['rgba(0, 0, 0, 0.2)', 'rgba(255, 255, 255, 0.1)'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    })
  }))
  .build()
```

### Developer-Managed State Styling

```typescript
import { Button, ColorAsset, registerAsset, createSignal, createEffect } from '@tachui/core'

// Developers can create their own state-specific color assets
const buttonNormal = ColorAsset.init({
  default: '#007AFF',
  light: '#007AFF', 
  dark: '#0A84FF',
  name: 'buttonNormal'
})

const buttonHover = ColorAsset.init({
  default: '#0051D0',
  light: '#0051D0',
  dark: '#1B8AFF', 
  name: 'buttonHover'
})

const buttonPressed = ColorAsset.init({
  default: '#003D82',
  light: '#003D82',
  dark: '#3296FF',
  name: 'buttonPressed'
})

const buttonDisabled = ColorAsset.init({
  default: '#C7C7CC',
  light: '#C7C7CC',
  dark: '#48484A',
  name: 'buttonDisabled'
})

// Register for global access
registerAsset('buttonNormal', buttonNormal)
registerAsset('buttonHover', buttonHover) 
registerAsset('buttonPressed', buttonPressed)
registerAsset('buttonDisabled', buttonDisabled)

// Create reactive background color that responds to button state
const [currentBgColor, setCurrentBgColor] = createSignal(Assets.buttonNormal)

// Custom component that tracks button state and switches assets
function StateAwareButton(title: string, action: () => void, isEnabled: boolean = true) {
  // Create the button component
  const button = Button(title, action, { isEnabled })

  // Access the button's internal state signal (after implementation)
  const buttonState = button.stateSignal

  // Create reactive effect that switches assets based on state
  createEffect(() => {
    const state = buttonState()
    
    switch (state) {
      case 'hover':
        setCurrentBgColor(Assets.buttonHover)
        break
      case 'pressed':
        setCurrentBgColor(Assets.buttonPressed)
        break
      case 'disabled':
        setCurrentBgColor(Assets.buttonDisabled)
        break
      case 'focused':
      case 'normal':
      default:
        setCurrentBgColor(Assets.buttonNormal)
        break
    }
  })

  // Apply reactive background color
  return button
    .modifier
    .backgroundColor(currentBgColor) // Reactive signal that updates with state
    .build()
}

// Usage - automatic asset switching based on button state
const smartButton = StateAwareButton('Smart Button', handleClick, true)

// Alternative: Direct state monitoring approach
const directButton = Button('Direct State Button', handleClick)
  .modifier
  .backgroundColor(() => {
    // Inline reactive function that switches assets based on button state
    const state = directButton.stateSignal()
    switch (state) {
      case 'hover': return Assets.buttonHover.resolve()
      case 'pressed': return Assets.buttonPressed.resolve()
      case 'disabled': return Assets.buttonDisabled.resolve()
      default: return Assets.buttonNormal.resolve()
    }
  })
  .build()
```

### Automatic State Behavior

Once implemented, buttons will automatically:

```typescript
// These behaviors happen automatically - no additional code needed:

// ✅ Hover state on mouse enter
// ✅ Pressed state on mouse down
// ✅ Normal state on mouse up/leave
// ✅ Focused state on keyboard focus
// ✅ Disabled state when isEnabled: false
// ✅ Smooth transitions between all states
// ✅ Haptic feedback on supported devices
// ✅ Theme-reactive colors via ColorAsset
// ✅ Gradient overlays with state changes

const autoButton = Button('Auto States', handleClick, { isEnabled: true })
  .modifier
  .backgroundColor(Assets.primaryColor)
  .build()
```

### State Monitoring (Development/Debug)

```typescript
import { Button, createSignal } from '@tachui/core'

const [buttonState, setButtonState] = createSignal('normal')

const monitoredButton = Button('Monitor Me', handleClick, {
  // Access to internal state for debugging
  onStateChange: (newState) => {
    console.log('Button state changed to:', newState)
    setButtonState(newState)
  }
})
  .modifier
  .backgroundColor(Assets.primaryColor)
  .build()

// Display current state in UI
Text(() => `Current state: ${buttonState()}`)
```

## Future Enhancements

**Post-Implementation:**
- Touch gesture support for mobile
- Keyboard interaction improvements  
- Animation system integration
- Custom state transition timing