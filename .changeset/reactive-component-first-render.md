---
'@tachui/core': patch
---

Fix `createReactiveComponent` skipping its first render (#238): the props-tracking effects were created *inside* the render function, so they re-ran on every pass and re-captured `previousProps` before the `shouldUpdate` guard evaluated. The guard therefore compared the props to themselves and returned an empty render result.

The lifecycle tracking effects are now created once per instance, and `previousProps` is snapshotted after a successful render rather than mid-pass. `previousProps` is `undefined` on the first pass, so the guard naturally applies to re-renders only and the first render always executes.

This also fixes two consequences of the per-render effect creation: effects accumulated on every render pass without ever being disposed, and each new effect fired `onUpdate` against the snapshot the previous one had just written — so `onUpdate` was called on every render even when no prop had changed.
