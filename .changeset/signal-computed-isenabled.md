---
"@tachui/core": patch
"@tachui/primitives": patch
---

`isSignal` now recognises a computed, and `Button`'s `isEnabled` follows a
signal.

`createSignal` marks its accessor `tachui.signal` and `createComputed` marks
its own `tachui.computed`, but `isSignal` looked only for the first — so a
computed failed the guard for the `Signal` type it satisfies. That is not a
narrow miss. The standard `isSignal(x) ? x() : x` split then passes the
*function* on as if it were a value, so a prop reads as permanently truthy, a
style is set to a function, and nothing subscribes. Roughly a hundred call
sites across the packages were affected; the guard now accepts both markers,
which fixes them together rather than leaving the trap for the next one.

`Button.isEnabled()` returned the signal itself rather than its value, which
made every consumer wrong the same way: `if (!isEnabled)` on a function is
never true, so disabled styling never applied and the press guard never fired.
It resolves now, the way `isLoading` already did. `disabled` reaches the
renderer as a memoized inverted signal, so the attribute follows its source
instead of freezing at what it read on mount, and the click handler declines
in JS as well — a disabled button suppresses clicks natively in a browser but
not everywhere, and an action that fires anyway is the difference between a
control that looks disabled and one that is.

`disabled` is built fresh on each render rather than cached, and the identity
matters as much as the value. A render runs inside an effect, so an enclosing
component re-rendering for any reason disposes that scope and takes the
renderer's subscription with it; the renderer then diffs props by identity and
skips what has not changed, so a cached accessor would be recognised, skipped,
and never resubscribed — leaving the attribute frozen at whatever it last read.

The other half of the report — signal-driven style modifier values reading once
— was not reproducible: effects flush on a microtask, so a read in the same
task as the write is stale by design. Nothing pinned it either way, which is
why it was plausible enough to report, so `foregroundColor` and
`backgroundColor` now carry signal-update tests.

`clone-helpers` drops a local `isSignal` that tested for a `.set` no signal
accessor has ever had. It matched nothing, and signals reached the generic
branch that passes functions through by reference — the right answer for no
reason.
