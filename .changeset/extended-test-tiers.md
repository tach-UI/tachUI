---

---

No release. Test tiering and CI only.

`test:long` is gone rather than repaired. It named three files that had not
existed for long enough that no commit in the visible history ever touched
them, so the tier had been unrunnable rather than merely unrun — but measuring
what it was protecting settled what to do about it: the 94 tests it should have
covered cost 9 seconds of a 34 second `test:ci` run. They gate every PR now.
A tier that saves seconds is not worth the suites falling out of sight, which
is the whole shape of this issue.

The stress tier was not just unrun but failing, 11 of 103, every failure in
`overlay-stress`. Its mock component still returned the pre-#302 shape — a node
with no `type` — which the renderer throws on now that the overlay materializes
content through it; the suite now uses real DOM nodes and `h()` descriptions,
as its passing sibling does. Its nested-overlay case genuinely nests, mounting
each level into the container the level above created, rather than applying
five independent overlays.

Two wall-clock budgets had never been measured against the machines that run
them. `elements/stress`'s modifier-application throughput sat at 1,000 ops/sec
inside the 950–1,900 band its own comment recorded, so it failed whenever the
tier ran whole; it drops to 100. `baseline-benchmarks`'s proxy-overhead gate
read `process.env.CI ? 0.5 : 4` — tighter on CI, on the assumption that CI is
the controlled environment — and a hosted runner read 1.36 on the first run the
gate ever had; 4 is now the only ceiling. Both stay an order of magnitude clear
of the observed rate and still fail the regressions they name.

`extended-tests.yml` runs what genuinely costs minutes — stress, memory, and
the CLI package — nightly and on dispatch. `test:error-recovery` is gone with
`test:long`: its file had moved too, and it now runs in `test:ci` with the rest.

Two things the repaired tiers made visible, now fixed rather than filed.

The CLI package's 74 disabled cases move from `it.skip` to `it.todo`. They are
not coverage someone switched off: `generate` asserts a dozen flags that do not
exist, `migrate` two more, and `analyze` a `--json` mode and three report
sections that were never written, while several `dev` cases would start a real
dev server if they ran. `skip` reads as "temporarily off" and hid that; `todo`
reads as "specified, not built", which is what they are. The reporter now says
74 todo, and each file says what is missing.

`registry`'s `createdAt` test asked whether the global registry's timestamp was
within 1000ms of the moment the test ran. `createdAt` is stamped in the
constructor and the global is built when the module first loads, so that
measured how long the suite took to reach the test — it had been seen failing
in a full run and passing alone. It now constructs a registry through
`createIsolatedRegistry()` and makes the same claim about that one, where it is
deterministic, keeping only what holds for the global: a real moment, in the
past.
