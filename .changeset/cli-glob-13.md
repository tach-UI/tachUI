---
'@tachui/cli': patch
---

The CLI's `glob` dependency moves from `^10.0.0` to `^13.0.0`. Commands that
scan files (`analyze`, `optimize`, `migrate`, `migrate remove-modifier-trigger`
and the import optimizer) match the same files for the same patterns and
`--ignore` options.

glob 13 and its dependencies support Node 20 and 22+, but not Node 21, so the
CLI's `engines` range narrows from `>=20.0.0` to `^20.0.0 || >=22.0.0` to match.
