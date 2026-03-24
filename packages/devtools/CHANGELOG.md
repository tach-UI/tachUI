# @tachui/devtools

## 0.8.8

### Patch Changes

- [#84](https://github.com/tach-UI/tachUI/pull/84) [`78ab143`](https://github.com/tach-UI/tachUI/commit/78ab143a2bcb99092d70d1fa65c3e827e2cccc70) Thanks [@whoughton](https://github.com/whoughton)! - Release catch-up for npm parity and release workflow migration:

  - trigger publication for all current publishable `@tachui/*` packages so npm versions align with the repository baseline
  - preserve `@tachui/core`, `@tachui/types`, and `@tachui/registry` fixed-group behavior during versioning

  CLI and release hardening included in this release:

  - improve default TachUI version resolution with registry-first lookup and compatibility-map fallback behavior
  - validate `--tachui-version` inputs and improve fallback messaging
  - strengthen template package-root resolution
  - expand packed smoke coverage for `npx`/tarball flows and update CI smoke enforcement
  - align CLI docs and tests with the new init/version-resolution behavior

- Updated dependencies [[`78ab143`](https://github.com/tach-UI/tachUI/commit/78ab143a2bcb99092d70d1fa65c3e827e2cccc70)]:
  - @tachui/core@0.8.8
  - @tachui/primitives@0.8.8
  - @tachui/registry@0.8.8
