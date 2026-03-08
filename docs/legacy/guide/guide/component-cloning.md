# Component Cloning Guide

TachUI components implement a consistent cloning API so you can duplicate complex views without losing reactivity, modifier state, or lifecycle hooks. This guide covers when to clone, how the cloning helpers work, and patterns that keep cloned trees maintainable.

## When to Clone

Cloning is handy when:

- You want to reuse a “template” component with small visual tweaks (for example, two cards that only differ in modifiers).
- A layout factory returns a base instance that downstream code should customise without mutating the original.
- You need a snapshot of a component’s current props and signals before applying additional modifiers.

Because cloning preserves signals via `clonePropsPreservingReactivity`, derived state continues to update normally in each clone.

## CloneableComponent Contract

All core and primitives components implement [`CloneableComponent`](../../../packages/core/src/runtime/types.ts), which provides:

- `clone(options?: CloneOptions): this` — shallow clone that copies props and lifts modifiers to the new instance.
- `deepClone(options?: CloneOptions): this` — deep clone that recursively clones child components.
- Optional `syncStateToClone()` for components with internal state (for example, `Button`) to copy reactive signals.

Wrapping custom components with `withModifiers` automatically returns a modifiable clone that keeps the modifier proxy intact.

```ts
const baseButton = Button('Continue')
  .padding({ vertical: 8, horizontal: 16 })
  .cornerRadius(12)

const destructive = baseButton.clone().backgroundColor('#EF4444')
const subtle = baseButton.clone().backgroundColor('#F3F4F6')
```

Both clones still respond to reactive changes coming from signals passed to the original props.

## Shallow vs Deep Clones

- **`clone()`** copies props and modifiers but keeps child component references intact. Use this when you only need to tweak top-level modifiers.
- **`deepClone()`** traverses child components and ensures each nested component receives its own cloned instance. Use this when the view tree branches (for example, a `VStack` with nested `Button`s) and you need independent modifier chains per leaf.

```ts
const stacked = VStack({
  spacing: 12,
  children: [Text('Primary'), Text('Secondary')],
})

const customised = stacked.deepClone().children.map(child =>
  child.clone().padding(4),
)
```

## Best Practices

- **Avoid manual object spreads.** Cloning already leverages `clonePropsPreservingReactivity` to keep signals live. Reassigning `component.props = {...}` skips lifecycle reset and will break modifier reconciliation.
- **Update the clone, never the original.** Treat the source component as immutable to keep the tree predictable. If you need “base styles”, export a factory function that builds a fresh component each time.
- **Reset lifecycle when extending classes.** If you implement a custom component class, call `resetLifecycleState` inside your custom `clone()`/`deepClone()` implementations (the helpers in `ComponentWithCSSClasses` already do this).
- **Keep IDs unique when required.** The framework generates IDs automatically via `Date.now()` + a random suffix. If you rely on deterministic IDs (for testing), pass a new `id` through `CloneOptions`.

## Working With Modifiers After Cloning

Cloned components retain the modifier proxy so chained modifiers behave identically:

```ts
const card = VStack({ children: [Text('Balance')] })
  .padding(16)
  .backgroundColor('#111827')

const compact = card.clone().padding(12)
const warning = card.clone().backgroundColor('#DC2626').foregroundColor('#FFF')
```

Because modifiers are applied through `ModifierBuilderImpl`, each clone keeps its own modifier list—there is no accidental sharing between siblings.

## Debugging Cloning Issues

- Inspect `component.modifiers` to check which modifiers were applied to the current instance.
- Keep `SECURITY_DEV_MODE` enabled (default) so the runtime logs warnings if a component is cloned without re-registering metadata.
- If a clone appears “stale”, verify that you did not mutate the original component between creating the clone and rendering the result.

With these patterns, cloning becomes a lightweight way to compose reusable UI primitives without building the same modifier chain over and over.
