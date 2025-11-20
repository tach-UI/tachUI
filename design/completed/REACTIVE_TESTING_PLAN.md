# TachUI Reactive System Testing Plan

## Executive Summary

This document outlines a comprehensive testing strategy to ensure all reactive updates in the TachUI framework work correctly across all components, modifiers, and state integrations. The plan addresses recurring issues with ColorAssets not being reactive, Show component state updates, and button/state integrations.

## Problem Analysis

### Current Issues

1. **ColorAsset Reactivity**: ColorAssets use `getCurrentTheme()` but don't automatically update when theme changes
2. **Show Component Updates**: Show components with signals don't consistently update the DOM when signals change
3. **State Integration**: Button clicks and other interactions don't reliably trigger reactive updates
4. **Test Coverage Gaps**: Existing tests verify component creation but not actual DOM updates

### Root Causes

1. **ColorAsset is not reactive by design**: The `resolve()` method calls `getCurrentTheme()` statically without creating reactive dependencies
2. **Missing DOM update verification**: Tests check that components build without errors but don't verify DOM mutations
3. **Incomplete reactive integration**: Some components create reactive effects but don't properly update mounted DOM elements
4. **Lack of integration tests**: No tests verify end-to-end reactive workflows (e.g., button click → state change → DOM update)

## Testing Strategy

### Test Categories

#### 1. Core Reactive Primitives Tests
**Purpose**: Ensure fundamental reactive system works correctly

**Test Matrix**:

| Primitive | Test Coverage |
|-----------|---------------|
| `createSignal` | Value updates, subscription, disposal |
| `createComputed` | Derived values, dependency tracking, nested computed |
| `createEffect` | Side effects execute, cleanup works, re-execution on deps change |
| `batch` | Multiple updates batched, single effect execution |
| `untrack` | Prevents dependency tracking |

**Critical Tests**:
- Signal updates trigger effect re-execution
- Computed values update when dependencies change
- Effects clean up properly on disposal
- Batch prevents multiple effect runs
- Memory leaks don't occur with long-lived signals

#### 2. Asset Reactivity Tests
**Purpose**: Ensure ColorAssets, ImageAssets, and FontAssets react to theme/state changes

**Test Matrix**:

| Asset Type | Static Value | Signal Value | Computed Value | Theme Changes | DOM Updates |
|------------|-------------|--------------|----------------|---------------|-------------|
| ColorAsset | ✓ | ✓ | ✓ | ✓ | ✓ |
| ImageAsset | ✓ | ✓ | ✓ | ✓ | ✓ |
| FontAsset | ✓ | ✓ | ✓ | N/A | ✓ |

**Critical Tests**:
- ColorAsset updates when theme signal changes (currently broken!)
- ColorAsset in modifiers (backgroundColor, foregroundColor) updates DOM
- ImageAsset src updates when theme changes
- FontAsset updates when font signal changes
- Multiple assets on same component all update correctly

**Implementation Requirements**:
```typescript
// ColorAsset needs to be reactive!
// Current: resolve() returns static value
// Needed: resolve() creates reactive dependency on theme signal

// Fix needed in ColorAsset.ts:
resolve(): string {
  // This should create a reactive dependency on theme!
  const currentTheme = getThemeSignal()() // Access signal reactively
  return currentTheme === 'dark' ? (this.dark || this.default) : (this.light || this.default)
}
```

#### 3. Show Component Tests
**Purpose**: Ensure conditional rendering reacts to signal changes and updates DOM

**Test Matrix**:

| Condition Type | Updates DOM | Fallback Works | Nested Show | With Modifiers | Button Toggle |
|----------------|-------------|----------------|-------------|----------------|---------------|
| Static boolean | N/A | ✓ | ✓ | ✓ | N/A |
| Signal | ✓ | ✓ | ✓ | ✓ | ✓ |
| Computed | ✓ | ✓ | ✓ | ✓ | ✓ |
| Function | ✓ | ✓ | ✓ | ✓ | ✓ |

