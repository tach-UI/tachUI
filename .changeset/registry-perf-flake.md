---

---

No release. Test-only change.

Deflakes the two lookup-timing assertions in
`packages/registry/src/__tests__/performance.test.ts`. Both averaged 100
wall-clock samples against a 0.1 ms budget, and a mean is the wrong summary
for timing: noise only ever makes a run slower, so a single GC pause among the
samples moves the average past the budget on its own. That is how it failed
under parallel-suite load (0.181 against 0.1) while every individual lookup was
fast. They now take the median of the same samples after a warm-up, which is
what "constant time" is claiming — the typical lookup rather than the
unluckiest one. Budgets unchanged.
