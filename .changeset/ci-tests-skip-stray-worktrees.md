---
'@tachui/core': patch
---

`test:ci` skips git worktrees kept in `.worktrees`, and git ignores them.

The config already skipped `.claude/**` for exactly this reason: a worktree
sits inside the checkout, the default include walks it, and the pre-push gate
ends up running another checkout's tests against this one's sources. A
worktree under `.worktrees` was not covered, so the gate collected roughly
twice the suite and failed on whatever the two checkouts disagreed about.

It was not gitignored either, which put a whole second checkout one
`git add -A` away from being committed.
