---
'@tachui/core': patch
'@tachui/types': patch
'@tachui/modifiers': patch
'@tachui/navigation': patch
'@tachui/data': patch
'@tachui/ssr': patch
---

Ship current ready work on this branch:

- add the new `@tachui/ssr` package with `renderToString` and `prerender`
- resolve SSR review findings around attribute serialization, route metadata, and test coverage
- improve release dependency guard validation with semver-accurate peer range checks plus tools test coverage
- include current navigation, data, and modifier/type fixes from linked issue work
