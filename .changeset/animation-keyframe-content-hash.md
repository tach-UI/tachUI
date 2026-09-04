---
'@tachui/core': patch
'@tachui/modifiers': patch
---

Name animation keyframes from their content, so they stop accumulating and SSR agrees with the client.

`AnimationModifier` derived its `@keyframes` name from `componentId` and `Date.now()`, which minted a fresh name on every apply. Because `addKeyframesToStylesheet` appended to the shared `<style id="tachui-animations">` without deduping or cleanup, every re-render of an animated component left another block behind — five renders of one component produced five blocks — and the element moved to the newest name, so the earlier blocks were dead weight the browser still parsed. Nothing removed them on unmount.

The same scheme also made the prerendered CSS unusable: `getStaticCSS` named from the selector while `apply` named from the clock, so the server's `@keyframes` was always orphaned and the client always re-injected its own.

Names are now a hash of the keyframes' own content, via the new `createAnimationKeyframeRule` and `ensureAnimationKeyframes` exports on `@tachui/core/modifiers/base`. Identical keyframes resolve to one name and one block across renders, across components, and across server and client. Duration, easing, iteration count and direction are excluded from the hash — they belong to the element's `animation` shorthand rather than the keyframes block — so components sharing a keyframes object at different speeds share one block. The set of injected names is tracked on the stylesheet element under a registered symbol, so it is discarded exactly when the element is and is shared by all three `AnimationModifier` copies (`@tachui/core` plus both `@tachui/modifiers` builds) that write to it.

Because content hashing makes a name a reliable statement about a block's contents, the client now also adopts animation keyframes it finds already in the document rather than duplicating them. `@tachui/ssr` emits each static rule in its own anonymous `<style>` rather than into `#tachui-animations`, so prerendered blocks were still being re-injected on hydration even once the names agreed.

**Breaking for deep importers of `@tachui/core/modifiers/base`**, which is a published subpath export and so reaches beyond this repo: `collectStaticAnimationCSSRules` no longer takes a `createKeyframeRule` callback, deriving the name itself. Emitted keyframe names also change shape, from `tachui-animation-<componentId>-<timestamp>` and `tachui-animation-<selector>` to `tachui-animation-<hash>`. Nothing should depend on the old spelling — the client's was unpredictable by construction — but anything asserting on a literal keyframe name needs updating.