**Critical Tests**:
- Show with signal condition updates DOM when signal changes
- Show fallback renders when condition becomes false
- Show inside Show (nested) works correctly
- Show with reactive modifiers on children works
- Button click toggles signal → Show updates DOM
- Multiple Show components with same signal all update
- Show component cleanup disposes effects properly

**Integration Test Example**:
```typescript
// Button toggles Show visibility
const [visible, setVisible] = createSignal(true)

const app = VStack(
  Button('Toggle').onClick(() => setVisible(!visible())),
  Show({
    when: visible,
    children: Text('Conditional Content')
  })
)

// Test: Click button → visible signal changes → Show updates DOM
```

#### 4. Modifier Reactivity Tests
**Purpose**: Ensure all modifiers work with signals and update DOM

**Test Matrix**:

| Modifier Category | Static | Signal | Computed | DOM Updates | Multi-Update |
|-------------------|--------|--------|----------|-------------|--------------|
| Color (foregroundColor, backgroundColor) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Layout (padding, margin, frame) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Typography (fontSize, fontWeight) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Appearance (opacity, cornerRadius) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Border (border, borderColor) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Transform (scaleEffect, rotationEffect) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Animation (animation, transition) | ✓ | ✓ | ✓ | ✓ | ✓ |

**Critical Tests**:
- Each modifier type updates DOM when signal changes
- Multiple reactive modifiers on same component all update
- Modifier chains with mixed static/reactive values work
- ColorAsset in modifier updates when theme changes
- Rapid signal changes don't cause visual glitches
- Old effect cleanup prevents memory leaks

#### 5. State Management Integration Tests
**Purpose**: Ensure state changes propagate through entire component tree

**Test Matrix**:

| Pattern | Signal Updates | Computed Derives | Effects Run | DOM Updates | Multi-Component |
|---------|----------------|------------------|-------------|-------------|-----------------|
| Local state | ✓ | ✓ | ✓ | ✓ | ✓ |
| Shared state | ✓ | ✓ | ✓ | ✓ | ✓ |
| Global state | ✓ | ✓ | ✓ | ✓ | ✓ |
| Context state | ✓ | ✓ | ✓ | ✓ | ✓ |
| Store pattern | ✓ | ✓ | ✓ | ✓ | ✓ |

**Critical Tests**:
- Button click updates signal → multiple components update
- Form input updates state → validation runs → UI updates
- Global state change updates all subscribers
- Computed values update when any dependency changes
- Effects run in correct order
- State updates batch correctly (no duplicate renders)

#### 6. Button Interaction Tests
**Purpose**: Ensure user interactions trigger reactive updates correctly

**Test Matrix**:

| Interaction | Signal Updates | Computed Recalc | DOM Updates | Show Toggle | Modifier Change |
|-------------|----------------|-----------------|-------------|-------------|-----------------|
| Click | ✓ | ✓ | ✓ | ✓ | ✓ |
| Double Click | ✓ | ✓ | ✓ | ✓ | ✓ |
| Long Press | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hover | ✓ | ✓ | ✓ | ✓ | ✓ |
| Focus | ✓ | ✓ | ✓ | ✓ | ✓ |

**Critical Tests**:
- Button onClick updates signal → Text content updates
- Button onClick toggles Show visibility
- Button onClick changes ColorAsset theme → colors update
- Button updates multiple signals → all deps update once (batched)
- Rapid button clicks handled correctly (debounced/throttled as needed)

#### 7. ForEach/For Component Tests
**Purpose**: Ensure list iteration reacts to data changes and updates DOM

**Test Matrix**:

| Scenario | Updates DOM | Fallback Works | With Show | Nested ForEach | Add/Remove Items |
|----------|-------------|----------------|-----------|----------------|------------------|
| Static array | N/A | ✓ | ✓ | ✓ | N/A |
| Signal array | ✓ | ✓ | ✓ | ✓ | ✓ |
| Computed array | ✓ | ✓ | ✓ | ✓ | ✓ |
| Object array (with keys) | ✓ | ✓ | ✓ | ✓ | ✓ |

