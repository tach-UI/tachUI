---

---

No release. `@tachui/query` is a private, in-development package.

Adds `createAsyncStream` and `createAsyncStreamList`, the stream primitives
(#282). A stream is a subscription rather than a request: no cache entry, no
freshness, no result to return — what it has is a lifecycle, and its three
endings stay apart. `completed` is the source saying there is no more, `error`
is it breaking, `cancelled` is us hanging up; collapsing those would leave a
consumer unable to tell a finished feed from a dropped one.

Reduction mode folds messages into a bounded value for counters, a latest
reading, or small derived state. `bufferSize` caps a fold that accumulates an
array, dropping oldest, because a fold that keeps everything is unbounded by
construction and a long-lived subscription with one is a memory leak with a
schedule. With no fold at all there is no accumulation — unbounded array
reduction is not what you get by default.

Collection mode routes through `createSignalList`, so a list updates the one
row a message touches instead of re-rendering, and per-message cost stays flat
as the collection grows. A repeat `itemKey` updates that row in place without
moving it or ageing anything out, `limit` evicts from the far end from the one
messages arrive at, and `get` reports absence for a key that has been evicted
rather than throwing — `limit` can evict a key between reading it from `ids`
and looking it up.

`connect()` answers when the subscription is established rather than when the
stream ends, since awaiting an endless feed would never return; a failure after
that point has no promise left to reject and reaches the consumer through
`status` and `error`. Every `next()` is raced against the abort, so cancelling
ends a source that ignores its signal and never yields again instead of holding
the owner's cleanup for good, and a source that arrives after its connection
was replaced is closed rather than left running. Nothing reconnects on its own:
a key change opens the new subscription and ends the old one, and without
`autoConnect` it ends the old one anyway, because streaming a key the caller
has moved off is worse than streaming nothing.

`raceAbort` moves to a shared internal module, unchanged, now that both
mutations and streams hand a signal to caller code that may ignore it.

Closes a review round. Everything that can fail while a subscription is being
established now publishes that failure rather than stranding the lifecycle: an
`open` that throws before it returns — `new EventSource(badUrl)` is the shape —
a key accessor that throws inside `connect()`, an iterator factory that throws,
and an `open` that resolves something that is not an async iterable at all.
The last of those was the worst of the four: the stream reported `open`, which
is an active claim with no message loop behind it. Under the default
`autoConnect` none of these had a promise left to reject, so a stream sat at
`connecting` for good with nothing published anywhere.

The message loop guards delivery as well as the pull, so a source that breaks
the iterator protocol ends the stream instead of throwing where nothing can
catch it, and offering a source the chance to clean up can no longer become the
reason the stream ended.

A key corrected after an unhashable one clears the error it published, rather
than describing a stream merely waiting to be connected as broken. In reduction
mode `latest` is now the last message the stream accepted rather than the one a
throwing `reduce` choked on, matching what collection mode already did.

A second round closes two narrower gaps. A cancel landing between a message
being handed over and the loop delivering it now offers the source its release
— the abort race never rejects in that window, so the loop's own exit is the
only place left to do it. And a key corrected back to the hash it had before an
unhashable one reconnects, rather than reading as no change at all and staying
disconnected for good.

`autoConnect` is documented as what it does: connect when the stream is created,
disconnect when the owner is disposed. ADR 0001 decision 28 said "when observed
/ when unobserved", which the reactive core cannot express — it exposes no
observe/unobserve hook, a stream result has four signals so "observed" has no
single answer, and disconnecting across a transient gap between renders would
drop and re-establish a real subscription and lose what it had accumulated.
Owner-scoped also matches `createQuery`, which fetches on creation rather than
on first read. Set `autoConnect: false` and drive `connect()`/`cancel()` by hand
where a subscription should outlive less than its owner. Observation scoping is
tracked in #357, for both primitives together.
