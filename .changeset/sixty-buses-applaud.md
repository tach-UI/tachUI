---
"@tachui/core": patch
"@tachui/mobile": patch
"@tachui/navigation": patch
"@tachui/primitives": patch
---

Ship semantic/accessibility and metadata fixes across navigation, primitives, mobile, and core.

- `@tachui/navigation`: make `NavigationLink` crawlable anchors with safer client-navigation interception; add per-view `DocumentHead` metadata APIs and runtime fixes for multi-stack behavior, cleanup, template warnings, and tests.
- `@tachui/primitives`: add semantic heading support (`Heading`, `Text.H1..H6`), improve toggle label/input associations, and hide spacer from accessibility tree.
- `@tachui/mobile`: improve `ActionSheet` dialog semantics/focus behavior and related test coverage.
- `@tachui/core`: remove CommonJS-style runtime access in CSS class DOM integration and cover reactive class cleanup behavior.