**Critical Tests**:
- ForEach updates DOM when data signal changes
- ForEach adds/removes items from DOM correctly
- ForEach with fallback shows when array is empty
- ForEach inside Show (toggle list visibility)
- Show inside ForEach (conditional items)
- Nested ForEach components work correctly
- Button adds/removes items → ForEach updates DOM
- ForEach with key function tracks items correctly
- Multiple ForEach components with same data signal sync

**Integration Test Example**:
```typescript
// Button adds items to list
const [items, setItems] = createSignal(['item1'])

const app = VStack(
  Button('Add Item').onClick(() =>
    setItems([...items(), `item${items().length + 1}`])
  ),
  ForEach({
    data: items,
    children: (item) => Text(item)
  })
)

// Test: Click button → items signal updates → ForEach adds item to DOM
```

#### 8. Form Reactivity Tests
**Purpose**: Ensure form fields, validation, and state management are reactive

**Test Matrix**:

| Pattern | Input Updates | Validation Runs | Error Display | Submit Handler | Multi-Field |
|---------|---------------|-----------------|---------------|----------------|-------------|
| TextField | ✓ | ✓ | ✓ | ✓ | ✓ |
| NumberField | ✓ | ✓ | ✓ | ✓ | ✓ |
| Checkbox | ✓ | ✓ | ✓ | ✓ | ✓ |
| Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| DatePicker | ✓ | ✓ | ✓ | ✓ | ✓ |

**Critical Tests**:
- Text input updates field signal
- Field signal updates cause validation to run
- Validation errors display in UI reactively
- Cross-field validation (e.g., password confirmation)
- Form submission with reactive state
- Disabled state updates reactively
- Required field indicator updates
- Form reset clears all reactive fields
- Conditional fields (show/hide based on other fields)
- Real-time validation as user types

**Integration Test Example**:
```typescript
// Email validation updates error message
const [email, setEmail] = createSignal('')
const [emailError, setEmailError] = createSignal('')

const isValidEmail = createComputed(() => {
  const valid = email().includes('@')
  setEmailError(valid ? '' : 'Invalid email')
  return valid
})

const form = Form({
  children: VStack(
    TextField({
      name: 'email',
      value: email,
      onChange: (_, val) => setEmail(val)
    }),
    Show({
      when: () => emailError().length > 0,
      children: Text(() => emailError()).modifier.foregroundColor('#ff0000')
    })
  )
})

// Test: Type invalid email → validation runs → error shows
// Test: Type valid email → validation runs → error hides
```

#### 9. List/Data Component Tests
**Purpose**: Ensure large data lists update efficiently

**Test Matrix**:

| Scenario | Items Update | Virtual Scroll | Infinite Scroll | Pull to Refresh | Sort/Filter |
|----------|--------------|----------------|-----------------|-----------------|-------------|
| Small list (< 50) | ✓ | N/A | ✓ | ✓ | ✓ |
| Medium list (50-500) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Large list (> 500) | ✓ | ✓ | ✓ | ✓ | ✓ |

**Critical Tests**:
- List data signal updates re-render items
- List efficiently updates (only changed items, not full re-render)
- Virtual scrolling renders only visible items
- Adding items updates DOM without flickering
- Removing items updates DOM smoothly
- Sorting list updates DOM order
- Filtering list shows/hides items
- Infinite scroll loads more data on scroll
- Pull to refresh updates data
- List with ForEach children updates correctly

#### 10. Component-Specific Tests
**Purpose**: Test reactivity in specific component implementations

**Components to Test**:
- Text (content, color, font signals)
- Button (label, disabled state, style signals)
- Image (src, width, height signals)
- VStack/HStack (spacing, alignment signals)
- ZStack (children, alignment signals)
- Symbol (name, variant, color signals)
- TextField (value, placeholder, disabled signals)
- Form (state, validation, submission signals)

