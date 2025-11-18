# Phase 0: Component Clone Implementation Audit

**Date**: 2025-10-21
**Purpose**: Audit existing components to understand clone() implementation requirements
**Related**: SwiftModifiers-Implementation-Plan.md Phase 2

## Overview

This document audits all existing component classes to determine what needs to be cloned (shallow vs deep) for each component type. The new proxy-based modifier system requires components to support `clone()` for modifier chaining that creates branches.

## Component Base Classes

### ComponentWithCSSClasses

**Location**: `packages/core/src/css-classes/component-base.ts`

**Inherits**: None (base class)

**Properties**:
- No instance properties (just methods)

**Clone Requirements**:
- ✅ **No cloning needed** - This is a utility base class with only methods

---

## Layout Components

### LayoutComponent

**Location**: `packages/primitives/src/layout/Stack.ts:92-436`

**Inherits**: `ComponentWithCSSClasses`

**Instance Properties**:
```typescript
{
  type: 'component' as const,           // Immutable constant
  id: string,                            // Should be preserved (shallow)
  mounted: boolean,                      // Should reset to false
  cleanup: (() => void)[],               // Should be new empty array
  props: ComponentProps & ...,           // Should deep clone (contains objects)
  layoutType: 'vstack'|'hstack'|'zstack', // Immutable (shallow)
  children: ComponentInstance[],         // Should deep clone (array of objects)
  layoutProps: any,                      // Should deep clone (object)
  effectiveTag: string,                  // Immutable (shallow)
}
```

**Clone Strategy**:
- **Shallow Clone**: `id`, `type`, `layoutType`, `effectiveTag`
- **Reset**: `mounted` → `false`, `cleanup` → `[]`
- **Deep Clone**: `props`, `children`, `layoutProps`

**Special Considerations**:
- Children array must be deep cloned (clone each child component)
- DOM-related properties (`domElements`, `domReady`, `primaryElement`) should not be copied
- Lifecycle hooks need special handling

**Estimated Complexity**: 🟡 Medium (20-30 min)
- Deep clone children array
- Handle lifecycle state reset

---

## Display Components

### EnhancedText

**Location**: `packages/primitives/src/display/Text.ts:142-220`

**Inherits**: `ComponentWithCSSClasses`, implements `Concatenatable`

**Instance Properties**:
```typescript
{
  type: 'component' as const,      // Immutable constant
  id: string,                       // Should be preserved (shallow)
  mounted: boolean,                 // Should reset to false
  cleanup: (() => void)[],          // Should be new empty array
  props: TextProps,                 // Should deep clone
  effectiveTag: string,             // Immutable (shallow)
  validationResult: any,            // Should deep clone (object)
}
```

**Clone Strategy**:
- **Shallow Clone**: `id`, `type`, `effectiveTag`
- **Reset**: `mounted` → `false`, `cleanup` → `[]`
- **Deep Clone**: `props`, `validationResult`

**Special Considerations**:
- Props may contain signals (should preserve references, not deep clone)
- `content` prop can be string | Signal | function
- Font assets should preserve references

**Estimated Complexity**: 🟢 Simple (10-15 min)
- Simple props structure
- No child components

---

### EnhancedImage

**Location**: `packages/primitives/src/display/Image.ts` (not shown in excerpts)

**Expected Properties** (inferred):
```typescript
{
  type: 'component',
  id: string,
  mounted: boolean,
  cleanup: (() => void)[],
  props: ImageProps,
  effectiveTag: string,
}
```

**Clone Strategy**:
- **Similar to EnhancedText** (simple component)

**Estimated Complexity**: 🟢 Simple (10-15 min)

---

## Control Components

### EnhancedButton

**Location**: `packages/primitives/src/controls/Button.ts:160-827`

**Inherits**: `ComponentWithCSSClasses`, implements `Concatenatable`

**Instance Properties**:
```typescript
{
  type: 'component' as const,        // Immutable constant
  id: string,                         // Should be preserved (shallow)
  mounted: boolean,                   // Should reset to false
  cleanup: (() => void)[],            // Should be new empty array
  props: ButtonProps,                 // Should deep clone
  stateSignal: () => ButtonState,     // **SPECIAL**: Should create new signal
  setState: (value: ButtonState) => void, // **SPECIAL**: New setter for new signal
  theme: ButtonTheme,                 // Should preserve reference (shared theme)
}
```

**Clone Strategy**:
- **Shallow Clone**: `id`, `type`
- **Reset**: `mounted` → `false`, `cleanup` → `[]`
- **Deep Clone**: `props`
- **Preserve Reference**: `theme` (shared configuration)
- **Special**: Create new `stateSignal` and `setState` via `createSignal()`

