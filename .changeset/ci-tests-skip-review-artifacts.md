---
---

`test:ci` skips `.review-artifacts`, and git ignores it.

A pull request review checks the branch out under `.review-artifacts`, inside
this checkout. `test:ci` walked into it, as it once did `.worktrees`, so the
pre-push gate ran the review copy's tests too. They fail there, because the
copy cannot resolve the workspace packages, and the push is refused over
tests that have nothing to do with it.

No package ships any of this, so it is a deliberate no-release change.