**Critical Tests**:
- Each component updates when prop signals change
- Nested components update correctly
- Components with multiple reactive props all update
- Components cleanup effects on unmount

#### 11. Theme Integration Tests
**Purpose**: Ensure theme changes propagate to all ColorAssets

**Test Matrix**:

| Scenario | Assets Update | Modifiers Update | Components Update | Nested Assets |
|----------|---------------|------------------|-------------------|---------------|
| setTheme('dark') | ✓ | ✓ | ✓ | ✓ |
| setTheme('light') | ✓ | ✓ | ✓ | ✓ |
| Custom theme | ✓ | ✓ | ✓ | ✓ |
| System theme detect | ✓ | ✓ | ✓ | ✓ |

**Critical Tests**:
- setTheme() updates all ColorAssets
- Theme toggle button changes entire app
- Dark mode switch updates all colors instantly
- ColorAssets in deeply nested components update
- Multiple ColorAssets update without performance issues

#### 12. Performance Tests
**Purpose**: Ensure reactive updates are efficient

**Test Matrix**:

| Scenario | Update Time | Effect Count | Memory Usage | No Leaks |
|----------|-------------|--------------|--------------|----------|
| Single signal → 1 effect | < 1ms | 1 | Minimal | ✓ |
| Single signal → 10 effects | < 5ms | 10 | Minimal | ✓ |
| Single signal → 100 effects | < 20ms | 100 | Acceptable | ✓ |
| 10 signals update (batched) | < 5ms | 1 effect run | Minimal | ✓ |
| Rapid updates (100/sec) | No lag | Throttled | Stable | ✓ |

**Critical Tests**:
- Effect deduplication works (same effect not run multiple times in batch)
- Memory doesn't grow with repeated updates
- Disposed effects don't leak
- Large lists update efficiently (virtual scrolling)

## Test Implementation Guide

### Test Structure

Each test file should follow this structure:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createSignal, createEffect } from '@tachui/core'
import { DOMRenderer } from '@tachui/core'

describe('Component Reactivity', () => {
  let container: HTMLElement
  let renderer: DOMRenderer
  let cleanups: (() => void)[]

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    renderer = new DOMRenderer()
    cleanups = []
  })

  afterEach(() => {
    cleanups.forEach(fn => fn())
    container.remove()
  })

  it('should update DOM when signal changes', async () => {
    // 1. Create reactive state
    const [count, setCount] = createSignal(0)

    // 2. Create component with reactive prop
    const component = Text(() => `Count: ${count()}`)
      .modifier.build()

    // 3. Render to DOM
    const node = component.render()[0]
    const element = renderer.render(node)
    container.appendChild(element)

    // 4. Verify initial state
    expect(element.textContent).toBe('Count: 0')

    // 5. Update signal
    setCount(1)

    // 6. Wait for reactive update
    await waitForReactiveUpdate()

    // 7. Verify DOM updated
    expect(element.textContent).toBe('Count: 1')
  })
})

