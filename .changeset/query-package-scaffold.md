---
---

No release. `@tachui/query` is a private, in-development package.

Adds the `@tachui/query` scaffold and its public type surface (#276), plus the
general size-budget gate any package can opt into via `tachui.sizeBudget`.

Nothing publishes. The package carries `"private": true` and stays that way until
the 0.10.0 line move, which is when it first reaches npm. Two rules are at work,
both to be written down in #264:

- **Born private.** `tools/check-version-line.mjs` skips private packages before
  it collects versions, so a package under development is exempt from the
  single-`major.minor` invariant every publishable package shares. That is what
  lets the 0.10.0 work proceed on `main` without blocking a hotfix patch or the
  0.9.0 line move, and it keeps a brand-new package from debuting mid-line at
  `0.8.x` with 32 patches of history it does not have.
- **This changeset is empty, not absent.** `tools/check-changesets.mjs` decides
  what is publishable from the *path* alone - `isPublishablePath` returns true for
  any `packages/<name>/` except `docs`, and never opens a manifest - so marking
  the package private does not exempt it from the changeset requirement. An empty
  changeset is the documented escape hatch named in the check's own error message
  (cf. 7a82a31).

Reproduce the real check locally, which is otherwise a silent no-op outside CI:

    GITHUB_EVENT_NAME=pull_request GITHUB_BASE_REF=main node ./tools/check-changesets.mjs
