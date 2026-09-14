---

---

No release. `@tachui/query` is private and in development; `@tachui/core`'s
change is a fix to an internal list primitive.

`fetchInfiniteQuery` measured its shortfall against the wrong cache. It read
`entries` — the client the method was called on — to decide whether the held
set was long enough to serve and what a run should extend, then handed the
work to `fetchQuery`, which forwards to `options.client` when one is named.
Three pages held on the caller against one on the target answered with the one
page, which is the silent short set that logic exists to refuse; the reverse
arrangement forced a run on the target seeded with the caller's page objects.
It now forwards before reading anything, the way `fetchQuery` already did, so
the cache that decides is the cache that serves.

`createSignalList`'s tracked-key eviction recounted its candidates by scanning
the whole tracked map, on every released row. `clear()` releases every row, so
tearing down an n-row list cost O(n^2): 16,000 rows took 2311ms, which for a
long feed's `dispose()` is the main thread blocked for two seconds.
`createInfiniteQueryList.get` tracks every rendered row, so a real feed reaches
that size. The count is now maintained as rows come and go — every write to
`present` or `tracked` goes through one of four helpers that keep it — and the
same teardown takes 58ms. The common case, where nothing needs evicting, used
to pay for a full scan too and is now a single comparison.

`QueryInternals.policy` and `entryPolicy` were two near-identical accessors
with no callers anywhere; loaders read `ctx.policy`. Being properties of a
returned object literal they could not tree-shake, so they shipped. Removing
them saves 54 bytes gzipped — worth doing because dead code should not ship,
not because it changes the budget question: the 13 KB ceiling was raised for
the ~2.6 KB pagination scope ADR 0001 had deferred, and 54 bytes does not
revisit that. Lowering it back to 12 KB would leave 101 bytes of headroom and
recreate the breach the raise was reasoning about.

Also corrects a comment: `initialPageParam` is documented as the discriminator
`prefetchQueries` reads, and it is not — the branch is on
`typeof getNextPageParam === 'function'`, precisely because a plain request may
carry `initialPageParam` explicitly set to `undefined`. The `?: never`
declaration is still what keeps the union sound and stays.
