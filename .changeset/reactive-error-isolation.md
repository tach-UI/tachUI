---
'@tachui/core': patch
---

Fix reactive error isolation (#217): a single throwing effect no longer aborts the update flush (remaining computations in the batch now complete, matching the `MicrotaskScheduler`'s per-task isolation), and a throwing computation is no longer permanently disposed — it stays subscribed to the sources it read before throwing and re-runs on their next change, so a transient error is recoverable. Errors are reported via `console.error` at both isolation layers; synchronous callers (computed reads, initial effect runs) still receive the thrown error. Note: this supersedes the v2.0 semantics where effect errors propagated out of `flushSync()` — they are now isolated and reported instead.
