---
'@tachui/modifiers': patch
---

Render `overlay()` content instead of an empty container (#302).

`overlay()` built its absolutely-positioned container, positioned it correctly, and then rendered nothing inside it. Every content form was dropped: a plain string, a `ComponentInstance`, a `.build()`-ed component, and a content closure all produced `<div style="position: absolute; ...">` with no children.

The cause was `renderContent` reading `component.render().element`. A component's `render()` returns DOMNode *descriptions*; `element` is populated by the renderer when the node is mounted, so it is always `undefined` on a freshly rendered node. Strings were never handled at all. Content now goes through `renderComponent`, which materializes the nodes, builds an unbuilt modifier chain, and keeps the content reactive.

```typescript
Text('base').overlay(Text('D'), 'bottomTrailing')
// before: <div style="position: absolute; bottom: 0px; right: 0px;"></div>
// after:  <div style="position: absolute; bottom: 0px; right: 0px;"><span>D</span></div>
```

Accepted content, matching SwiftUI's `.overlay(alignment:content:)`:

- a `ComponentInstance`, built or not
- a content closure, `() => Text('D')`
- a `string` or `number`, rendered as text
- a `Signal<string | number>`, rendered as reactive text
- a DOM `Element`

`OverlayOptions['content']` and the `overlay()` parameter were typed `any`; they are now `OverlayContent`, so an unsupported form is a compile error rather than a silent empty overlay.

`apply()` now returns a `ModifierResult` carrying cleanup. The positioning effect was previously created and never disposed, and the overlay container was never removed; both are now torn down with the modifier.

Overlays are also reconciled per render pass. `renderSingle` applies modifiers on every render of a node, not only when the element is created, so a base component that re-renders drives `apply()` again on the same element — and the pipeline's cleanup does not run until unmount. Each pass therefore appended another container and left the previous one behind. That accumulation predates this change, but was invisible while the containers were empty; now that they hold content it would have shown as duplicate, stale layers.

Bookkeeping is owned by the element rather than the modifier, because a component that builds its chain inline — `Text(label()).overlay(badge)` inside a parent's render — produces a fresh modifier instance on every pass while the renderer reuses the element. A pass boundary is detected from the `ModifierContext` identity, which `applyModifiersToNode` creates once per element render and shares across that pass's modifiers. Entering a new pass disposes what the previous one mounted; the modifiers still in the chain re-mount.

A pass in which *no* overlay modifier runs — the last overlay leaving the chain — cannot be seen that way, since the reconciliation is only ever driven from `apply()`. Modifiers are applied inside the render effect's body, so each mount also registers an execution-scoped cleanup (#270), which runs just before that effect's next execution whether or not an overlay applies on it. Outside a computation this degrades to owner-scoped and then to a no-op, and the pass reconciliation covers those paths; both routes end at the same idempotent disposer.

Cleanup is handed back once per element rather than once per apply. The pipeline chains every returned cleanup onto `node.dispose` and pushes it onto the element's cleanup list without dropping the previous one, so a long-lived reactive overlay would otherwise accumulate stale teardowns and replay them all at unmount.

`@tachui/core/runtime` was added to the package's Rollup externals. Without it the renderer was inlined into the modifiers bundle, which would have given the package its own `globalRenderer` separate from the app's.
