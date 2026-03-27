---
'@tachui/core': minor
---

Update `ZStack` to use content sizing by default so one child remains in normal document flow, preventing sibling overlap in common section-layout usage.

Add explicit `sizing` modes (`'content' | 'priority' | 'explicit'`) and `sizingChildIndex` for precise control.
