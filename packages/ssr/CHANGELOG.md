# @tachui/ssr

## 0.8.20

### Patch Changes

- Updated dependencies [[`859a15a`](https://github.com/tach-UI/tachUI/commit/859a15a245cbde879a6dba2f74568d8881d74a4c)]:
  - @tachui/core@0.8.20

## 0.8.19

### Patch Changes

- [#148](https://github.com/tach-UI/tachUI/pull/148) [`b2f2522`](https://github.com/tach-UI/tachUI/commit/b2f25224d7d33e249653f90a94091287c3506f47) Thanks [@whoughton](https://github.com/whoughton)! - Ship current ready work on this branch:

  - add the new `@tachui/ssr` package with `renderToString` and `prerender`
  - resolve SSR review findings around attribute serialization, route metadata, and test coverage
  - improve release dependency guard validation with semver-accurate peer range checks plus tools test coverage
  - include current navigation, data, and modifier/type fixes from linked issue work
  - add navigation modal enhancements: `confirmationDialog(...)` and environment `dismiss` support for sheet/full-screen/popover presentations

- Updated dependencies [[`b2f2522`](https://github.com/tach-UI/tachUI/commit/b2f25224d7d33e249653f90a94091287c3506f47)]:
  - @tachui/core@0.8.19

## 0.8.18

### Patch Changes

- Initial package scaffold for TachUI server-side rendering helpers.
