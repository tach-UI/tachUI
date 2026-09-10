---

---

No release. `@tachui/query` is a private, in-development package.

An observed query's freshness wake-up now arms itself again when it lands
early. A timer is allowed to fire a hair ahead of the delay it was given —
Node's do, roughly once in every couple of hundred — and the wake-up was
one-shot: waking to find the window had not elapsed after all, it published a
still-fresh snapshot and scheduled nothing further, leaving `isStale` false
forever for that query. The freshness test that caught this no longer measures
the window against a fixed sleep either, since a loaded runner can overshoot a
20ms window by more than any margin worth hard-coding.
