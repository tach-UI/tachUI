---
'@tachui/core': patch
---

Fix `createReactiveComponent` skipping its first render (#238): the props-tracking effect captured `previousProps` before the `shouldUpdate` guard evaluated, so the guard compared the props to themselves and returned an empty render result. The `shouldUpdate` check is now gated on a `hasRendered` flag and only applies from the second render pass onward.
