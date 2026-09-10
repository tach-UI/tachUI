---

---

No release. `@tachui/query` is a private, in-development package.

Adds `createMutation`, the imperative write primitive (#281). A mutation is a
one-shot the caller starts, so it carries none of a query's ambiguity about
what a request means: there is no fetch status beside its status, nothing
starts on its own, and nothing retries — a write that failed halfway is the
application's to reason about, not this package's to repeat.

`status` moves idle → pending → success or error, and `isPending` mirrors
`isLoading` on queries so `Form({ submitting: mutation.isPending })` is
supported by the interface rather than only by example; it is pending
synchronously, on the same turn the submit handler runs. `invalidates` names
key prefixes to mark on success, which the observers beneath them reload.
`optimisticUpdate` is opt-in and applies before `run` starts; whatever it
returns reaches `onError`, which is where the change is undone, and the server
stays authoritative throughout — a rollback that lands after a concurrent
invalidation undoes only what the optimistic update did, leaving the newer
reloaded value in place. An `optimisticUpdate` that throws itself still reaches
`onError`, with nothing to roll back, so one hook covers every path that ends
in failure.

`cancel()` aborts every call still in flight and takes the rollback with it,
including when the `run` ignores its signal and answers anyway: honouring that
answer would leave an optimistic change applied after a cancel with nothing
left to undo it. Owner disposal cancels the same way, and a `mutate()` started
after disposal is refused rather than run into a torn-down owner. `reset()`
returns the state to idle without aborting — the write may already have
reached the server — so a call still running lands on a result nobody is
holding.

Concurrent calls are allowed, since two submits of one form both reach the
server. The signals describe the call that started last, so an earlier one
landing afterwards cannot repaint the state, while every call still settles its
own promise and runs its own hooks.

The state and the promise report different things, and deliberately: the state
describes the mutation, the promise describes everything the caller asked to
happen. A throwing `onSuccess` or an unusable invalidation prefix rejects
`mutate` while `status` stays `success`, because the record exists on the
server and showing a failure for it would be a lie. On the failure path the
mutation's own error is what surfaces — a rollback's bug does not replace the
server's answer for the code branching on it. `onSettled` runs on both paths.

A mutation with nothing to invalidate resolves no client at all, so a
server-rendered form does not throw for a dependency it does not have.

Closes a review round. `cancel()` now ends a call whose `run` ignores its
signal and never settles: the run is raced against the abort rather than
simply awaited, so a non-cooperative transport can no longer leave the promise
pending for good, the status stuck at `pending`, a form permanently
submitting, and an optimistic update with nothing to undo it. Cancellation
surfaces the abort reason whatever the run reports, so a transport adapter
mapping cancellation onto its own error codes has an invariant to rely on.

`optimisticUpdate` runs synchronously, and an `async` one — which infers
`TContext` as a promise and type-checks — is now refused rather than handing
`onError` a pending promise as the value to roll back to. Every `invalidates`
prefix is attempted rather than the list abandoned at the first unusable one,
which would leave the prefixes before it marked and the ones after it
untouched. The prefix list is copied at creation, so the caller's array stays
theirs and a later push cannot change what the mutation invalidates — or ask
for an invalidation with no client ever resolved to perform it.