**Special Considerations**:
- **Critical**: Must create new reactive state signal (not share with original)
- Props may contain signals (`title`, `isEnabled`, `isLoading`) - preserve references
- Props may contain ColorAssets - preserve references
- DOM event listeners managed via lifecycle hooks (handled by reset cleanup)

**Estimated Complexity**: 🔴 Complex (30-45 min)
- Reactive state management
- Signal handling
- Multiple prop types (signals, assets, functions)

---

## Grid Components

### GridComponent

**Location**: `packages/grid/src/components/Grid.ts` (not read yet)

**Expected Complexity**: 🔴 Complex
- Multiple children
- Complex layout algorithms
- Grid-specific properties

**Estimated Time**: 30-45 min (needs further investigation)

---

## Summary of Clone Requirements

### Clone Patterns by Component Type

| Component Type | Shallow Props | Deep Props | Special Handling | Complexity | Time Est. |
|----------------|---------------|------------|------------------|------------|-----------|
| LayoutComponent | id, type, layoutType, effectiveTag | props, children[], layoutProps | Deep clone children | 🟡 Medium | 20-30 min |
| EnhancedText | id, type, effectiveTag | props, validationResult | Preserve signal refs | 🟢 Simple | 10-15 min |
| EnhancedButton | id, type, theme (ref) | props | Create new state signal | 🔴 Complex | 30-45 min |
| EnhancedImage | id, type, effectiveTag | props | Preserve asset refs | 🟢 Simple | 10-15 min |
| GridComponent | TBD | TBD | TBD | 🔴 Complex | 30-45 min |

### Common Patterns

#### Always Reset
```typescript
{
  mounted: false,
  cleanup: [],
  domElements: undefined,
  domReady: false,
  primaryElement: undefined
}
```

#### Always Shallow Clone
```typescript
{
  id,          // Preserve component identity
  type,        // Constant anyway
}
```

#### Signal Handling Rules
1. **Signal Props**: Preserve references (don't clone signals themselves)
   ```typescript
   // ✅ Correct
   clonedProps.title = this.props.title // Signal reference preserved

   // ❌ Wrong
   clonedProps.title = createSignal(this.props.title()) // Creates new signal!
   ```

2. **Internal State Signals**: Create new instances
   ```typescript
   // ✅ Correct (Button)
   const [stateSignal, setState] = createSignal<ButtonState>('normal')

   // ❌ Wrong (Button)
   stateSignal = this.stateSignal // Shares state with original!
   ```

#### Asset Handling Rules
1. **Asset Props**: Preserve references (assets are immutable)
   ```typescript
   // ✅ Correct
   clonedProps.backgroundColor = this.props.backgroundColor // ColorAsset reference

   // ❌ Wrong
   clonedProps.backgroundColor = new ColorAsset(...) // Unnecessary copy
   ```

### Helper Functions Needed

```typescript
/**
 * Deep clone props object, preserving signal and asset references
 */
function clonePropsPreservingReactivity<T>(props: T): T {
  const cloned = {} as T

  for (const [key, value] of Object.entries(props)) {
    if (isSignal(value) || isAsset(value)) {
      // Preserve reference to reactive values
      cloned[key as keyof T] = value
    } else if (Array.isArray(value)) {
      // Deep clone arrays
      cloned[key as keyof T] = value.map(item =>
        isComponent(item) ? item.clone() : item
      ) as any
    } else if (typeof value === 'object' && value !== null) {
      // Deep clone plain objects
      cloned[key as keyof T] = { ...value } as any
    } else {
      // Primitive values (shallow copy)
      cloned[key as keyof T] = value
    }
  }

  return cloned
}
```

## Total Effort Estimate

### Core Components (Must Implement)
- LayoutComponent: 20-30 min
- EnhancedText: 10-15 min
- EnhancedButton: 30-45 min
- EnhancedImage: 10-15 min

**Total**: 70-105 minutes (1-2 hours)

### Additional Components (Nice to Have)
- Grid: 30-45 min
- ScrollView: 15-20 min
- Divider: 5-10 min

**Total with extras**: 120-180 minutes (2-3 hours)

## Next Steps

1. ✅ Complete audit
2. ⏳ Draft reference implementations
3. ⏳ Create helper utilities (`clonePropsPreservingReactivity`)
4. ⏳ Add `clone()` method to base class or interface
5. ⏳ Implement for each component type
6. ⏳ Add clone tests

## Notes

- **Mutation Strategy**: Current implementation mutates by default. Clone is opt-in via `.clone()` method.
- **Performance**: Cloning should be lazy (only when `.clone()` is called)
- **Testing**: Each clone implementation needs tests to verify:
  - Cloned component is independent
  - Signals/assets are preserved correctly
  - DOM state is reset
  - Children are deep cloned

---

**Audit Completed**: 2025-10-21
**Next Phase**: Draft reference implementations
**Owner**: Implementation Team
