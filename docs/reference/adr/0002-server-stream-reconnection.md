# ADR 0002: Server-Stream Reconnection

- **Status:** Accepted
- **Date:** 2026-09-28
- **Supersedes:** none
- **Resolves:** the server-stream reconnection policy that
  [ADR 0001](./0001-data-and-communications-architecture.md) left under *Deferred*
- **Depends on:** #289, the server-stream adapters `createConnectStream` and
  `createConnectStreamList`

## Context

ADR 0001 decision 19 says nothing retries automatically by default and that, where retry is
enabled, only `unavailable` and `resource_exhausted` are eligible, with capped exponential
backoff. It left open whether a server stream should ever reconnect, and how. This record
decides whether the two Connect server-stream adapters should offer *opt-in* automatic
reconnection on top of that default. Whatever it decides, the default stays: no stream
reconnects unless something asks it to.

### The baseline this record depends on

#289 defines the adapters' contract, and this record treats that contract as its
dependency. The adapters are in-tree
([`packages/connectrpc/src/stream.ts`](../../../packages/connectrpc/src/stream.ts)) but
`@tachui/connectrpc` is still `private` and has not been published: it reaches npm at the
0.12.0 line move ([README, Status](../../../packages/connectrpc/README.md#status)). Nothing
below describes behavior any application has received yet. It describes the contract #289
settled, and if that contract changes before or after release, this record has to be read
again against the change.

The parts of that contract this record relies on:

- **No automatic retry or reconnect, and no `reset()`.** A stream that completed or failed
  stays that way until `connect()` starts a fresh call, which clears what the last one
  retained. A changed key starts a new subscription rather than recovering the old one
  ([README, Server streams](../../../packages/connectrpc/README.md#server-streams);
  `ConnectStreamOptions` in
  [`types.ts`](../../../packages/connectrpc/src/types.ts)). The adapter test
  *never retries a failed or completed call* pins this: a stream broken with `unavailable`
  is still `error` a simulated minute later, and no second call was made.
- **The lifecycle is `@tachui/query`'s.** The adapters supply a key and an `open`, and
  `createAsyncStream` / `createAsyncStreamList` do the rest through one shared connection
  ([`create-async-stream.ts`](../../../packages/query/src/create-async-stream.ts),
  `createStreamConnection`). Whatever is true of one mode's lifecycle is true of the other's,
  so this record decides for both adapters at once.
- **Errors are typed `unknown`.** A call's `ConnectError` reaches `error` unchanged, but so
  do local failures: a request that cannot be keyed is a `ConnectAdapterError`, and a throwing
  `reduce`, `initial`, or `itemKey` ends the stream with whatever it threw.
- **Caller abort and deadline are failures, not hang-ups.** An application
  `callOptions.signal` or `timeoutMs` that ends the call reports `error` with a
  `ConnectError` coded `canceled` or `deadline_exceeded`. The signal is bound for the
  result's lifetime: once it aborts, every later `connect()` fails with `canceled` and makes
  no call. A deadline applies to each call.

### What Connect reports when a stream breaks

Whether an allowlist-based reconnect helps depends on which code a real disconnect carries.
In `@connectrpc/connect` and `@connectrpc/connect-web` 2.2.0, the versions this workspace
installs:

| What happened | Code the stream's `error` carries |
|---|---|
| The server ended the stream with an error, for example `unavailable` while draining | The server's code |
| An HTTP 429, 502, 503, or 504 answered the call | `unavailable` (the protocol's `codeFromHttpStatus`) — but this happens while *opening* |
| The connection dropped mid-stream: network loss, a proxy idle timeout, the server process going away | `unknown` |
| The response body ended without the Connect end-stream message or gRPC-Web trailer | `unknown` (the transports throw the strings `"missing EndStreamResponse"` and `"missing trailer"`) |
| `fetch` itself rejected, as it does while offline | `unknown` |

Every row after the first two passes through `ConnectError.from(reason)` in the call runner,
whose default code is `unknown`. So the most common way a browser stream breaks, the
connection going away, is *not* `unavailable`. A re-open attempted while the browser is
still offline fails as `unknown` too.

## Decision

1. **Opt-in automatic reconnection is not recommended for `createConnectStream` or for
   `createConnectStreamList`.** Neither adapter gains a reconnect option, and
   `@tachui/query`'s stream primitives gain no reconnect hook for them. The
   no-automatic-reconnect default ADR 0001 requires is unchanged, and an opt-in to reconnect
   does not exist either.
2. **A failure before the stream first opens stays terminal.** `connect()` rejects with it
   and the stream reads `error`. Nothing retries it, now or under any later revision of this
   record.
3. **Reconnection is the application's, through `connect()`.** An application that wants a
   stream to come back calls `connect()` again, under its own policy. Every such call starts a
   new sequence with cleared state, exactly as #289 specifies. The rest of this record says
   what an application sees when it does that, and which failures it can reasonably
   reconnect on.
4. **Revisit only when the reasons below change** (see [Revisiting](#revisiting)). Adopting
   reconnection later needs an amendment to this record and its own implementation issue,
   and must keep the default off and the first opening terminal.

### Why not

**The allowlist does not match how streams break.** ADR 0001 permits automatic retry only
for `unavailable` and `resource_exhausted`. As the table above shows, those codes come from a
server that says it is overloaded or draining, or from a gateway answering the call before
it opens. A dropped connection, a proxy timeout, and an offline browser all arrive as
`unknown`. An opt-in reconnect held to the allowlist would miss the commonest disconnect,
and would give up at once on an attempt made before the network returned, while appearing
to promise resilience. That is worse than no option: an application that set it would find
out in production that its feed died anyway.

Widening the allowlist to `unknown` is not an answer. `unknown` is also what a server
handler's unexpected fault reports, so reconnecting on it re-runs a subscription that is
failing for a reason reconnecting cannot fix. It would also contradict decision 19, which
this record has no mandate to amend. Telling a network drop apart from a server fault by
inspecting the error's `cause` or message would depend on Connect-ES internals: the strings
in the table are implementation details, not a contract.

**Nothing can make a reconnect lossless.** Connect server streams have no general cursor or
replay. Messages sent between the break and the re-open are never delivered. A reconnect has
two choices, and neither is honest on its own:

- *Retain* what the stream held and fold new messages onto it. In collection mode a repeat
  `itemKey` updates its row in place, so a server that opens each subscription with a
  snapshot does not duplicate rows. But a row the server removed during the gap stays on
  screen, and nothing can say which ones they are. In reduction mode a counting or summing
  `reduce` counts a snapshot's messages twice. The result looks continuous and is not.
- *Clear* it, as `connect()` does. That is correct, and is exactly what an application
  already gets by calling `connect()`. The only thing the library would add is the timer.

**Distinguishing a reconnect would change a public contract that was built to exclude
one.** To tell a pending retry and a successful retry apart from a first connection, a
consumer would need something the six-value `AsyncStreamStatus` does not carry: a status
that can read `connecting` while `error` holds the failure that caused the retry, which
`connect()` never produces today, plus attempt and reconnect counters on both result
types. That change would land in the backend-neutral `@tachui/query` primitive, whose own
documentation states that a subscription that silently re-established itself would be
indistinguishable from one that never dropped
([`create-async-stream.ts`](../../../packages/query/src/create-async-stream.ts),
`createStreamConnection`). Paying that cost for a feature that misses the commonest
disconnect is not worth it.

**An application can already do this correctly, and knows more.** An application can see
signals no library policy can: `navigator.onLine` and the `online` event, whether the view
is visible, whether its server resends a snapshot, whether its `reduce` is idempotent. It can
reconnect on `unknown` when it knows its backend's faults are rare, and it can keep a copy of
the rows it wants to survive a reconnect. The library's part is an honest lifecycle and a
`connect()` that starts a clean sequence, and both already exist.

## Failure classification

What ends a stream, and whether it is a failure any reconnection (the application's, or a
future library policy's) may treat as reconnectable. "Eligible" never means the library
reconnects: under this record it never does.

| Ending | Status and error | Eligible? |
|---|---|---|
| Opening fails: the transport rejects, `open` throws, or `open` returns something not iterable | `error`, with the failure; `connect()` rejects | **No, ever.** Terminal before the first open. |
| Post-open `ConnectError` with `unavailable` or `resource_exhausted` | `error`, with the `ConnectError` as raised | **Yes.** These are ADR 0001's allowlist. |
| Post-open `ConnectError` with `unknown` | `error` | **No.** It includes network drops, but also server faults, and the two cannot be told apart from the code. An application that knows its backend may choose to reconnect on it; that is outside decision 19, and is its own call. |
| Post-open `ConnectError` with `canceled` | `error` | **No.** The application's own signal ended the call, and a bound signal fails every later `connect()` anyway. |
| Post-open `ConnectError` with `deadline_exceeded` | `error` | **No.** The deadline is the caller's; retrying spends time past it. |
| Post-open `ConnectError` with any other code: `invalid_argument`, `not_found`, `already_exists`, `permission_denied`, `unauthenticated`, `failed_precondition`, `aborted`, `out_of_range`, `unimplemented`, `internal`, `data_loss` | `error` | **No.** Each is an answer about the call or the server, and the same call gets the same answer. |
| A key that cannot be built or hashed: a `ConnectAdapterError`, or `@tachui/query`'s `QueryError` | `error`, published by the key effect; any open call is detached | **No.** A correction to the key clears the error and, under `autoConnect`, connects the corrected key. That is a new sequence, not a retry. |
| `reduce`, `initial`, or `itemKey` throws | `error`, with what it threw | **No.** The same message would throw again, and the state it was folding into can no longer be trusted. |
| The server completes the stream | `completed` | Not a failure. The server said there is no more. |
| `cancel()` while connecting or open | `cancelled` | Not a failure. The caller hung up. |
| Owner disposal | Nothing published; the owner is going away | Not a failure. Later `connect()` throws a `QueryError`. |
| Explicit `dispose()` | `cancelled` if it was connecting or open, otherwise unchanged | Not a failure. Later `connect()` throws. |
| A fresh `connect()` by the caller, or a changed key under `autoConnect` | `connecting`, error cleared, state cleared | Not a failure, and not a retry: a new sequence. |

`unavailable` and `resource_exhausted` are the only reconnectable codes because ADR 0001
names them, and because both say the server could not take the subscription *now*. This
record keeps that allowlist as the ceiling for streams and does not widen it. For a stream,
`resource_exhausted` often means a quota or rate limit on the subscription itself, so an
application reconnecting on it should back off more, not less, than it would for
`unavailable`.

## Retry settings

This record sets no backoff progression, initial delay, multiplier, cap, jitter, stopping
rule, or reset condition. They would configure a scheduler, and there is none: the library
never waits to reconnect, so nothing has a delay to tune.

Invalidating an attempt that has gone stale is already solved, because it does not depend
on who started the attempt. Every `connect()`, `cancel()`, `dispose()`, owner cleanup, and
key change bumps the connection's generation and aborts its controller before anything else
happens (`detach`, `owns`, and the guards in `pump` and `connect` in
[`create-async-stream.ts`](../../../packages/query/src/create-async-stream.ts)). A message
loop or an opening from an older generation cannot publish a message, a status, or an error
over the newer one, and a source that arrives after its attempt was abandoned is closed
rather than leaked. The adapter adds the application signal and deadline to the same abort
([`stream.ts`](../../../packages/connectrpc/src/stream.ts), `openCall`), so they end a
pending message wait too.

An application that schedules its own reconnection owns its timer, and has to cancel it:

- when it decides to stop: while its timer is pending the stream already reads `error`, and
  `cancel()` does nothing to a stream that is not connecting or open, so the stream cannot
  stop the timer. The application's own "stop" has to clear it, or the timer calls
  `connect()` and undoes the hang-up;
- on owner cleanup or `dispose()`: a stale timer's `connect()` throws a `QueryError` rather
  than reconnecting, but the timer should not fire at all;
- on a key change under `autoConnect`: the stream has already connected the new key, and a
  stale timer would restart that sequence and throw away what it had received;
- on a manual `connect()`: the application's own call supersedes the scheduled one;
- on caller abort: once `callOptions.signal` aborts, every `connect()` fails with `canceled`
  and makes no call, so the policy has to stop rather than burn its attempts;
- on timeout: a `deadline_exceeded` ending is not eligible, and each `connect()` gets a fresh
  deadline, so the policy should not use `connect()` to extend one.

Scheduling the timer from an effect that reads `status()`, and clearing it with
`onCleanup`, covers owner cleanup, a key change, and a manual `connect()`. An
execution-scoped cleanup runs before each re-run of the effect and when its owner is
disposed ([`context.ts`](../../../packages/core/src/reactive/context.ts), `onCleanup`), and
the last two both move the status to `connecting`. It does not cover the application's own
stop or an explicit `dispose()` during the wait: neither changes a status that already reads
`error`, so the application clears the timer there itself. Caller abort needs no timer
handling, because the classification table already makes `canceled` ineligible.

For the shape of the backoff, ADR 0001's rule applies: capped exponential, with full jitter,
and a bounded number of attempts. Numbers suited to a subscription are larger than the unary
retry's 100 ms base and 2 s cap, since a whole fleet of browsers re-opening subscriptions
after a server restart is the load the jitter exists to spread. An application should only
reset its attempt budget once a re-opened stream has delivered a message, not merely when it
opens: a server that accepts a subscription and fails it at once would otherwise keep the
budget at its first attempt forever.

## What a consumer sees

### What the current primitive retains

The stream retains what it accepted after it ends, whether it completed, was cancelled, or
failed: `latest`, the fold's `value`, and the rows stay as they were at the last message the
stream accepted. A throwing `reduce` leaves `latest` at the last message it could process,
not the one that failed (*leaves latest where it was when the fold throws*), and a cancelled
list keeps its rows (*keeps the lifecycle it shares with reduction mode*) in
[`create-async-stream.test.ts`](../../../packages/query/__tests__/create-async-stream.test.ts).

Every `connect()` resets that state at its *start*, before the opening is known to succeed:
the sink's `reset` runs first, inside the opening guard. So an opening that then fails leaves
the stream empty, not holding the previous sequence's state. A key change resets it the same
way (*reconnects on a key change and starts the fold over*, *clears the collection when the
stream reconnects*).

### The four moments of a reconnection

Under this decision every reconnection is an application calling `connect()`:

| Moment | `status` | `error` | `latest`, `value`, rows |
|---|---|---|---|
| **Disconnect**: an eligible failure after opening | `error` | The failure, as raised | Retained as of the last accepted message |
| **Pending retry**: the application waits before calling `connect()` | `error`, unchanged | Unchanged | Still retained. The library knows nothing is pending, so any "reconnecting" indicator is the application's. |
| **Retry opening**: the application calls `connect()` | `connecting` | Cleared | **Cleared at once**, before the opening resolves |
| **Successful retry**: the call opens | `open` | `undefined` | Empty, rebuilt from the new call's messages only |
| **Final failure**: the application stops trying | `error` | The last attempt's failure | Empty if the last attempt failed while opening; what it accepted, if it failed after opening |

An application that wants the old rows on screen through a reconnect has to keep its own
copy before it calls `connect()`, and decide itself when the new sequence has caught up
enough to replace it. That is deliberate: it keeps the question of whether stale rows are
acceptable with the only code that can answer it.

### Gaps and duplicates without a cursor

Connect server streams carry no server-defined cursor or replay protocol, so:

- **Gaps are always possible.** Anything the server sent between the break and the re-open
  is never delivered. That includes deletions, so a list rebuilt from a stream that only
  sends changes misses rows that disappeared.
- **Duplicates relative to the screen are possible, but not in state.** A server that opens
  each subscription with a snapshot resends what the application had already seen. Because
  `connect()` clears state first, the snapshot is not applied twice, and a counting fold
  starts over rather than double-counting. The cost is that the fold's history before the
  break is gone.
- **Nothing in the library can fix either.** Resuming without loss needs a resume token the
  server issues and honors, carried on the request the way `pageParamKey` carries a page
  token for infinite queries. That is a protocol each backend would define, and lossless
  replay, exactly-once delivery, and resume are outside this record.

## Lifecycle and observation

Stream lifetimes are **owner-scoped**, not observation-scoped (`autoConnect` on
`AsyncStreamBaseOptions` in [`types.ts`](../../../packages/query/src/types.ts)). With
`autoConnect` on, the default in the browser, a stream connects when it is created and
disconnects when the owner that created it is disposed. Nothing tracks who is reading its
signals: the stream's only effect reads the key, so reading `latest` or `status` or
ceasing to read them changes nothing.

So **ceasing to observe a stream and then observing it again neither disconnects nor
reconnects it.** The subscription ran the whole time. There is nothing to resume and
nothing is restarted. A reader that returns sees the current state, which may be a terminal
one the stream reached while nobody was looking. Letting a stream's lifetime follow its
observers is separate work, tracked by #357. That work changes when a stream should be open
at all, so it is one of the reasons to revisit this record.

This record defines a **failure retry** as re-opening the same key within one sequence after
an eligible failure, keeping the sequence's state and identity. Three things look similar
and are not retries. Each starts a **new sequence**, with state and error cleared:

- an explicit `connect()`, which is also how an application reconnects under this decision;
- a key change under `autoConnect`, which detaches the old call and connects the new key;
- creating a new result, for example because a new owner rendered the component that
  creates it.

Under this decision no failure retry exists, so every re-opening is a new sequence.

How the rest of the lifecycle bears on reconnection:

- **`autoConnect: false`** keeps the stream `idle` until `connect()`. A key change only
  detaches a call that is connecting or open, reporting `cancelled`; it never opens the new
  key. Nothing opens without the caller.
- **Manual `cancel()`** reports `cancelled`, but only while connecting or open, so it never
  overwrites how a stream actually ended. Nothing opens again until `connect()`.
- **Owner disposal** tears the stream down without publishing a status, since nothing is
  left to read it. A later `connect()` throws a `QueryError`.
- **Explicit `dispose()`** is for a stream held somewhere its owner outlives it, or created
  outside any owner. Outside an owner, `onCleanup` has nothing to register with, so
  `dispose()` is the only thing that ever tears the stream down. It reports `cancelled` if
  the stream was connecting or open, and a later `connect()` throws.
- **Server rendering** never opens a stream on its own: the adapters force `autoConnect` off
  when `isServer()` is true. So no reconnection question arises during a render.

## Telling a reconnect from a first connection

No distinction is proposed, because the library never reconnects. Every `open` is the first
connection of its sequence, and every `error` is final as far as the library is concerned.
The six-value `AsyncStreamStatus` is unchanged. So is `connect()`: it resolves once the call
is open and rejects if opening fails. After that it has no promise left to reject, so a
later failure changes only `status` and `error`.

When `cancel()`, a key change, or `dispose()` races an opening, `connect()` has no single
fixed outcome. It rejects if the abort wins the race against `open`. It resolves with
`undefined` if the source arrived just before the cancel was applied: the test *drops a
source that arrived in the gap before the cancel landed* shows the stream reading
`cancelled` after the promise resolved. A caller must read `status()` after `connect()`
settles rather than infer the outcome from the promise.

The practical effect on consumers:

- **An application that does not reconnect** writes nothing new. `error` means the stream
  is over, which is what #289 already documents.
- **An application that reconnects** counts its own attempts. It can tell a retry apart from
  the first connection because it made the call. It first checks that the failure came after
  the stream reached `open` in the current sequence: its `connect()` resolved and `status()`
  then read `open`, or an effect saw `open` before `error`. Only then does it narrow
  `error()` with `instanceof ConnectError` and check `isRetryableCode(error.code)`, which
  this package already exports as ADR 0001's allowlist, before scheduling anything. A
  `connect()` that rejects failed while opening, and that failure stays terminal under
  decision 2, even when it carries `unavailable` from an HTTP 429, 502, 503, or 504: the
  application must not schedule a retry for it. It shows its own
  "reconnecting" state, since the stream reads `error` while the application waits. It keeps
  its own copy of whatever must survive the clear that `connect()` performs.

## Revisiting

Reconsider this record when any of these becomes true:

- Connect, or the transports an application can supply, reports a lost connection with a
  code or typed signal distinct from a server fault, or ADR 0001 decision 19 is amended to
  admit one.
- A backend convention for a resume token exists that the adapter can carry as it carries
  `pageParamKey`, making a reconnect that retains state gap-free for the backends that
  implement it.
- #357 introduces observation-scoped lifetimes, and so a second reason a stream closes and
  re-opens.

Adopting reconnection then means amending this record and filing its own implementation
issue. That issue has to keep the default off and the first opening terminal, and has to
specify the attempt budget, backoff, invalidation, state, and status semantics this record
declines to set.

## Consequences

- No stream implementation, test, type, or public API changes. The adapters' README already
  states *no automatic retry or reconnect*.
- Applications that need a stream to survive network drops write their own reconnection
  around `connect()`, and choose for themselves whether `unknown` qualifies.
- A reconnect always clears state, so a feed briefly empties on reconnect unless the
  application keeps its own copy.
- There is no implementation issue, because nothing was adopted.

## References

- [ADR 0001](./0001-data-and-communications-architecture.md), decisions 13, 18, 19, and
  *Deferred*
- #289 (server-stream adapters, the dependency), #357 (observation-scoped lifetimes)
- [`packages/connectrpc/src/stream.ts`](../../../packages/connectrpc/src/stream.ts),
  [`packages/connectrpc/src/types.ts`](../../../packages/connectrpc/src/types.ts),
  [`packages/connectrpc/src/defaults.ts`](../../../packages/connectrpc/src/defaults.ts)
- [`packages/query/src/create-async-stream.ts`](../../../packages/query/src/create-async-stream.ts),
  [`packages/query/src/types.ts`](../../../packages/query/src/types.ts)
- Connect-ES `ConnectError.from` and the call runner's error mapping: `@connectrpc/connect`
  2.2.0, `protocol/run-call.js` and `connect-error.js`; `@connectrpc/connect-web` 2.2.0,
  `connect-transport.js` and `grpc-web-transport.js`
