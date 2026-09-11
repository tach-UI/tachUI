---

---

No release. Test assertions only.

Widens 121 wall-clock budgets across 37 test files, and records the policy
behind it.

A timing assertion in this suite is a guard against a pathological regression,
never a performance target — but most were set close enough to the real
duration to cross on a loaded machine, measuring the machine rather than the
code. Two were caught failing that way in a single afternoon, each passing in
isolation immediately afterwards, and several tripping together is what an
unreproducible multi-file failure looks like from the outside.

Budgets already a second or more are untouched. Everything tighter is an order
of magnitude clear of the work it measures. Where a comment restated the old
number it is gone rather than left describing a threshold that moved.
