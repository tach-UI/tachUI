# Git Auth Pin — per-repo GitHub account pinning

Pin a specific git clone to a specific GitHub account, so pushes keep working
even when your globally-active `gh` account is switched to something else
(e.g. a work account).

## The problem

With `gh auth setup-git`, git delegates credentials for github.com to the
GitHub CLI, which answers with the token of its **currently active account**.
The active account is global — one `gh auth login` (new account) or
`gh auth switch` flips it everywhere. Consequence:

- You switch to your work account → every `git push` in personal repos now
  authenticates as the work account → `403` on repos it can't write:

  ```
  remote: Permission to OWNER/REPO.git denied to OTHER_ACCOUNT.
  fatal: unable to access 'https://github.com/OWNER/REPO.git/': The requested URL returned error: 403
  ```

- The only fix without pinning is remembering to `gh auth switch` back —
  fragile, and it flips credentials for *all* your repos at once.

## The fix

A **repo-local credential helper** that resolves the token for a specific
account at push time — from gh's keyring, so nothing sensitive lands in
config and there is no expiry date to track (the token is read fresh on
every push).

### Setup

Run inside the target repo clone:

```bash
# 1. Clear any inherited helpers for github.com in this repo
git config --local --unset-all credential.https://github.com.helper

# 2. Reset marker FIRST, then the pinned helper — ORDER MATTERS (see below)
git config --local --add credential.https://github.com.helper ''
git config --local --add credential.https://github.com.helper \
  '!f() { echo "username=YOUR_ACCOUNT"; echo "password=$(gh auth token --user YOUR_ACCOUNT)"; }; f'

# 3. Verify: the list must show exactly two entries (an empty line + the script)
git config --local --get-all credential.https://github.com.helper
```

Replace `YOUR_ACCOUNT` with the account that should own pushes in this repo
(your username, not an org). For GitHub Enterprise, change the config key's
host (e.g. `credential.https://github.mycompany.com.helper`).

### Why the empty-string reset marker matters

Git runs credential helpers **in config order** — keychain, then global, then
local — and stops at the first helper that returns a usable credential. A
pinned helper alone therefore never runs: the global `gh` helper answers
first with the *active* account's token.

An empty helper string is git's documented **reset**: it discards the list of
helpers accumulated so far. With `''` first and the script second, the
effective sequence for this repo becomes *reset → pinned script*, so the
global helper is never consulted.

Configured correctly, the local section reads:

```
[credential "https://github.com"]
    helper =
    helper = !f() { echo "username=YOUR_ACCOUNT"; echo "password=$(gh auth token --user YOUR_ACCOUNT)"; }; f
```

## Verify it works

Flip your active account to the *other* one and push — the push must still
succeed as the pinned account:

```bash
gh auth switch --user OTHER_ACCOUNT
git push                      # should succeed, authenticated as YOUR_ACCOUNT
gh auth switch --user YOUR_ACCOUNT   # restore your preferred default
```

If it still 403s as the other account, the reset marker is missing or not
first — re-run step 2 with `--add` in the exact order shown.

## Requirements & caveats

- The pinned account must stay logged into `gh` (`gh auth login`). When its
  token expires, re-login once — no config changes needed.
- The setting is **clone-local** (lives in `.git/config`, never committed).
  Fresh clones need the same setup. A shell alias/function can automate the
  three commands if you do this often.
- Both accounts must be logged into `gh` for `gh auth token --user` to
  resolve (`gh auth status` lists them).
- Other repos are unaffected — they keep following the globally active
  account.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Push 403s as the *other* account | Reset marker missing/not first | Re-run step 2 exactly as shown |
| `gh auth token --user X` errors | Account not logged into gh | `gh auth login` for that account |
| Push asks for username/password interactively | Helper script typo | Check `git config --local --get-all credential.https://github.com.helper` output |
| Works locally, fails in CI | CI uses its own credential config | Out of scope — pin via deploy keys or app tokens there |
