---
'@tachui/cli': patch
---

The CLI's `glob` dependency moves from `^10.0.0` to `^13.0.0`. Commands that
scan files (`analyze`, `optimize`, `migrate`, `migrate remove-modifier-trigger`
and the import optimizer) match the same files for the same patterns and
`--ignore` options.
