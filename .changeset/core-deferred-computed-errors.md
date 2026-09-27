---
'@tachui/core': patch
---

A computed that throws while it is re-evaluated after a computed it reads has
changed no longer escapes as an uncaught exception. The failure is isolated the
way a throwing computation in an update flush already is: its readers see the
error when they read it, and it recovers once its sources change again.
