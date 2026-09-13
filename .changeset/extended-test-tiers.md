---

---

No release. Test tiering and CI only.

`test:long` pointed at three files that had not existed for some time, so the
tier had been unrunnable rather than merely unrun. It now goes through
`vitest.long.config.ts`, which globs the shapes `vitest.ci.config.ts` excludes —
simulations, real-world flow integrations, the benchmark-shaped performance
checks — the way the memory tier already does: nothing is named by path, so a
moved file stays in its tier.

The stress tier was not just unrun but failing, 11 of 103, every failure in
`overlay-stress`. Its mock component still returned the pre-#302 shape — a node
with no `type` — which the renderer throws on now that the overlay materializes
content through it; the suite now uses real DOM nodes and `h()` descriptions,
as its passing sibling does. Its nested-overlay case genuinely nests, mounting
each level into the container the level above created, rather than applying
five independent overlays.

`elements/stress`'s modifier-application throughput budget sat at 1,000 ops/sec
inside the 950–1,900 band its own comment recorded, so it failed whenever the
tier ran whole and measured the machine. It drops to 100 — an order of magnitude
clear of the observed rate, and still fails any regression of the shape it
guards against.

`extended-tests.yml` runs stress, memory, long, and the CLI package nightly and
on dispatch. `test:error-recovery` is gone: its file had moved too, and the long
tier now covers it by convention.
