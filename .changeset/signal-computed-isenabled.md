---
"@tachui/core": minor
"@tachui/primitives": patch
"@tachui/forms": patch
"@tachui/navigation": patch
"@tachui/data": patch
"@tachui/mobile": patch
"@tachui/modifiers": patch
"@tachui/grid": patch
---

`isSignal` now recognises a computed, and `Button`'s `isEnabled` follows a
signal.

`createSignal` marks its accessor `tachui.signal` and `createComputed` marks
its own `tachui.computed`, but `isSignal` looked only for the first — so a
computed failed the guard for the `Signal` type it satisfies. That is not a
narrow miss. The standard `isSignal(x) ? x() : x` split then passes the
*function* on as if it were a value, so a prop reads as permanently truthy, a
style is set to a function, and nothing subscribes.

**This changes runtime behaviour wherever that split appears, which is roughly a
hundred call sites** — `Stepper`, `DatePicker`, `Picker`, `TextField` and
`Slider` in forms; `tab-view`, `navigation-link` and the navigation modifiers;
`List` and `Menu` in data; `Alert` and `ActionSheet` in mobile; and reactive
class handling in modifiers and grid. A prop that accepts `boolean | Signal`
and was handed a computed now honours it. `isSignal` is public API and this
widens what it accepts deliberately, hence a minor rather than a patch on core.

`NavigationLink` is the one place where widening did more than fix a split. Its
`isActive` handling intercepts the *write* that sets the value true, navigates,
and sets it back to false. A computed has no write to intercept, and the
fallback path it now reaches would navigate the moment the value was truthy —
on mount, and again on every recomputation, with nothing able to reset it. A
source with no settable implementation behind it is no longer driven from
there.

`Button.isEnabled()` returned the signal itself rather than its value, which
made every consumer wrong the same way: `if (!isEnabled)` on a function is
never true, so the press guard never fired and `getButtonStyles` computed its
disabled appearance from a truthy function. It resolves now, the way
`isLoading` already did.

`disabled` reaches the renderer as an inverted signal, built fresh on each
render. Identity matters as much as value: a render runs inside an effect, so
an enclosing component re-rendering for any reason disposes that scope and
takes the renderer's subscription with it, and the renderer diffs props by
identity — a cached accessor would be recognised, skipped, and never
resubscribed. Where a render has no owner at all, which is the direct mount
path behind sheets, popovers and split views, `disabled` is a plain value
instead: nothing there disposes what a render creates, so a subscription made
in that path would be held for the life of the process, one per mount.

The click handler also declines while disabled **or loading**. A disabled
button suppresses clicks natively in a browser but not in every environment,
and `handlePress` has always refused a press while loading — so a click and a
press could disagree about whether a loading button acts. They no longer do.

What this does **not** fix: a disabled Button still does not *look* disabled.
`getButtonStyles` computes the right values now, but neither path applies them
— the reactive style effect runs on DOM-ready, which the ordinary render path
never fires, and on the mount path the style application skips any property
that already has a value. The attribute, the action gating and the accessible
state are fixed; the appearance is not.

The other half of the report — signal-driven style modifier values reading once
— was not reproducible: effects flush on a microtask, so a read in the same
task as the write is stale by design. Nothing pinned it either way, which is
why it was plausible enough to report, so `foregroundColor` and
`backgroundColor` now carry signal-update tests.

`clone-helpers` drops a local `isSignal` that tested for a `.set` no signal
accessor has ever had. It matched nothing, and signals reached the generic
branch that passes functions through by reference — the right answer for no
reason.
