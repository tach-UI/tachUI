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