// Helper to wait for reactive updates
function waitForReactiveUpdate(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}
```

### Key Testing Patterns

#### Pattern 1: Signal → DOM Update
```typescript
it('updates DOM when signal changes', async () => {
  const [value, setValue] = createSignal('initial')
  const component = Text(value)

  // Render
  const element = renderToDOM(component)
  expect(element.textContent).toBe('initial')

  // Update
  setValue('updated')
  await waitForUpdate()

  // Verify
  expect(element.textContent).toBe('updated')
})
```

#### Pattern 2: Computed → DOM Update
```typescript
it('updates DOM when computed changes', async () => {
  const [count, setCount] = createSignal(0)
  const doubled = createComputed(() => count() * 2)
  const component = Text(() => `Result: ${doubled()}`)

  const element = renderToDOM(component)
  expect(element.textContent).toBe('Result: 0')

  setCount(5)
  await waitForUpdate()

  expect(element.textContent).toBe('Result: 10')
})
```

#### Pattern 3: Button → Signal → DOM
```typescript
it('button click updates DOM via signal', async () => {
  const [visible, setVisible] = createSignal(true)

  const app = VStack(
    Button('Toggle').onClick(() => setVisible(!visible())),
    Show({ when: visible, children: Text('Content') })
  )

  const element = renderToDOM(app)
  const button = element.querySelector('button')
  const content = element.textContent

  expect(content).toContain('Content')

  button.click()
  await waitForUpdate()

  expect(element.textContent).not.toContain('Content')
})
```

#### Pattern 4: Theme → ColorAsset → DOM
```typescript
it('theme change updates ColorAsset in DOM', async () => {
  const primaryColor = ColorAsset.init({
    name: 'primary',
    default: '#000',
    light: '#000',
    dark: '#fff'
  })

  const component = Text('Hello')
    .modifier.foregroundColor(primaryColor)
    .build()

  const element = renderToDOM(component)
  setTheme('light')
  await waitForUpdate()

  expect(element.style.color).toBe('rgb(0, 0, 0)')

  setTheme('dark')
  await waitForUpdate()

  expect(element.style.color).toBe('rgb(255, 255, 255)')
})
```

## Critical Fixes Needed

### 1. ColorAsset Reactivity (HIGH PRIORITY)

**Current Issue**: ColorAsset.resolve() doesn't create reactive dependency

**Location**: `packages/core/src/assets/ColorAsset.ts:200`

**Fix**:
```typescript
// BEFORE (not reactive):
resolve(): string {
  const currentTheme = ColorAsset.getCurrentTheme()
  // ...
}

// AFTER (reactive):
import { getThemeSignal } from '../reactive/theme'

