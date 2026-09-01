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

`@tachui/core/runtime` was added to the package's Rollup externals. Without it the renderer was inlined into the modifiers bundle, which would have given the package its own `globalRenderer` separate from the app's.
