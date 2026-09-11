---

---

No release. Test tiering only.

The two `FORCE_MEMORY_TESTS`-gated cases in `modifier-lifecycle` move to
`reactive/memory/modifier-subscriptions`, so the memory tier's globs reach them
and its config names nothing by path — a path nothing would notice going stale
was the rot the tier was repaired to end. Their shared mounting harness moves
beside them. The tier now runs 43 tests across 4 files, all of them memory
tests: it previously swept in 15 ordinary lifecycle tests as collateral.

`reactive-foreach`'s "500-item single update" also loses a wall-clock budget it
had been seen crossing at 303ms against a 250ms ceiling while the code it
measures was unchanged. What the test is named for is proved structurally in the
same test — one row re-rendered for a one-row change, 500 for a 500-row change —
so the timing stays only as a smoke check against a pathological regression,
with a ceiling nowhere near the real duration.