resolve(): string {
  // Access theme signal to create reactive dependency
  const currentTheme = getThemeSignal()()

  if (currentTheme === 'dark') {
    return this.dark || this.default
  } else {
    return this.light || this.default
  }
}
```

### 2. Show Component DOM Updates

**Current Issue**: Show component creates reactive container but DOM updates may not propagate

**Location**: `packages/flow-control/src/conditional/Show.ts:106`

**Verification Needed**: Test that the `updateContainerDOM` method is called when signal changes

**Potential Fix**: Ensure effect runs in proper reactive context and DOM updates are scheduled correctly

### 3. Modifier Reactivity

**Current Issue**: Some modifiers may not set up reactive effects for signal props

**Location**: Various modifier files in `packages/core/src/modifiers/`

**Fix Pattern**: Each modifier should check if prop is signal/computed and set up effect:
```typescript
// In modifier apply():
if (isSignal(color) || isComputed(color)) {
  const effect = createEffect(() => {
    element.style.color = resolveColor(color())
  })
  context.cleanup.push(() => effect.dispose())
} else {
  element.style.color = resolveColor(color)
}
```

## Test Execution Plan

### Phase 1: Core Reactive Primitives (Week 1)
- [ ] Test createSignal
- [ ] Test createComputed
- [ ] Test createEffect
- [ ] Test batch and untrack
- [ ] Test cleanup and disposal

### Phase 2: Asset Reactivity (Week 1-2)
- [ ] Fix ColorAsset to be reactive
- [ ] Test ColorAsset theme changes
- [ ] Test ImageAsset reactivity
- [ ] Test FontAsset reactivity
- [ ] Test assets in modifiers

### Phase 3: Component Reactivity (Week 2)
- [ ] Test Show component updates
- [ ] Test ForEach component updates
- [ ] Test Text component updates
- [ ] Test Button component updates
- [ ] Test Stack component updates

### Phase 4: ForEach/Show Integration (Week 2)
- [ ] Test ForEach inside Show (toggle list visibility)
- [ ] Test Show inside ForEach (conditional items)
- [ ] Test nested ForEach components
- [ ] Test ForEach add/remove items with buttons
- [ ] Test ForEach with fallback content

### Phase 5: Form Reactivity (Week 2-3)
- [ ] Test TextField reactive updates
- [ ] Test form validation reactivity
- [ ] Test error message display
- [ ] Test cross-field validation
- [ ] Test conditional form fields
- [ ] Test form submission with reactive state

### Phase 6: Data/List Component Reactivity (Week 3)
- [ ] Test List component data updates
- [ ] Test virtual scrolling
- [ ] Test infinite scroll
- [ ] Test list sort/filter operations
- [ ] Test List with ForEach integration

### Phase 7: Modifier Reactivity (Week 3)
- [ ] Test color modifiers
- [ ] Test layout modifiers
- [ ] Test appearance modifiers
- [ ] Test border modifiers
- [ ] Test transform modifiers

### Phase 8: Integration Tests (Week 3-4)
- [ ] Test button → state → DOM flow
- [ ] Test form → validation → UI flow
- [ ] Test theme toggle → assets flow
- [ ] Test complex nested components
- [ ] Test multiple signals updating
- [ ] Test ForEach + Show + Form integration

### Phase 9: Performance Tests (Week 4)
- [ ] Test effect deduplication
- [ ] Test memory leaks
- [ ] Test large lists
- [ ] Test rapid updates
- [ ] Test batch optimization

## Success Criteria

The testing plan is successful when:

1. ✅ All ColorAssets update when theme changes
2. ✅ Show component visibility toggles work with button clicks
3. ✅ State changes propagate to all dependent components
4. ✅ DOM updates are verified in all tests (not just "doesn't throw")
5. ✅ No memory leaks with long-running reactive updates
6. ✅ Performance tests pass (< 16ms for typical updates)
7. ✅ 100% coverage of reactive integration points
8. ✅ Continuous integration runs all tests on every PR

## Maintenance

### Regression Prevention

**Rule**: Every new component or modifier MUST include reactivity tests covering:
1. Static value works
2. Signal value works and updates DOM
3. Computed value works and updates DOM
4. Cleanup disposes effects
5. Integration with other reactive components

### Test Template

```typescript
// Template for new component reactive tests
describe('NewComponent Reactivity', () => {
  it('renders with static props', () => {
    const component = NewComponent({ prop: 'static' })
    expect(component.render()).toBeDefined()
  })

  it('renders with signal props', () => {
    const [prop, setProp] = createSignal('initial')
    const component = NewComponent({ prop })
    expect(component.render()).toBeDefined()
  })

  it('updates DOM when signal changes', async () => {
    const [prop, setProp] = createSignal('initial')
    const component = NewComponent({ prop })
    const element = renderToDOM(component)

    setProp('updated')
    await waitForUpdate()

    expect(element).toContainText('updated')
  })

  it('cleans up effects on disposal', () => {
    const [prop] = createSignal('value')
    const component = NewComponent({ prop })
    component.render()

    expect(() => component.dispose()).not.toThrow()
    // Verify no memory leaks
  })
})
```

## Monitoring and Metrics

### Test Metrics to Track
- Total reactive tests count
- Reactive test coverage percentage
- DOM update verification percentage
- Average test execution time
- Memory leak test failures

### CI/CD Integration
- All reactive tests run on every commit
- Performance regression alerts if tests slow down > 20%
- Memory leak detection in CI
- Visual regression testing for theme changes

## Conclusion

This comprehensive testing plan ensures that the TachUI reactive system works correctly in all scenarios. By following this plan, the framework will have reliable, predictable reactive updates that developers can trust.

**Key Takeaways**:
1. Fix ColorAsset to be reactive (critical!)
2. Add DOM update verification to all tests
3. Test integration flows (button → state → DOM)
4. Prevent regressions with mandatory reactivity tests for new components
5. Monitor performance and memory usage continuously
